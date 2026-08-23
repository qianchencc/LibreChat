# S3 Object Lifecycle

- Treat `DeleteObject` as the idempotent existence check and deletion operation. Avoid a preceding `HeadObject`: S3-compatible endpoints behind proxies can fail concurrent HEAD requests and leave orphaned objects after metadata cleanup.
- Keep `storageKey` authoritative and preserve owner/tenant parsing checks before any object operation.
- URL pathnames are percent-encoded projections of object keys. Decode keys extracted from URLs exactly once; never decode an explicit `storageKey` unconditionally. Legacy records whose encoded `storageKey` matches their decoded `filepath` may be recovered through `resolveStoredS3Key`.
- Run `./scripts/test-s3-local.sh` from the repository root for a disposable real-MinIO acceptance suite. It uses only the compose project `librechat-s3-acceptance` and removes its container and volume on exit.
