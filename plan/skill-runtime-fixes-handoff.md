# Skill runtime fixes handoff

## Completed

- Skill priming now splits uploads at the Code API 200-file ceiling. `SKILL.md` occupies one slot in the first batch, later batches contain up to 200 bundled files, and batches run sequentially inside the existing concurrency slot.
- Priming retains each batch's storage session, verifies completeness across the full skill, and persists no partial references when an upload batch fails.
- Historical conversation skill files remain active. They are not pruned because skill cards intentionally have sticky conversation semantics.
- Code Interpreter sandbox egress grants support short `cegr1.<id>` references backed by the existing Redis ledger. Workers send the short token to the sandbox while retaining the full token for output restoration, with rolling compatibility for older workers and gateways.
- The sandbox image includes .NET SDK 8.0.424 and an offline NuGet feed for `DocumentFormat.OpenXml` 3.5.1 and `System.CommandLine` 2.0.5. Bash execution receives the required .NET and NuGet environment variables.

## Verification

- LibreChat skill priming tests: 18 passed, including a 360-file `dashi-ppt` upload split into batches of 200 and 161 files.
- LibreChat `packages/api` build passed.
- Code Interpreter service tests: 561 passed; API tests: 369 passed; both builds passed.
- Egress regression coverage includes a full 1000-file token over 100 KB, a short token below 64 bytes, Redis resolution, and full-token restoration compatibility.
- The production `api/Dockerfile` sandbox target built successfully on the production host with a 4.4 GB rootfs.
- With container networking disabled, the candidate rootfs reported .NET SDK 8.0.424, restored the real `minimax-docx` projects solely from the baked NuGet feed, compiled the CLI, created `smoke.docx`, and passed business validation.

## Release order

1. Deploy the new egress gateway so it can create and resolve short grant references.
2. Deploy the new worker so sandbox requests use the short token while result restoration keeps the full token.
3. Deploy the sandbox image containing the .NET runtime and offline packages.
4. Deploy LibreChat with batched skill priming.
5. Run a large-skill production conversation and confirm there are no HTTP 431 responses.

## Notes

- Production uses `CODEAPI_EGRESS_LEDGER_REQUIRED=true` and hardened sandbox mode, so short references use the required Redis-backed path.
- Running raw `bun test` from the service also discovers `stress-tests/stress_test.js`, which requires `k6/http`. Use the repository's official `bun run test` command for the service suite.
- The `minimax-docx` build has existing nullable warnings. Its generated smoke document also reports one non-blocking orphaned-relationship warning; both are outside this runtime dependency fix.
