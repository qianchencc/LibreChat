import fetch from 'node-fetch';
import { logger } from '@librechat/data-schemas';
import { GraphEvents, sleep } from '@librechat/agents';
import type { Response as ServerResponse } from 'express';
import type { Agent as HttpsAgent } from 'node:https';
import type { Agent as HttpAgent } from 'node:http';
import type { URL as NodeURL } from 'node:url';
import type { ServerSentEvent } from '~/types';
import { sendEvent } from './events';
import { normalizeOpenAIResponsesResponse } from './openaiResponses';

type SSRFSafeAgents = {
  httpAgent: HttpAgent;
  httpsAgent: HttpsAgent;
};

/**
 * Makes a function to make HTTP request and logs the process.
 * @param params
 * @param params.directEndpoint - Whether to use a direct endpoint.
 * @param params.reverseProxyUrl - The reverse proxy URL to use for the request.
 * @param params.ssrfAgents - Optional SSRF-safe agents for user-provided URLs.
 * @param params.redirect - Optional redirect policy for user-provided URLs.
 * @param params.normalizeResponses - Normalize third-party Responses API output for LangChain.
 * @returns A promise that resolves to the response of the fetch request.
 */
export function createFetch({
  directEndpoint = false,
  reverseProxyUrl = '',
  ssrfAgents,
  redirect,
  normalizeResponses = false,
}: {
  directEndpoint?: boolean;
  reverseProxyUrl?: string;
  ssrfAgents?: SSRFSafeAgents;
  redirect?: fetch.RequestRedirect;
  normalizeResponses?: boolean;
}) {
  /**
   * Makes an HTTP request and logs the process.
   * @param url - The URL to make the request to. Can be a string or a Request object.
   * @param init - Optional init options for the request.
   * @returns A promise that resolves to the response of the fetch request.
   */
  return async function (
    _url: fetch.RequestInfo,
    init: fetch.RequestInit,
  ): Promise<fetch.Response> {
    let url = _url;
    if (directEndpoint) {
      url = reverseProxyUrl;
    }
    logger.debug(`Making request to ${url}`);
    const requestInit = { ...init };
    if (ssrfAgents) {
      requestInit.agent = (parsedURL: NodeURL) =>
        parsedURL.protocol === 'http:' ? ssrfAgents.httpAgent : ssrfAgents.httpsAgent;
    }
    if (redirect) {
      requestInit.redirect = redirect;
    }
    const response =
      normalizeResponses && !ssrfAgents
        ? ((await globalThis.fetch(
            url as string,
            requestInit as Parameters<typeof globalThis.fetch>[1],
          )) as unknown as fetch.Response)
        : await fetch(url, requestInit);
    if (!normalizeResponses) {
      return response;
    }

    return (await normalizeOpenAIResponsesResponse(url, response)) as fetch.Response;
  };
}

/**
 * Creates event handlers for stream events that don't capture client references
 * @param res - The response object to send events to
 * @returns Object containing handler functions
 */
export function createStreamEventHandlers(res: ServerResponse): {
  on_run_step: (event: ServerSentEvent) => void;
  on_message_delta: (event: ServerSentEvent) => void;
  on_reasoning_delta: (event: ServerSentEvent) => void;
} {
  return {
    [GraphEvents.ON_RUN_STEP]: function (event: ServerSentEvent): void {
      if (res) {
        sendEvent(res, event);
      }
    },
    [GraphEvents.ON_MESSAGE_DELTA]: function (event: ServerSentEvent): void {
      if (res) {
        sendEvent(res, event);
      }
    },
    [GraphEvents.ON_REASONING_DELTA]: function (event: ServerSentEvent): void {
      if (res) {
        sendEvent(res, event);
      }
    },
  };
}

/**
 * @deprecated No longer used internally: stream pacing lives in
 * `@librechat/agents` (adaptive smoothing via `_lc_stream_delay` /
 * `streamRate`), and LangChain runs callback handlers in the background, so
 * a sleep here never paced token delivery. Kept as a compatibility shim for
 * external `@librechat/api` consumers; removal is reserved for a major
 * release.
 */
export function createHandleLLMNewToken(streamRate: number) {
  return async function (): Promise<void> {
    if (streamRate) {
      await sleep(streamRate);
    }
  };
}
