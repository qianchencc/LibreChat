# LibreChat 上游维护方向审查

## 结论

本次只做维护研究，不修改业务代码、不 cherry-pick 提交。

建议下一批优先核验以下 5 个独立修复，按表中顺序逐个 cherry-pick 并在测试环境验收：

1. 社交登录缺失头像保护
2. 空 Mongo 索引配置保持未设置
3. Toast 生命周期和持续时间修复
4. Dialog 内嵌 Popover 层级修复
5. Mock E2E 等待持久化完成

这 5 个提交在当前工作树上的补丁检查均未发现直接上下文冲突；这只是移植信号，正式 cherry-pick 仍需按依赖和测试结果逐个进行。

## 审查基线

- 审查日期：2026-09-11（Asia/Shanghai）
- 当前分支：`codex/fix-playwright-help-navigation`
- 当前 HEAD：`c02404d8d38ef997231aa11618a85389470209d4`
- `upstream/main`：`0354db3b57445324d476ec054140c612e77cac04`
- `upstream/dev`：`0354db3b57445324d476ec054140c612e77cac04`
- `upstream/main` 与 `upstream/dev` 当前同一提交，无需分别重复分析
- 共同祖先：`08c9cc3d3dd4597fc131506ddfc10a432849149b`
- 相对共同祖先：当前分支领先 63 个提交、落后上游 430 个提交

资料来源只包括：

- 本地 `upstream` remote 的 commit、diff、路径和 ancestry
- GitHub 官方 commit API 对上游 tip 的确认：`0354db3b` 的提交时间为 2026-09-10 19:17:06 UTC
- GitHub 官方提交页面，逐项链接见下文

详细窗口取上游最近 60 个提交，覆盖 2026-09-07 至 2026-09-11；过去六周（自 2026-07-31）共有 721 个提交。六周统计用于看方向，逐提交判断以最近 60 个提交的 commit/diff 为准。

## 上游维护方向

### 1. Agent/BYOM 运行时成为主线

最近提交集中在 BYOM、代码沙箱、附件 workspace、后台任务、取消/恢复、队列父子关系和工具审批。例如 `ec15075dc`、`e370ce4b2`、`a8087ce45`、`559fd7d60`、`a353e117b`。这是一条连续的运行时重构和可靠性链，不适合从中间截取若干提交合并。

### 2. 附件处理从上传扩展到生命周期和边界控制

上游正在处理历史附件限制、代码 API 上传恢复、S3/CloudFront key 一致性、附件 workspace 以及导入失败隔离。该方向与本 fork 的 S3 持久化和 provider-only 上传有关，但本 fork 已重写多个附件入口，相关提交需要按本地存储契约重新移植。

### 3. MCP OAuth 和后台调度可靠性持续加固

最近有 MCP OAuth discovery backoff、token refresh、teardown race、catalog refresh，以及 Scheduled Chat 的 MCP readiness 检查。当前 fork 没有针对这些方向的业务定制，本轮不建议为了“跟上游”引入整条 MCP 运行时链。

### 4. 租户隔离和数据库运维约束加强

上游新增了租户索引迁移、模型 API 隔离 lint、DocumentDB 兼容性和空 Mongo 配置处理。与生产可靠性直接相关，但索引迁移属于需要数据库备份、停写和 dry-run 的运维变更，应独立安排。

### 5. 前端重点是运行中反馈、弹层层级和响应状态

近期修复了 Composer 移动端边界、嵌套 Popover、滚动到底部按钮遮挡、过期 Response parts 和 Toast 生命周期。这里有若干可以独立移植的小修复，优先级高于整合上游 UI 重构。

### 6. CI 和供应链安全成为显式维护项

上游修复了 Jest server 泄漏、E2E 持久化等待、测试模块被工具发现，以及 gRPC xDS 依赖漏洞。当前 fork 曾持续处理 Playwright 和部署问题，因此 CI/test-only 修复值得单独吸收；大规模依赖升级应另开批次。

## 推荐候选

### R1. 社交登录缺失头像保护

