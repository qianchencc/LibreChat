# File Uploads

- The sidebar file library is durable user-file storage; it is not a retrieval feature.
- Composer uploads use the provider path and omit `tool_resource`. Keep click, paste, drag/drop,
  and SharePoint source flows consistent with that rule.
- Provider capability and endpoint file config determine selectable MIME types. Unsupported files
  should be rejected rather than silently routed to context, file search, or code execution.
- The delayed-upload toast reports transfer progress only; do not describe it as retrieval or
  indexing unless its trigger is explicitly scoped to such a workflow.
- Keep upload timer handles in a ref, not render state: completion can run before a state-backed
  timer registry reaches the callback closure, leaving a false delayed-upload warning behind.
