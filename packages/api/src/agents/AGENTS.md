# Agent skill file priming

- Code API accepts at most 200 files per batch upload. Keep `SKILL.md` in the first batch and split bundled files so no request exceeds that ceiling.
- Upload batches for one skill sequentially inside one upload-concurrency slot. A failed batch must not persist partial `codeEnvRef` updates.
- Preserve each batch response's `storage_session_id` on its files; references from separate batches may belong to separate storage sessions.
- Previously invoked skill cards remain active for the conversation. Do not prune historical skill files to reduce request size; deduplicate by skill identity and stable file reference instead.
- Upload retries must reacquire file streams because a failed upload may have consumed them.
