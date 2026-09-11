# Provider-only uploads — September 11, 2026

## Scope

Keep the sidebar file library and S3/MinIO persistence. Remove user-facing text embedding and
file retrieval, and make normal composer attachments go directly to the active provider. Keep
Code Interpreter itself, generated files, image generation, Artifacts, and historical files.

Production inventory before the change found six agents, five carrying the `file_search` tool,
but zero file-search, context, or code-resource files on any agent. Existing files were ordinary
message attachments, generated images, or code-output records. The RAG and pgvector containers
were running without active agent knowledge-base data.

## Implementation

- `librechat.yaml` removes `file_search`, `context`, and `ocr` from Agent capabilities while
  retaining code execution, memory, skills, web search, Artifacts, actions, and orchestration.
- The composer attachment button opens the provider picker directly. SharePoint, when enabled,
  remains a source choice only; it does not restore destination choices.
- Drag/drop and long-paste routing only accept the provider destination. Unsupported MIME types
  fail visibly instead of falling back to retrieval, text context, or code-environment upload.
- `docker-compose.yml` and `deploy-compose.yml` remove RAG API, pgvector, related dependencies,
  environment variables, and proxy exceptions. The production `pgdata2` volume is retained for
  rollback and is not deleted.
- Existing agent `file_search` flags are removed through the versioned agent update method after
  deployment. No file migration is required.

The upstream unified-upload series was reviewed. It adds useful deferred provisioning but spans
more than twenty files and defaults some formats to extracted text. This product requirement is
strict provider-only upload, so importing that series would add unrelated behavior and merge risk.

## Verification

- Provider-only attachment component: 5 tests passed.
- Attachment routing, MIME viability, and long-paste behavior: 37 targeted tests passed.
- Client TypeScript and scoped ESLint passed.
- Production client build passed; existing unrelated Tailwind, eval, chunk-size, and PWA glob
  warnings remain.
- YAML parsing and `AppService` resolution confirm `file_search`, `context`, and `ocr` are absent,
  while `execute_code`, `memory`, and `skills` remain.
- Both Compose YAML files parse and contain no RAG runtime references. Production preflight also
  identified the required removal of the `rag_api` block from `docker-compose.override.yaml`.

## Production And Rollback

Commit `533337de16aabc3454dfe795afd95476a79f8f83` was pushed to `origin/main` and deployed by
GitHub Actions run `34560234580`. Production reports the same `BUILD_COMMIT`.

Before replacing the production Compose files, the previous files were saved as:

- `docker-compose.yml.before-provider-only-20260911`
- `docker-compose.override.yaml.before-provider-only-20260911`
- `.env.before-provider-only-20260911`
- `/app/logs/provider-only-agent-tools-backup-20260911.json`

The API was force-recreated successfully. The exact `rag_api` and `vectordb` containers were
removed, while the `librechat_pgdata2` volume was retained for rollback. Five agents were updated
through the versioned agent update method to remove their empty `file_search` tool marker; no
agent retains it. Stale `rag_api` and `vectordb` names were also removed from production
`NO_PROXY`, and temporary Compose preview files were deleted after the active configuration
rendered without retrieval-runtime references.

Production browser acceptance used a synthetic account and confirmed:

- Agent Builder has no File Context section or File Search tool. Its native tools remain Run Code,
  Web Search, Artifacts, Ask User, and Memory.
- Composer image upload created an S3-backed `message_attachment` without an embedded flag, and
  the provider correctly understood the image.
- Reload loaded the image from `minio.qianc.ltd`, and the sidebar “Attached files” library showed
  the same object. The sidebar library therefore remains S3/MinIO-backed and is independent of
  retrieval or embedding.
- A follow-up screenshot exposed stale wording in the generic delayed-upload toast: every slow
  provider upload was described as retrieval indexing. The upload route was already correct; the
  English and Simplified Chinese messages now describe only waiting for the upload to finish, with
  a localization regression test covering the distinction.

The wording fix was deployed from commit `e42b00073322202014d6d0f920c30ee9c3301891` by GitHub
Actions run `34568650153`. Production reported the same `BUILD_COMMIT`. A real browser loaded the
production Simplified Chinese locale chunk and confirmed the new upload-wait text was present and
the retrieval-indexing text was absent.

A subsequent timing diagnosis found that the delayed-upload timer registry used React state even
though it was not rendered. When an upload completed against the same render closure that started
the timer, cleanup could not see the newly queued handle and the warning still fired five seconds
later. The registry now uses a synchronous ref. Regression coverage verifies both immediate
completion (no warning) and a genuinely delayed upload (warning retained). Production MinIO probes
were 38–98 ms and the LAN API probe was about 6 ms, ruling out storage and server load as the fixed
pause. Upstream still carried the state-based implementation when checked on September 11, 2026.

The synthetic user's users, keys, files, messages, and conversations records were deleted. Account
cleanup did not remove the exact S3 test object automatically, so that single known object was
deleted explicitly and a subsequent `HeadObject` returned 404. No other object was inspected or
modified.

Rollback restores the backed-up Compose files, restarts `rag_api` and `vectordb`, restores the
previous agent tool arrays, and deploys the preceding application image/config. Do not delete the
retained `librechat_pgdata2` volume.

## Suggested Skills

Use diagnosing-bugs for upload regressions, agent-browser for real browser attachment acceptance,
and handoff when extending this record.
