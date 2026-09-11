# Explicit-request memory — September 11, 2026

## Scope and implementation

Enable the existing memory workflow: explicit save/update/delete requests and cross-conversation
recall in the user's shared personal pool. No background extraction agent, new dependency,
automatic chat harvesting, or runtime code change.

`librechat.yaml` now enables memory and personalization. Existing default agent capabilities
already include `memory`; an extra `endpoints.agents` override would be redundant. Both local
and deployed `AppService` checks confirm inline memory is exposed and background extraction
remains disabled. The checked `upstream/main` memory configuration implementation matches.

Production's six existing agents (Sol, Luna, GPT5.6luna, Terra, Astra, lh) received only an
add-to-set of the `memory` tool through `createMethods().updateAgent()`, preserving version
history, existing tools and their existing `memory_scope: user`. Future agents still opt in
through the builder's Memory tool; ordinary model conversations use the Memory tool toggle.

## Production and rollback

The previous mounted YAML matched repository HEAD exactly before editing. Backed up and copied
the validated YAML to `/vol2/1000/Plugins/librechat/librechat.yaml`, then restarted only
`LibreChat`. The application image remains the previously accepted `3fe639717` build; this is
a configuration-only activation, requiring no image or frontend rebuild.

YAML backup: `/vol2/1000/Plugins/librechat/librechat.yaml.before-memory-20260911`.
Agent backup: container `/app/logs/memory-enable-backup-20260911.json` (persisted logs mount),
containing only IDs, prior tool arrays, memory scope and version counts. To roll back global
activation, restore the YAML backup and restart LibreChat. If reverting agent tools, use
`updateAgent()` for the six exact backed-up IDs, preserving any subsequent unrelated tool edits.
Disabling memory preserves stored records.

## Acceptance

Existing tests: 34 passed across `packages/api/src/memory/config.spec.ts` and
`packages/api/src/agents/memory.spec.ts`. Parsed actual configuration through `AppService`
locally and in production. No application source changed, so no broader build was needed.

Real production UI, dedicated USER account, existing provider credential with a one-hour
test-account expiry; credential contents never printed. No model/tool responses were mocked.

1. Luna saved the synthetic `acceptance_code` through `set_memory`. Sidebar showed the entry;
   `MemoryEntry` confirmed it belonged to the test user and shared personal pool.
2. Sol recalled the exact synthetic code in a new conversation without the value in the prompt.
3. Sol updated the same key through `set_memory`; database still contained one test entry,
   carrying the replacement value.
4. Turning off Use Memory in the UI made Luna answer that it did not know the code in a new
   conversation, while the saved entry remained. User preference was verified false in MongoDB.
5. Re-enabled memory; Luna read the replacement value in a new conversation and invoked
   `delete_memory`. The database confirmed zero test memories.
6. Sol answered that it did not know the code in another new conversation; the sidebar showed
   no saved memories. This confirms recall came from persistent memory rather than chat history.

The test account was deleted through the authenticated account-deletion API (HTTP 200).
Readback confirmed zero test users, keys, memories, sessions, messages and conversations.
The original two memory records and six configured agents remain. No attachments were generated.
Browser sessions and the temporary auth-vault profile were closed/deleted.

Screenshots: `/tmp/libre-memory-saved-20260911.png`,
`/tmp/libre-memory-recalled-20260911.png`, `/tmp/libre-memory-deleted-20260911.png`,
`/tmp/libre-memory-forgotten-20260911.png`.

## Diagnostic correction and follow-up

The previous read-only diagnosis incorrectly counted the nonexistent `memories` collection.
The actual model is `MemoryEntry`, stored in `memoryentries`; two pre-existing records were
found when acceptance queried the correct collection. Their contents were not inspected and
they were preserved. The missing global configuration and missing agent tools were correctly
identified independently of this count.

The temporary agent-update process also exposed an existing MongoDB index creation warning
for Message/Conversation (`meili_excluded_legacy_cleanup_v3`, unsupported partial-filter
`$exists: false`). It did not prevent updates or chat acceptance. Investigate separately;
no indexes were changed for this task. Subsequent diagnostic processes disable autoIndex.

## Suggested skills

Use diagnosing-bugs for memory regressions, agent-browser for real chat acceptance and handoff
for updating this record. Keep checks scoped to synthetic memory contents.
