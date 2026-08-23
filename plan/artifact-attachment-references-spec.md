# Artifact attachment references

## Goal

An authenticated user uploads a chat attachment, asks an Agent to create an HTML or React
Artifact that uses it, and can reopen the conversation later with the attachment still usable.
New chat images and documents are stored in the existing production MinIO through LibreChat's S3
strategy.

## Non-goals

- Multi-file Artifact projects, standalone publishing, exports, or directories
- New sharing, ACL, or anonymous-access behavior
- Bulk migration of existing local files
- Stable embedding of mutable code-execution outputs
- CloudFront

## Contract

Artifact source stores only `attachment://<file_id>`. It never stores an S3 object key, provider
file ID, browser blob URL, runtime path, or presigned URL.

When Artifacts are enabled, the model receives a compact manifest for user-uploaded files in the
active conversation context: filename, MIME type, and exact attachment reference. Code-execution
outputs are excluded.

Before Sandpack receives HTML or React source, the LibreChat host resolves each attachment
reference through the existing authenticated file API. Browser-renderable S3 files receive a fresh
presigned URL with their real MIME type and without forced attachment disposition; other types
retain download disposition. The original Artifact source remains unchanged.

Browser-native images, audio, video, and PDFs may be used as `src` values. Other files use ordinary
links; the browser downloads unsupported types. Existing local files retain their current LibreChat
behavior and are not moved by this slice.

## Storage

Production uses a dedicated `librechat-files` bucket and a bucket-scoped credential:

```yaml
fileStrategies:
  avatar: local
  image: s3
  document: s3
  skills: local
```

```env
AWS_ENDPOINT_URL=https://minio.qianc.ltd
AWS_REGION=us-east-1
AWS_BUCKET_NAME=librechat-files
AWS_FORCE_PATH_STYLE=true
S3_URL_EXPIRY_SECONDS=3600
```

Secrets remain in production environment configuration and are never committed.

## Observable acceptance

1. Uploading an image and a non-image attachment creates S3 objects and `File` records with
   `source: s3` and durable `storageKey` values.
2. The Agent receives exact attachment references only for eligible active user uploads.
3. HTML and React Artifacts replace eligible references only in their Sandpack input; persisted
   message text still contains `attachment://<file_id>`.
4. An authorized S3 reference renders after reload and after reopening the conversation.
5. An unknown, missing, or inaccessible reference is left non-executable and does not expose file
   metadata or bytes.
6. Existing Artifact behavior without attachment references is unchanged.
7. S3 deletion is idempotent and removes object bytes before file metadata is discarded.

## Implementation boundary

- Extend the existing Artifact prompt generator with a compact attachment manifest.
- Extend the existing file download-URL path with an inline-content option; keep `fileAccess` as
  the sole authorization check.
- Resolve references in the existing Artifact-to-Sandpack hook using the existing data service and
  React Query stack.
- Configure MinIO only after focused tests pass locally.
