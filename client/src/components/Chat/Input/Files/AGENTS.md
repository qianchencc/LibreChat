# File Uploads

- The sidebar file library is durable user-file storage; it is not a retrieval feature.
- Composer uploads use the provider path and omit `tool_resource`. Keep click, paste, drag/drop,
  and SharePoint source flows consistent with that rule.
- Provider capability and endpoint file config determine selectable MIME types. Unsupported files
  should be rejected rather than silently routed to context, file search, or code execution.
