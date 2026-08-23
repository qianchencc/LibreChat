# Artifact attachment production findings

Date: 2026-08-24

This document corrects the production-acceptance conclusion in
`plan/artifact-attachment-references-handoff.md` and records a separate finding about
code-environment paths. It records diagnosis only; no application fix is included here.

## 1. Artifact attachment references are not accepted in production

The following Artifact source is valid and matches the intended stable-reference contract:

```html
<img src="attachment://b0cd8c56-14d4-4696-9509-fc975bebe245" />
```

The corresponding production file record is:

```text
file_id: b0cd8c56-14d4-4696-9509-fc975bebe245
filename: clipboard_1787501788053_图片.png
source: s3
type: image/png
storageKey: images/6a843b0413d408d4b0c40ae0/b0cd8c56-14d4-4696-9509-fc975bebe245__clipboard_1787501788053_%E5%9B%BE%E7%89%87.png
```

Production probes showed:

- Signing and fetching the stored, percent-encoded `storageKey` returns `404 application/xml`.
- Signing and fetching the decoded object key ending in `_图片.png` returns `200 image/png`
  with a content length of 116038 bytes.

Therefore the browser's unresolved `attachment://` URL is a symptom, not malformed Artifact
HTML. The persisted canonical object key does not identify the object that MinIO actually stores.
`resolveStoredS3Key` in `packages/api/src/storage/s3/crud.ts` trusts that stored key, so the
authenticated download-URL request fails before Sandpack can receive a browser-loadable URL.

`client/src/hooks/Artifacts/useResolvedArtifactFiles.ts` currently catches that request failure
and leaves the unresolved custom URL in the preview source. This hides the storage failure and
makes the rendered result look like unsupported `attachment://` syntax.

### Correction to the earlier handoff

The statement that production acceptance passed in
`plan/artifact-attachment-references-handoff.md` is revoked. That acceptance used ASCII filenames
and did not cover URL encoding or Unicode object keys. The historical handoff is retained as a
record of what was tested at the time; this document is the authoritative follow-up finding.

### Required correction

The narrow correction should:

1. Persist the actual S3 object key returned/known at write time instead of deriving a canonical
   key from an encoded URL path.
2. Provide a compatibility path for existing encoded records. Do not blindly decode every `%`
   sequence: a literal percent sign can be part of a legitimate object key. Prefer an existence-
   checked encoded-key/decoded-key fallback or an explicit migration.
3. Surface reference-resolution failures in the Artifact UI instead of silently passing an inert
   custom URL into Sandpack.
4. Cover Chinese filenames, spaces, and literal `%` characters against a real S3-compatible
   store, plus a browser regression for `<img src="attachment://...">`.

## 2. `/mnt/data` is not a public LibreChat URL

The reported link was:

```text
https://libre.qianc.ltd/mnt/data/index.html:165
```

Production HTTP probes showed that `/`, `/mnt/data/index.html`, and
`/mnt/data/index.html:165` all returned the same LibreChat SPA document with SHA-256:

```text
acc5e8acd175a65376176d5718475dcb47fcb36a958c13049eb832539ea68f81
```

This is expected routing fallback for an unknown application path, not the generated file.
`/mnt/data/index.html` is a path inside the code-execution sandbox, and `:165` is a source line
number. Turning that text into a same-origin browser link is incorrect. This issue is independent
of `attachment://` resolution and should not be fixed by exposing `/mnt/data` through LibreChat,
Nginx, MinIO, or Cloudflare.

## 3. Existing code-output path

LibreChat already has the main durable-output pipeline:

1. A code tool reports generated files in `output.artifact.files`.
2. Agent callbacks pass each non-inherited file to `processCodeOutput`.
3. `processCodeOutput` downloads the bytes from the code environment, writes them through the
   configured file-storage strategy, creates/updates a user-owned file record, and emits an
   attachment for the tool call.
4. The client classifies persisted HTML (`text/html` or `.html`) as an Artifact and opens it in
   the sandboxed Artifact panel. Other files use the corresponding preview or download UI.
5. `/api/files/code/download/:session_id/:fileId` exists only as a temporary fallback when normal
   persistence cannot complete; it is not a public mapping of `/mnt/data`.

