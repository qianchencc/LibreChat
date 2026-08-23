# Artifact attachment references handoff

## Completed

- New chat images and provider-uploaded documents use the production `librechat-files` MinIO bucket.
- Artifact-enabled Agents receive owner/tenant-scoped conversation upload manifests with exact `attachment://<file_id>` references; Agent context and code-execution outputs are excluded.
- HTML and React previews resolve stable references through the existing authenticated file URL route.
- Images, audio, video, and PDFs use inline MIME-preserving URLs. Other types retain download disposition.
- Static Sandpack mounts only after initial reference resolution, while failed references remain inert.
- S3 deletion uses idempotent `DeleteObject` without a HEAD preflight.

## Production acceptance

- Bucket-scoped MinIO credentials completed put/get/delete probes without exposing secrets.
- A real browser uploaded a PNG and `guide.txt`; both database records used `source: s3` and durable `storageKey` values.
- The model persisted two `attachment://` references and no MinIO URL in Artifact source.
- The preview loaded the MinIO image and link on first open, page reload, and a fresh browser reopening the conversation.
- The application S3 deletion function removed a production probe object; the temporary QA user, credentials, Mongo data, and six test objects were removed.

## Deliberately deferred

- Multi-file Artifact projects, standalone publishing, directories, and exports
- CloudFront and anonymous/shared Artifact attachment behavior
- Migration of existing local files
- Stable references to mutable code-execution outputs
