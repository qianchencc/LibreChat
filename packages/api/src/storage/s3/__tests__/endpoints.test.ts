import { createServer } from 'http';
import { HeadBucketCommand } from '@aws-sdk/client-s3';
import type { AddressInfo } from 'net';
import type { TFile } from 'librechat-data-provider';
import type { ServerRequest } from '~/types';

jest.mock('~/files', () => ({ deleteRagFile: jest.fn() }));
jest.mock('@librechat/data-schemas', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('S3 endpoint routing', () => {
  const originalEnv = { ...process.env };
  const requests: Array<{ method?: string; path: string; body: Buffer }> = [];
  const content = Buffer.from('S3 attachment bytes');
  const retryErrorMessage =
    `http://minio.private:9000/private?X-Amz-Signature=private-signature ` +
    `test-access-key test-secret ${content.toString('base64')}`;
  let failUploadPart = false;
  let putFailuresRemaining = 0;
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    requests.push({ method: req.method, path: req.url ?? '', body: Buffer.concat(chunks) });
    if (req.method === 'PUT' && putFailuresRemaining > 0) {
      putFailuresRemaining -= 1;
      res.writeHead(503, {
        'Content-Type': 'application/xml',
        'x-amz-request-id': `put-retry-${requests.length}`,
      });
      res.end(
        `<Error><Code>ServiceUnavailable</Code><Message>${retryErrorMessage}</Message></Error>`,
      );
      return;
    }
    if (failUploadPart && req.method === 'PUT' && req.url?.includes('partNumber=')) {
      res.writeHead(403, { 'Content-Type': 'application/xml' });
      res.end('<Error><Code>AccessDenied</Code><Message>Upload denied</Message></Error>');
      return;
    }
    res.setHeader('ETag', '"test-etag"');
    if (req.url?.includes('?uploads')) {
      res.setHeader('Content-Type', 'application/xml');
      res.end(
        '<InitiateMultipartUploadResult><UploadId>test-upload</UploadId></InitiateMultipartUploadResult>',
      );
      return;
    }
    if (req.method === 'POST') {
      res.setHeader('Content-Type', 'application/xml');
      res.end(
        '<CompleteMultipartUploadResult><ETag>"test-etag"</ETag></CompleteMultipartUploadResult>',
      );
      return;
    }
    res.end(req.method === 'GET' ? content : undefined);
  });
  let publicEndpoint: string;
  let internalEndpoint: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    publicEndpoint = `http://localhost:${port}/public`;
    internalEndpoint = `http://127.0.0.1:${port}/internal/storage`;
  });

  beforeEach(() => {
    jest.resetModules();
    requests.length = 0;
    failUploadPart = false;
    putFailuresRemaining = 0;
    Object.assign(process.env, {
      AWS_REGION: 'us-east-1',
      AWS_BUCKET_NAME: 'test-bucket',
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      AWS_ENDPOINT_URL: publicEndpoint,
      AWS_INTERNAL_ENDPOINT_URL: internalEndpoint,
      AWS_FORCE_PATH_STYLE: 'true',
      S3_URL_EXPIRY_SECONDS: '120',
      S3_REFRESH_EXPIRY_MS: '',
    });
  });

  afterEach(async () => {
    const { initializeS3, initializeS3Presigner } = await import('~/cdn/s3');
    initializeS3()?.destroy();
    initializeS3Presigner()?.destroy();
    process.env = { ...originalEnv };
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it.each([false, true])(
    'routes storage operations and public links (internal override: %s)',
    async (split) => {
      if (!split) {
        delete process.env.AWS_INTERNAL_ENDPOINT_URL;
      }
      const {
        saveBufferToS3,
        getS3FileStream,
        getS3DownloadURL,
        getNewS3URL,
        refreshS3FileUrls,
        deleteFileFromS3,
      } = await import('../crud');
      const { initializeS3 } = await import('~/cdn/s3');
      const fileName = '附件 %20.txt';
      const storageKey = `files/user123/${fileName}`;
      const encodedKey = storageKey.split('/').map(encodeURIComponent).join('/');
      const filepath = await saveBufferToS3({
        userId: 'user123',
        fileName,
        basePath: 'files',
        buffer: content,
      });
      const file = {
        filepath,
        storageKey,
        user: 'user123',
        file_id: 'file-123',
        source: 's3',
      } as TFile;
      const req = { user: { id: 'user123' } } as ServerRequest;
      const stream = await getS3FileStream(req, filepath);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks)).toEqual(content);
      await initializeS3()?.send(new HeadBucketCommand({ Bucket: 'test-bucket' }));
      await deleteFileFromS3(req, file);

      const download = await getS3DownloadURL({ req, file });
      const refreshed = await getNewS3URL(filepath);
      const batchUpdate = jest.fn().mockResolvedValue(undefined);
      const [updated] = await refreshS3FileUrls([file], batchUpdate);
      expect(batchUpdate).toHaveBeenCalledWith([
        { file_id: file.file_id, filepath: updated.filepath, storageKey },
      ]);
      for (const link of [filepath, download, refreshed, updated.filepath]) {
        expect(link).toBeDefined();
        const url = new URL(link!);
        expect(`${url.origin}${url.pathname}`).toBe(`${publicEndpoint}/test-bucket/${encodedKey}`);
        expect(url.searchParams.has('X-Amz-Signature')).toBe(true);
        expect(link).not.toContain('127.0.0.1');
        expect(link).not.toContain('/internal/');
      }
      const ioPath = new URL(split ? internalEndpoint : publicEndpoint).pathname;
      expect(requests.map(({ method, path }) => ({ method, path: path.split('?')[0] }))).toEqual([
        { method: 'PUT', path: `${ioPath}/test-bucket/${encodedKey}` },
        { method: 'GET', path: `${ioPath}/test-bucket/${encodedKey}` },
        { method: 'HEAD', path: `${ioPath}/test-bucket/` },
        { method: 'DELETE', path: `${ioPath}/test-bucket/${encodedKey}` },
      ]);
      expect(requests[0].body).toEqual(content);
    },
  );

  it.each([
    { scenario: 'recovers after one PUT 503', failures: 1, attempts: 2, succeeds: true },
    {
      scenario: 'exhausts three attempts on persistent PUT 503',
      failures: Number.POSITIVE_INFINITY,
      attempts: 3,
      succeeds: false,
    },
  ])('$scenario without changing the key or body', async ({ failures, attempts, succeeds }) => {
    process.env.AWS_MAX_ATTEMPTS = '3';
    process.env.AWS_RETRY_MODE = 'standard';
    putFailuresRemaining = failures;
    const { saveBufferToS3 } = await import('../crud');
    const { logger } = await import('@librechat/data-schemas');
    const fileName = 'retry %20.txt';
    const keyPath = '/test-bucket/files/user123/retry%20%2520.txt';
    const upload = saveBufferToS3({
      userId: 'user123',
      fileName,
      basePath: 'files',
      buffer: content,
    });

    if (succeeds) {
      const url = new URL(await upload);
      expect(`${url.origin}${url.pathname}`).toBe(`${publicEndpoint}${keyPath}`);
      expect(url.searchParams.has('X-Amz-Signature')).toBe(true);
      expect(logger.error).not.toHaveBeenCalled();
    } else {
      const metadata = {
        httpStatusCode: 503,
        requestId: 'put-retry-3',
        attempts: 3,
        totalRetryDelay: expect.any(Number),
      };
      await expect(upload).rejects.toMatchObject({
        name: 'ServiceUnavailable',
        message: retryErrorMessage,
        $metadata: expect.objectContaining(metadata),
      });
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('[saveBufferToS3] Error uploading buffer to S3:', {
        name: 'ServiceUnavailable',
        code: undefined,
        ...metadata,
      });
    }

    expect(requests).toHaveLength(attempts);
    for (const request of requests) {
      expect(request.method).toBe('PUT');
      expect(request.path).toBe(requests[0].path);
      expect(request.path.split('?')[0]).toBe(`/internal/storage${keyPath}`);
      expect(request.body).toEqual(content);
    }
  });

  it('routes multipart uploads to the internal endpoint and returns a public URL', async () => {
    const buffer = Buffer.alloc(6 * 1024 * 1024, 'a');
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(buffer));
    const { saveURLToS3WithMetadata } = await import('../crud');
    const result = await saveURLToS3WithMetadata({
      userId: 'user123',
      fileName: 'large.bin',
      basePath: 'files',
      URL: 'https://source.example/file',
    });

    expect(result.bytes).toBe(buffer.length);
    expect(result.storageKey).toBe('files/user123/large.bin');
    expect(result.filepath).toContain(`${publicEndpoint}/test-bucket/files/user123/large.bin?`);
    expect(requests.map(({ method }) => method)).toEqual(['POST', 'PUT', 'PUT', 'POST']);
    expect(requests.every(({ path }) => path.startsWith('/internal/storage/test-bucket/'))).toBe(
      true,
    );
    expect(
      Buffer.concat(requests.filter(({ method }) => method === 'PUT').map(({ body }) => body)),
    ).toEqual(buffer);
  });

  it('aborts failed multipart uploads through the internal endpoint', async () => {
    failUploadPart = true;
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(Buffer.alloc(6 * 1024 * 1024)));
    const { saveURLToS3WithMetadata } = await import('../crud');

    await expect(
      saveURLToS3WithMetadata({
        userId: 'user123',
        fileName: 'failed.bin',
        basePath: 'files',
        URL: 'https://source.example/file',
      }),
    ).rejects.toThrow('Upload denied');
    expect(requests.map(({ method }) => method)).toEqual(['POST', 'PUT', 'DELETE']);
    expect(requests.every(({ path }) => path.startsWith('/internal/storage/test-bucket/'))).toBe(
      true,
    );
  });

  it.each([
    ['public', ''],
    ['public', '/'],
    ['internal', ''],
    ['internal', '/'],
  ])('resolves %s URLs with endpoint trailing slash "%s"', async (endpoint, trailingSlash) => {
    process.env.AWS_ENDPOINT_URL = publicEndpoint + trailingSlash;
    process.env.AWS_INTERNAL_ENDPOINT_URL = internalEndpoint + trailingSlash;
    const { extractKeyFromS3Url, getS3DownloadURL } = await import('../crud');
    const prefix = endpoint === 'public' ? publicEndpoint : internalEndpoint;
    const key = 'files/user123/附件 %20.txt';
    const filepath = `${prefix}/test-bucket/files/user123/%E9%99%84%E4%BB%B6%20%2520.txt?X-Amz-Signature=old`;
    expect(extractKeyFromS3Url(filepath)).toBe(key);
    expect(extractKeyFromS3Url(key)).toBe(key);
    const download = await getS3DownloadURL({
      req: {} as ServerRequest,
      file: { filepath } as TFile,
    });
    expect(new URL(download).origin).toBe(new URL(publicEndpoint).origin);
    expect(download).not.toContain('/internal/');
  });

  it('keeps legacy AWS and CDN URLs intact when endpoint prefixes differ', async () => {
    const { extractKeyFromS3Url } = await import('../crud');
    for (const url of [
      'https://test-bucket.s3.amazonaws.com/files/user123/report.pdf',
      'https://s3.us-east-1.amazonaws.com/test-bucket/files/user123/report.pdf',
      'https://cdn.example.com/files/user123/report.pdf',
    ]) {
      expect(extractKeyFromS3Url(url)).toBe('files/user123/report.pdf');
    }
  });

  it('distinguishes endpoint prefixes on the same origin', async () => {
    process.env.AWS_INTERNAL_ENDPOINT_URL = `${publicEndpoint}/internal/storage`;
    const { extractKeyFromS3Url } = await import('../crud');
    for (const endpoint of [publicEndpoint, process.env.AWS_INTERNAL_ENDPOINT_URL]) {
      expect(extractKeyFromS3Url(`${endpoint}/test-bucket/files/user123/report.pdf`)).toBe(
        'files/user123/report.pdf',
      );
    }
  });

  it.each(['public', 'internal'])(
    'resolves %s virtual-hosted URLs with endpoint prefixes',
    async (endpoint) => {
      process.env.AWS_FORCE_PATH_STYLE = 'false';
      process.env.AWS_ENDPOINT_URL = 'https://objects.example.com/public';
      process.env.AWS_INTERNAL_ENDPOINT_URL = 'http://minio.internal:9000/cluster/storage';
      const prefix =
        endpoint === 'public'
          ? 'https://test-bucket.objects.example.com/public'
          : 'http://test-bucket.minio.internal:9000/cluster/storage';
      const { extractKeyFromS3Url, getS3DownloadURL } = await import('../crud');
      const filepath = `${prefix}/files/user123/report%2520.pdf`;

      expect(extractKeyFromS3Url(filepath)).toBe('files/user123/report%20.pdf');
      const download = await getS3DownloadURL({
        req: {} as ServerRequest,
        file: { filepath } as TFile,
      });
      expect(download).toContain(
        'https://test-bucket.objects.example.com/public/files/user123/report%2520.pdf?',
      );
      expect(download).not.toContain('minio.internal');
    },
  );
});