- Commit：`5020dbd2303651e1455011391dbfdac14111c3d5`
- 标题：`fix: Guard Null Avatar URLs in Social Login (#15747)`
- 路径：`api/strategies/process.js`、`api/strategies/process.test.js`
- 价值：Google/OIDC 或 Apple 未返回头像时，不再把 `null` 传给 `resizeAvatar`。这能避免配置了 S3/MinIO 等非本地文件策略时社交登录直接失败。
- 与本 fork 冲突风险：低。当前 fork 未修改这两个路径；补丁检查通过。
- 推荐动作：`cherry-pick`，随后执行社交登录无头像回归测试。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/5020dbd2303651e1455011391dbfdac14111c3d5)

### R2. 空 Mongo 索引配置保持未设置

- Commit：`b356c3d87edccd0bde68dc90a5eca66ae2c80e5d`
- 标题：`fix: Treat Blank Mongo Index Settings as Unset (#15809)`
- 路径：`.env.example`、`api/db/connect.js`、`packages/api/src/utils/common.ts`、`packages/api/src/utils/common.spec.ts`、`packages/data-schemas/src/methods/schedule.ts`
- 价值：空的 `MONGO_AUTO_INDEX`/`MONGO_AUTO_CREATE` 不再被解释成 `false`，避免生产环境使用空变量时意外关闭 Mongoose 默认行为。
- 与本 fork 冲突风险：低到中。`.env.example` 是本地定制文件，但补丁检查通过；上线前需确认当前生产环境确实依赖空值语义。
- 推荐动作：`cherry-pick`，再做一次生产形 `.env` 配置和启动检查。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/b356c3d87edccd0bde68dc90a5eca66ae2c80e5d)

### R3. Toast 生命周期和持续时间修复

- Commit：`c9b9644163433f43244d7bb1dd97d325423ccec0`
- 标题：`fix: Honor Toast Duration and Support Persistent Toasts (#15049)`
- 路径：`packages/client/src/components/Toast.tsx`、`packages/client/src/components/__tests__/Toast.spec.tsx`、`packages/client/src/hooks/useToast.ts`、`packages/client/src/store.ts`
- 价值：每个 Toast 拥有自己的关闭 deadline，替换正在显示的 Toast 时不会继承旧计时器；同时支持持续 Toast 的手动关闭。对当前上传延迟提示和错误提示的用户体验有直接价值。
- 与本 fork 冲突风险：低。当前 fork 没有修改这些共享 Toast 文件；补丁检查通过。
- 推荐动作：`cherry-pick`，重点验收上传成功提示、延迟提示替换和持续错误提示。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/c9b9644163433f43244d7bb1dd97d325423ccec0)

### R4. Dialog 内嵌 Popover 层级修复

- Commit：`5cd70ad61273567d176201ec2286513a09cbf2a7`
- 标题：`fix: Raise Nested Popovers Above Dialog Layers (#15738)`
- 路径：`packages/client/src/components/Combobox.tsx`、`packages/client/src/components/HoverCard.tsx`、`packages/client/src/components/OriginalDialog.tsx`、`packages/client/src/components/Select.tsx`、`packages/client/src/components/__tests__/popoverLayering.spec.tsx`
- 价值：修复 Dialog 内的 Select、Combobox、HoverCard 被遮罩层盖住且无法点击的问题，直接改善 Agent 工具配置和代码设置弹窗的可用性。
- 与本 fork 冲突风险：低到中。当前 fork 定制了主题 token，但没有改动这些共享组件；补丁检查通过。需要留意本地 Radix 依赖版本和已有主题层级测试。
- 推荐动作：`cherry-pick`，验收 Agent Builder、Run Code 设置和工具配置弹窗。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/5cd70ad61273567d176201ec2286513a09cbf2a7)

### R5. Mock E2E 等待持久化完成

