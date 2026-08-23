# LibreChat multi-file artifacts research

Date: 2026-08-23

## Conclusion

LibreChat's community is discussing a transition from message-bound previews to reusable,
interactive "instant apps," but upstream has not adopted a multi-file artifact project model.
The renderer is not the main blocker: Sandpack already receives a virtual file map and LibreChat
injects many shared shadcn files. The missing pieces are a model-facing project mutation protocol,
durable project/version records, per-file editing, asset ownership, authorization, and publishing.

## ChatGPT baseline

OpenAI documents sandboxed previews for HTML pages and React components. Supported code blocks can
be edited, previewed, shared read-only, and saved with the conversation. OpenAI also documents that
preview network access is permission/workspace controlled. The public documentation does not define
the saved object as a Git repository or promise a user-visible multi-file directory tree.

Source:

- https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt

## Confirmed LibreChat direction

The maintainer's 2026 roadmap commits to improving artifacts by rendering file/tool outputs and
making generated artifacts easier to share and maintain between iterations. On the incremental-edit
request, the maintainer explicitly connected diff/patch editing to that roadmap effort.

Sources:

- https://www.librechat.ai/blog/2026-02-18_2026_roadmap
- https://github.com/danny-avila/LibreChat/issues/12116

## Community proposals, not accepted roadmap commitments

Current proposals ask for:

- standalone artifact URLs, visibility controls, embedding, and static export;
- permission-checked calls from artifacts to models, MCP tools, and Actions without exposing keys;
- SCM-backed versioning, ownership independent of one conversation/user, and Codex-like fixes;
- Canvas-style targeted editing instead of complete regeneration.

No examined issue has an assigned milestone or merged multi-file implementation. The instant-app
discussion has no maintainer response, and the standalone/model-enabled proposals remain open.

Sources:

- https://github.com/danny-avila/LibreChat/issues/13373
- https://github.com/danny-avila/LibreChat/issues/13374
- https://github.com/danny-avila/LibreChat/discussions/12976
- https://github.com/danny-avila/LibreChat/discussions/4600

## Upstream implementation evidence

Upstream still instructs models to generate one complete `index.html` or `App.tsx`. The client turns
one artifact content string into one model-produced Sandpack file. However, the Sandpack provider
already accepts a file map and LibreChat adds `/components/ui/*.tsx`, `/lib/utils.ts`, and
`/public/index.html` as virtual files. Multi-file rendering is therefore technically available, but
multi-file generation, persistence, editing, versioning, and export are not productized.

Relevant source files:

- `packages/api/src/prompts/artifacts/index.ts`
- `client/src/hooks/Artifacts/useArtifactProps.ts`
- `client/src/components/Artifacts/ArtifactPreview.tsx`
- `client/src/utils/artifacts.ts`

## Design implication

Do not extend the message directive with an unbounded JSON directory blob. Keep lightweight
single-file artifacts, and introduce a separate durable web-project aggregate when multi-file work
is required. A project version should reference immutable file versions, have an explicit entry
point and dependency manifest, render through the existing Sandpack file map, and publish or export
as an immutable snapshot.