This means a generated `index.html` should normally be presented as an attachment/Artifact card.
A model-authored Markdown link to a raw sandbox path is not the durable file interface.

The legacy OpenAI Assistants path can replace `sandbox:/mnt/data/...` when OpenAI supplies a
structured `file_path` annotation. The current Agents/code-tool path instead relies on structured
`artifact.files` and attachment rendering. No evidence was found that arbitrary bare paths such as
`/mnt/data/index.html:165` in final assistant prose are normalized into persisted attachment links.

## 4. Desired behavior

The intended boundary should be:

```text
code runtime path (/mnt/data/...) -> generated-file manifest -> durable LibreChat file
                                      -> message attachment -> authenticated preview/download
```

Concretely:

- `/mnt/data` remains tool-internal. It may support continuity inside a stateful code session, but
  it is not a durable, user-facing URL contract.
- Every user-relevant generated file must appear in the tool's structured generated-file manifest
  and be harvested into the configured LibreChat storage provider.
- A generated HTML file should appear as an Artifact card and open in the authenticated,
  sandboxed Artifact preview. Its original bytes should remain downloadable.
- Final assistant prose may name the file, but should rely on the attached file UI rather than
  inventing a link to `/mnt/data`.
- A `path:line` value is a source location. Until the UI supports opening an Artifact editor at a
  line, it should be rendered as non-clickable code text, not as an HTTP link.
- A standalone generated file and a generated project directory are different products. A
  directory needs an explicit export/package or project-manifest flow; exposing its sandbox path
  does not make it a durable website.

For HTML that references user uploads, `attachment://<file_id>` remains the intended durable source
syntax. It will not work reliably in production until finding 1 is fixed. For HTML produced by the
code environment, sibling assets also need a deliberate project/file-reference contract; a raw
`/mnt/data/...` or filesystem-relative reference is not automatically available inside the
client-side Sandpack preview.

## 5. Remaining investigation before implementation

The production conversation data should be inspected to distinguish these cases:

- `index.html` was present in `output.artifact.files` and persisted, but only the model-authored raw
  path was clicked.
- The code tool failed to report `index.html`, so no attachment was available to render.
- The attachment was persisted but omitted or lost while associating it with the tool-call/message
  row.
- The HTML Artifact opened correctly, but its referenced sibling/user attachment failed separately
  because of finding 1 or because no multi-file mapping existed.

Acceptance should use one production-like browser flow that creates an HTML file with an image,
then verifies all externally visible behavior: an Artifact card appears, the preview opens, the
image loads, reload/reopen still works, download succeeds, and no clickable `/mnt/data` URL is
shown.

## 6. Implementation completed locally

Implemented on 2026-08-24:

- S3 keys extracted from signed URLs are decoded exactly once before being persisted or reused.
- `resolveStoredS3Key` recovers existing encoded records only when the decoded value agrees with
  the same record's `filepath`; explicit keys containing literal `%` sequences remain authoritative.
- Download, deletion, CloudFront delegation, and signed-URL refresh paths share the compatibility
  resolver where a complete file record is available.
- Relative and same-origin `/mnt/data/...` Markdown links render as non-clickable code text.
  Unrelated external links remain clickable.

Local verification completed:

- S3 CRUD suite: 104 tests passed.
- Disposable real-MinIO S3 integration suite: 22 tests passed, including Unicode, spaces, literal
  `%`, legacy encoded `storageKey`, signed download, stream download, URL refresh, and cleanup.
- Artifact routing and attachment-reference suites: 39 tests passed.
- Markdown link behavior: 4 relevant tests passed.
- Frontend TypeScript check passed.
- Targeted ESLint passed.
- `@librechat/api` production build passed.

The local real-S3 acceptance environment is reproducible with `./scripts/test-s3-local.sh`. It
starts a dedicated MinIO bound to `127.0.0.1:19010`, creates a disposable test bucket, runs the
integration suite, then removes its container and volume even when the suite fails. This remains
local code acceptance rather than production acceptance. After deployment, repeat the
production-like browser flow above with a newly uploaded Chinese-named image and also reopen the
previously failing conversation.