- Commit：`3cab71c48a131de085d3567df28e330ed2faa966`
- 标题：`ci: Await durable finalization in conversation-management mock e2e (#15791)`
- 路径：`e2e/specs/mock/conversation-management.spec.ts`
- 价值：连续发送消息前等待上一轮真正完成，并为三个测试设置明确 timeout，减少“上一轮尚未解锁就按 Enter”的 E2E 假失败。
- 与本 fork 冲突风险：低。当前 fork 未修改该测试文件；补丁检查通过。
- 推荐动作：`cherry-pick`，执行该 spec 及对应 Playwright mock CI lane。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/3cab71c48a131de085d3567df28e330ed2faa966)

## 高价值但本批暂缓

这些提交值得登记，但不放进当前 3-5 个直接候选：

### 记忆 key 校验

- Commit：`54511b2b8c6c689420200bbb377ded0432d42565`
- 标题：`fix: Return 400 for Invalid Memory Keys (#14618)`
- 路径：`api/server/routes/memories.js`、`api/server/routes/__tests__/memories.spec.js`、`packages/api/src/memory/handlers.ts`、`packages/data-schemas/src/schema/index.ts`、`packages/data-schemas/src/schema/memory.ts`
- 价值：非法 key 从 500 改成明确 400，并统一 schema 与 route 校验。
- 风险与动作：当前记忆路由与上游父版本已有上下文差异，补丁检查在 route 入口失败；当前 fork 又刚完成 Agent memory 配置改动。`暂缓`，后续以本地记忆验收为基线手工移植。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/54511b2b8c6c689420200bbb377ded0432d42565)

### 记录 key 优先于下载 URL

- Commit：`58de77619ec7ede5a97a03cf12c136996ebc49da`
- 标题：`refactor: Prefer the Recorded Storage Key for Every Download Stream (#15695)`
- 路径：共享链接、文件下载、代码文件、Agent handlers、Skill handlers、`packages/api/src/storage/path.ts`、S3 测试和 CRUD
- 价值：S3/CloudFront 文件已记录 `storageKey` 时，下载不再重新解析可能过期或编码不一致的 URL。
- 风险与动作：与本 fork 的 `d22e2e88d` 内部 S3 I/O、provider-only 附件、Skill 文件和 S3 metadata 改动直接重叠；补丁检查在 share 测试上下文失败。当前部分路径已经使用 `storageKey || filepath`，但尚未统一。`暂缓`，后续只做本地下载入口审计和小范围手工移植。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/58de77619ec7ede5a97a03cf12c136996ebc49da)

### S3 URL 解码和 CloudFront key 编码

- Commit：`ea3c61d69aa53f715385181583ec9af4e5daf0c2`
- 标题：`fix: Decode S3 Object Keys from URLs (#15426)`
- 路径：`packages/api/src/storage/s3/crud.ts`、`packages/api/src/storage/cloudfront/crud.ts` 及对应测试
- 价值：修复中文文件名、空格和字面量 `%` 在 URL 与 S3 key 之间的 round-trip 问题。
- 风险与动作：当前 fork 的 S3 `extractKeyFromS3Url` 已有一次解码和 legacy encoded-key 兼容逻辑，S3 解码部分属于`已等价实现`；CloudFront URL/invalidation 的 segment encoding 仍未完整引入，但生产当前使用 MinIO/Cloudflare，不建议本批直接 cherry-pick。`暂缓`。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/ea3c61d69aa53f715385181583ec9af4e5daf0c2)

### 测试模块不应参与工具发现

