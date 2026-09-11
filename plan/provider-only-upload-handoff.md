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

Deployment and final browser/S3 acceptance are recorded below when completed. Before replacing
production Compose files, back up the base and override files. Preserve the `pgdata2` Docker
volume. Rollback restores those files, restarts `rag_api` and `vectordb`, restores prior agent tool
arrays, and deploys the preceding application image/config.

## Suggested Skills

Use diagnosing-bugs for upload regressions, agent-browser for real browser attachment acceptance,
and handoff when extending this record.
