# S3 Object Lifecycle

- Treat `DeleteObject` as the idempotent existence check and deletion operation. Avoid a preceding `HeadObject`: S3-compatible endpoints behind proxies can fail concurrent HEAD requests and leave orphaned objects after metadata cleanup.
- Keep `storageKey` authoritative and preserve owner/tenant parsing checks before any object operation.