- Commit：`0d85af0a774df76ef9312e8fadf70b30d2f3034e`
- 标题：`chore: Keep Jest Specs Out of Tool Discovery (#15766)`
- 路径：结构化工具测试文件、`api/server/services/start/tools.js`、`packages/api/src/tools/discovery.ts` 及测试
- 价值：避免 `.spec.js`/`.test.js` 在启动时被当作工具加载执行。
- 风险与动作：本 fork 已有部分 `structured/specs` 文件布局，但 loader 仍是本地定制版本；直接 cherry-pick 会撞 rename。`暂缓`，后续只移植 test-file predicate。
- 来源：[GitHub commit](https://github.com/danny-avila/LibreChat/commit/0d85af0a774df76ef9312e8fadf70b30d2f3034e)

## 明确排除

以下提交或提交链本轮不合并：

- `ec15075dc`，`feat: Route Attachments and Provision Tools Lazily (#15763)`：直接重写附件和 provision 路由，和本 fork 已确定的 provider-only 上传及 S3 持久化边界冲突。
- `e370ce4b2`，`fix: Bound Agent Attachment Context (#15694)`：38 个路径、约 4,400 行变更，围绕 model-bound attachment/File Search 上下文；本 fork 已移除 Agent 的 `file_search`、`context`、`ocr` 能力。
- `a8087ce45`、`2c07e2831`、`d510b6feb`：Attached Code Workspace 的连续链，依赖 BYOM/stateful worker 协议，当前产品范围未启用该运行时。
- `c9d208ad3`，`feat: Unify Tool Activity, Reasoning, Search, and Agent Workflows (#14546)`：跨工具活动和渲染状态的大型行为重构，容易覆盖本 fork 的帮助页、Landing、Artifacts 和工具显示定制。
- `8a85df971`，`feat: Add Skills Discovery and Authoring to the Management API (#15642)`：与本 fork 的本地 Skill 目录映射和生产 sandbox skill runtime 方向重复，需先统一 Skill 生命周期模型。
- `c79f13b1f`，`chore: bump npm audit packages and @librechat/agents to v3.8.5 (#15770)`：package-lock 和多个 workspace 同时变化，依赖升级应单独做兼容性批次。
- `fd229fe47`，`fix: Collapse Radix Layer Packages to One Copy (#15742)`：包含约 2,656 行 lockfile 变化，且会触及当前主题和弹层兼容策略，暂不引入。
- `8144574b4`，`feat: High Contrast Light and Dark Appearance Modes (#15178)`：与本 fork 的 ChenChat theme token 定制重叠，应先完成主题基线再评估。
- `a21c7944e` 与 `3200f0133`：图片实际 MIME/HEIF 修复链依赖上游新增的 `packages/api/src/files/mime.*` 和前置媒体类型链；当前 fork 没有该模块，不能孤立 cherry-pick。
- `8da4ae732`，`fix: Patch gRPC xDS Denial of Service (#15769)`：安全价值明确，但当前 fork 的 Go module 基线为 gRPC `v1.79.3`，上游补丁基于 `v1.83.1 -> v1.83.2`，应在独立 Go 依赖安全批次中重算升级，不直接套补丁。
- `0354db3b5`，`fix: Close Leaked HTTP Server in Server Specs (#15821)`：方向值得关注，但当前 fork 缺少上游新增的 `api/server/csp.spec.js`，无法直接完整 cherry-pick；如 CI 仍有 Jest hang，应针对现有 `index*.spec.js` 单独移植。

## 已等价实现或已导入，避免重复

`git cherry -v HEAD upstream/main` 已识别出以下上游 patch 在当前 fork 中已有等价提交，不应重复 cherry-pick：

- `f384e71f7` → 本地 `d5077bb18`：Quote popup update loop
- `bf1e13b80` → 本地 `65d3160d0`：TOTP constant-time compare
- `6988ff5d7` → 本地 `e6b7ceb15`：Share dialog role menu clipping
- `7b0b14515` → 本地 `0622c3b30`：Artifact/MCP flyout viewport bounds
- `458c473d9` → 本地 `9d90c1503`：Token email normalization
- `1c2796b97` → 本地 `f3d11f8e6`：Invite email claim validation

此外，本地 S3 URL 解码逻辑已覆盖 `ea3c61d69` 的核心 S3 decode 行为，但没有覆盖 CloudFront segment encoding，因此该提交整体仍列为暂缓而不是重复导入。

## 下一步边界

本文件只形成候选清单，不执行合并。下一批若获批准，只处理 R1-R5 中选定的提交，每个提交单独完成：

1. cherry-pick 前检查依赖和实际 diff
2. 运行对应最窄回归测试
3. 通过后再做一次相关生产形构建或 CI 验证

不在本批顺手处理 BYOM workspace、File Search、CloudFront、主题重构、依赖大升级或数据库索引迁移。
