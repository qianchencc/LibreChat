import { randomUUID } from 'node:crypto';
import { logger } from '@librechat/data-schemas';
import { ContentTypes, FileContext } from 'librechat-data-provider';
import type { FileMethods, IMongoFile } from '@librechat/data-schemas';
import type { ServerRequest } from '~/types';

type SaveImage = (
  url: string,
  options: {
    req: ServerRequest;
    file_id: string;
    filename: string;
    endpoint?: string;
    context: FileContext;
  },
) => Promise<IMongoFile | null>;

type ImageResult = [
  string | Array<{ type: ContentTypes.TEXT; text: string }>,
  {
    content?: Array<{ type: ContentTypes.IMAGE_URL; image_url: { url: string } }>;
    file_ids?: string[];
  },
];

export function isOpenAIImageTool(name: string): boolean {
  return name === 'image_gen_oai' || name === 'image_edit_oai';
}

export async function getGeneratedImageFile(
  {
    fileId,
    user,
  }: {
    fileId?: string;
    user: ServerRequest['user'];
  },
  findFileById: FileMethods['findFileById'],
): Promise<IMongoFile | null> {
  if (typeof fileId !== 'string' || !fileId || !user?.id) {
    return null;
  }
  const file = await findFileById(fileId, {
    user: user.id,
    tenantId: user.tenantId ?? null,
    context: FileContext.image_generation,
    type: /^image\//,
    expiredAt: null,
  });
  return file?.filepath ? file : null;
}

export async function persistGeneratedImage(
  {
    req,
    base64Image,
    outputFormat,
    toolName,
    imageIds,
    endpoint,
    signal,
  }: {
    req: ServerRequest;
    base64Image: string;
    outputFormat: string;
    toolName: 'image_gen_oai' | 'image_edit_oai';
    imageIds?: string[];
    endpoint?: string;
    signal?: AbortSignal;
  },
  saveImage: SaveImage,
): Promise<ImageResult> {
  if (signal?.aborted) {
    return ['Error: tool call failed: Image generation was cancelled.', {}];
  }

  let file: IMongoFile | null;
  const url = `data:image/${outputFormat};base64,${base64Image}`;
  try {
    file = await saveImage(url, {
      req,
      file_id: randomUUID(),
      filename: `${toolName}_img`,
      endpoint,
      context: FileContext.image_generation,
    });
    if (!file?.filepath) {
      throw new Error('Image persistence returned no file');
    }
  } catch (error) {
    logger.error('[OpenAIImageTools] Image persistence failed', {
      toolName,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return [
      'Error: tool call failed: The generated image could not be saved or delivered. Do not report success or automatically generate another image; another generation may incur an additional charge.',
      {},
    ];
  }

  if (signal?.aborted) {
    return ['Error: tool call failed: Image generation was cancelled.', {}];
  }

  const references = imageIds ? `\nreferenced_image_ids: ${JSON.stringify(imageIds)}` : '';
  return [
    [
      {
        type: ContentTypes.TEXT,
        text:
          'The image was saved and is available as an attachment. Do not repeat its description or list download links.' +
          `\n\ngenerated_image_id: "${file.file_id}"${references}`,
      },
    ],
    { content: [{ type: ContentTypes.IMAGE_URL, image_url: { url } }], file_ids: [file.file_id] },
  ];
}
