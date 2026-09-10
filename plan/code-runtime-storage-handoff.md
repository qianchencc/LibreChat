# Code runtime and S3 delivery — September 10–11, 2026

## Release status

Both workflows are deployed and accepted. Final production verification used the actual
`/app/skill/minimax-docx` mount, including DOCX generation, validation and authenticated download.
Successful deployment: https://github.com/qianchencc/LibreChat/actions/runs/34505446026
(running application source `3fe639717`).

Runtime repository: `/home/lab/works/librechat-code-interpreter`, pushed branch
`codex/fix-sandbox-dns`. Code commit `7ad926d`, documentation commit `4763d6a`.
Production runner image:
`sha256:08f8f523f7a125c4b395e91ae30f7d01d61de63d1bac741acdb51997a4a95056`.

## Code execution and DOCX

The launcher pinned `egress_gateway` to `.7`; its replacement used `.9`. File priming failed
before user code ran. Upstream #152/#157 retain service names and forward the runner resolver.
Real KVM acceptance additionally required TCP DNS (`use-vc`) for the deployed libkrun TSI path.
Container health alone did not detect the broken UDP path.

Actual NsJail execution then exposed .NET requirements: self affinity (`pid=0`, other targets
denied); `memfd_create` returning `ENOSYS` instead of killing a runtime thread; a 256 MiB GC heap
within the default 512 MiB address-space limit; and a synthetic passwd entry for NuGet's
`getpwuid` lookup. `noexec` and the remaining isolation stay in place.

Skill fixes target the CLI `.csproj` explicitly under SDK 8 (`.slnx` is unsupported), invoke shell
helpers through `bash`, and use a managed CLI (`UseAppHost=false`). Direct C# guidance now uses
a Console project referencing the bundled Core dependency, replacing the nonexistent
`run-script` command and mismatched package version.

Validation: DNS shell suite, 14 launcher Rust tests, 24 NsJail tests and API builds passed.
An isolated service moved from `.10` to `.11`; the same guest reached its replacement without
restarting. Production authenticated upload/read passed. A real-jail .NET probe went from a
10-second timeout to success in about 320 ms; the final baked check also covers offline restore.

Production `/v1/exec` loaded all 75 skill files with read-only metadata, reported READY,
built the CLI, generated a Chinese-titled DOCX and passed business validation. Download through
LibreChat's `getCodeOutputDownloadStream` returned 200 and 2,035 bytes. ZIP CRC and Chinese title
checks passed. Artifact: `/tmp/libre-runtime-smoke.docx`; SHA-256:
`06e4f39dd7efd8609a509352c244f316891725647ec84285c2c2c291ff3f6d8e`.

Optional pandoc/LibreOffice/zip binaries remain absent. The report validator emits one existing
non-blocking orphaned-relationship warning. The runtime's full test TypeScript check has three
pre-existing test typing errors reported during diagnosis; its build and scoped checks pass.

## S3 and image delivery

Scope: `/tmp/libre-s3-internal-write-handoff-20260910.md`. Changes are in `d22e2e88d`,
`6b187afa6`, `539146298` and `f61604e4f`.

Server I/O uses optional `AWS_INTERNAL_ENDPOINT_URL`; browser URLs are signed directly for
`AWS_ENDPOINT_URL`. Default behavior, old keys and refresh remain compatible. OpenAI generation
and edit success wait for persistence. Both callbacks reuse the stored file with owner/tenant
checks; future retention deadlines remain deliverable. UI success requires an attachment.

Validation: initial S3 suites 153 tests, real local MinIO 22 tests per configuration, final
endpoint suite 14 tests including bounded SDK 503 retries with identical key/body. Image backend
89 initial tests; expanded callback suite 46; image UI 32. Builds, lint and frontend types passed.
Deployed application storage methods passed internal PUT/GET and public signed-download checks.

One successful production `gpt-image-2.5` call reused the provider key. Its S3 file was 843,630
bytes; the browser loaded it at 768×768 and retained it after full reload. Evidence:
`/tmp/libre-s3-generated-20260911.png`, `/tmp/libre-s3-refreshed-20260911.png`.
A UI-uploaded text attachment downloaded with 200 and 203 bytes; SHA-256 matched:
`b1c91df5cd5ea8d1bfcdf0c2d3f2e03c2585944fa03575065329202201eecf08`.
An earlier test send failed before provider initialization because the synthetic key was saved
as a raw string instead of the normal UI JSON envelope. Only the test configuration was corrected.

## Operations and cleanup

Production internal endpoint: `http://host.docker.internal:9000`; public endpoint:
`https://minio.qianc.ltd`. Compose backup:
`/vol2/1000/Plugins/librechat/docker-compose.override.yaml.before-internal-s3-20260910`.
Removing the internal override restores public I/O after restart; no object migration is needed.

Runtime builds reuse unchanged packages from the prior production rootfs through
`--build-context package-builder=docker-image://librechat-code-packages:4fa1387`, avoiding failed
upstream downloads. Keep this image for offline rebuilds and the prior runner tag for rollback.

Synthetic account, agent, key, messages and file records were deleted and verified absent.
Test S3 objects were verified absent. The browser/auth vault was closed/deleted; its temporary
directory went to system trash. The local gateway-key copy was removed, without revoking the
provider's original key. Diagnostic containers and two superseded candidate runner images were
removed; the current image, package cache and previous rollback image remain available.

Follow-up ticket: account deletion removed database records but left the two test S3 objects.
This task deleted only those exact keys and verified 404. Investigate account object cleanup
separately; it was not expanded into this storage-routing fix.

## Suggested skills

Use diagnosing-bugs for regressions, agent-browser for attachment acceptance, writing-for-agents
for runtime instructions, and handoff for release evidence. Select safe diagnostic fields:
raw sandbox logs may contain egress capability tokens.
