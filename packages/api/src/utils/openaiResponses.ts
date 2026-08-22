import { Transform } from 'node:stream';
import { Response as NodeFetchResponse } from 'node-fetch';
import type { Readable } from 'node:stream';

type HeadersLike = {
  get(name: string): string | null;
  forEach(callback: (value: string, key: string) => void): void;
};

type ResponseLike = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: HeadersLike;
  body: unknown;
  text(): Promise<string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRequestURL(input: unknown): string | undefined {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  if (isRecord(input) && typeof input.url === 'string') {
    return input.url;
  }
  return undefined;
}

function isResponsesRequest(input: unknown): boolean {
  const rawURL = getRequestURL(input);
  if (!rawURL) {
    return false;
  }

  try {
    return new URL(rawURL).pathname.replace(/\/+$/, '').endsWith('/responses');
  } catch {
    return false;
  }
}

/** Add the optional OpenAI Responses field expected by LangChain's converter. */
export function normalizeOpenAIResponsesPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  let normalizedPayload: Record<string, unknown> = payload;
  if (isRecord(payload.response)) {
    const normalizedResponse = normalizeOpenAIResponsesPayload(payload.response);
    if (normalizedResponse !== payload.response) {
      normalizedPayload = { ...normalizedPayload, response: normalizedResponse };
    }
  }

  if (!Array.isArray(payload.output)) {
    return normalizedPayload;
  }

  let changed = false;
  const output = payload.output.map((item) => {
    if (!isRecord(item) || item.type !== 'message' || !Array.isArray(item.content)) {
      return item;
    }

    let contentChanged = false;
    const content = item.content.map((part) => {
      if (!isRecord(part) || part.type !== 'output_text' || Array.isArray(part.annotations)) {
        return part;
      }

      contentChanged = true;
      return { ...part, annotations: [] };
    });

    if (!contentChanged) {
      return item;
    }

    changed = true;
    return { ...item, content };
  });

  return changed ? { ...normalizedPayload, output } : normalizedPayload;
}

function normalizeSSELine(line: string): string {
  const match = line.match(/^data:\s?(.*)$/);
  if (!match || match[1] === '[DONE]') {
    return line;
  }

  try {
    const payload = JSON.parse(match[1]) as unknown;
    const normalized = normalizeOpenAIResponsesPayload(payload);
    return `data: ${JSON.stringify(normalized)}`;
  } catch {
    return line;
  }
}

function createSSELineNormalizer() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = '';

  return {
    transform(chunk: Uint8Array): Uint8Array {
      pending += decoder.decode(chunk, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      const normalized = lines.map(normalizeSSELine).join('\n');
      return normalized.length > 0 ? encoder.encode(`${normalized}\n`) : new Uint8Array();
    },
    flush(): Uint8Array {
      pending += decoder.decode();
      if (pending.length === 0) {
        return new Uint8Array();
      }
      const normalized = normalizeSSELine(pending);
      pending = '';
      return encoder.encode(normalized);
    },
  };
}

function createSSEWebTransform(): TransformStream<Uint8Array, Uint8Array> {
  const normalizer = createSSELineNormalizer();
  return new TransformStream({
    transform(chunk, controller) {
      const normalized = normalizer.transform(chunk);
      if (normalized.byteLength > 0) {
        controller.enqueue(normalized);
      }
    },
    flush(controller) {
      const normalized = normalizer.flush();
      if (normalized.byteLength > 0) {
        controller.enqueue(normalized);
      }
    },
  });
}

function createSSENodeTransform(): Transform {
  const normalizer = createSSELineNormalizer();
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      callback(null, Buffer.from(normalizer.transform(chunk)));
    },
    flush(callback) {
      callback(null, Buffer.from(normalizer.flush()));
    },
  });
}

function isWebReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pipeThrough' in value &&
    typeof value.pipeThrough === 'function'
  );
}

function isNodeReadable(value: unknown): value is Readable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pipe' in value &&
    typeof value.pipe === 'function'
  );
}

function copyHeaders(headers: HeadersLike): Record<string, string> {
  const copied: Record<string, string> = {};
  headers.forEach((value, key) => {
    copied[key] = value;
  });
  return copied;
}

function createResponse(response: ResponseLike, body: unknown): ResponseLike {
  const init = {
    status: response.status,
    statusText: response.statusText,
    headers: copyHeaders(response.headers),
  };

  if (isWebReadableStream(response.body) || !isNodeReadable(response.body)) {
    return new globalThis.Response(body as BodyInit, init) as ResponseLike;
  }

  return new NodeFetchResponse(body as string | Readable, init) as ResponseLike;
}

async function normalizeJSONResponse(response: ResponseLike): Promise<ResponseLike> {
  const body = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    return createResponse(response, body);
  }

  return createResponse(response, JSON.stringify(normalizeOpenAIResponsesPayload(payload)));
}

function normalizeStreamingResponse(response: ResponseLike): ResponseLike {
  if (isWebReadableStream(response.body)) {
    return createResponse(response, response.body.pipeThrough(createSSEWebTransform()));
  }

  if (isNodeReadable(response.body)) {
    const transform = createSSENodeTransform();
    response.body.pipe(transform);
    return createResponse(response, transform);
  }

  return response;
}

export async function normalizeOpenAIResponsesResponse(
  input: unknown,
  response: ResponseLike,
): Promise<ResponseLike> {
  if (!response.ok || !isResponsesRequest(input)) {
    return response;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('text/event-stream')) {
    return normalizeStreamingResponse(response);
  }

  if (contentType.includes('application/json')) {
    return normalizeJSONResponse(response);
  }

  return response;
}
