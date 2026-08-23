# Artifact attachment reference tickets

## T1: Stable model reference

- Include active user-uploaded conversation files in Agent initialization when Artifacts are on.
- Add filename, MIME, and `attachment://<file_id>` to the Artifact prompt.
- Exclude code-execution outputs.
- Verify with Agent initialization and prompt tests.

## T2: Authorized content URL

- Let the existing file URL endpoint request inline MIME-preserving S3 URLs.
- Preserve existing download behavior by default.
- Verify owner access, denied access, MIME, and disposition behavior.

## T3: Sandpack resolution

- Extract unique attachment references from HTML/React Artifact source.
- Resolve them through the authenticated data service and replace only the Sandpack copy.
- Preserve unresolved references as inert values.
- Verify HTML, React, duplicate references, no-reference content, and failed resolution.

## T4: MinIO and acceptance

- Create the dedicated production bucket and bucket-scoped credential.
- Configure image/document S3 strategies while leaving avatars and skills local.
- Deploy to the production test path.
- Upload representative files and verify the complete flow in a real browser, including reload.

## T5: S3 lifecycle

- Delete S3 objects directly with the idempotent `DeleteObject` operation.
- Avoid a redundant HEAD preflight that can fail through S3-compatible proxies.
- Verify the application deletion function against production MinIO.
