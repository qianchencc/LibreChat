import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '@librechat/data-schemas';
import { isEnabled } from '~/utils/common';

let s3: S3Client | null = null;
let presigningS3: S3Client | null = null;

/**
 * Initializes and returns an instance of the AWS S3 client.
 *
 * If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are provided, they will be used.
 * Otherwise, the AWS SDK's default credentials chain (including IRSA) is used.
 *
 * AWS_INTERNAL_ENDPOINT_URL overrides AWS_ENDPOINT_URL for server-side I/O only.
 *
 * @returns An instance of S3Client if the region is provided; otherwise, null.
 */
export const initializeS3 = (): S3Client | null => {
  if (s3) {
    return s3;
  }

  const region = process.env.AWS_REGION;
  if (!region) {
    logger.error('[initializeS3] AWS_REGION is not set. Cannot initialize S3.');
    return null;
  }

  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error(
      '[S3] AWS_BUCKET_NAME environment variable is required for S3 operations. ' +
        'Please set this environment variable to enable S3 storage.',
    );
  }

  const endpoint = process.env.AWS_ENDPOINT_URL;
  const internalEndpoint = process.env.AWS_INTERNAL_ENDPOINT_URL;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const config = {
    region,
    requestChecksumCalculation: 'WHEN_REQUIRED' as const,
    ...(endpoint ? { endpoint } : {}),
    ...(isEnabled(process.env.AWS_FORCE_PATH_STYLE) ? { forcePathStyle: true } : {}),
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  };

  s3 = new S3Client({ ...config, ...(internalEndpoint ? { endpoint: internalEndpoint } : {}) });
  presigningS3 = internalEndpoint && internalEndpoint !== endpoint ? new S3Client(config) : s3;

  if (accessKeyId && secretAccessKey) {
    logger.info('[initializeS3] S3 initialized with provided credentials.');
  } else {
    // When using IRSA, credentials are automatically provided via the IAM Role attached to the ServiceAccount.
    logger.info('[initializeS3] S3 initialized using default credentials (IRSA).');
  }

  return s3;
};

/** Returns the public-endpoint client used to sign browser-facing URLs. */
export const initializeS3Presigner = (): S3Client | null => {
  initializeS3();
  return presigningS3;
};
