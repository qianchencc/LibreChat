# Landing 与 Help 调研

> 查询日期：2026-08-29。范围限定为 LibreChat 官方官网、官方文档和
> `danny-avila/LibreChat` 官方 GitHub 源码、Issue、PR。

## 结论

可以把应用根路由 `/` 转为公开的产品介绍与快速教程入口，但应新增独立的
public landing 组件，不要改造现有聊天 `Landing.tsx`。`/login` 保持登录入口，
`/help` 保持认证后的深度帮助页。最兼容上游的行为是：未登录访问 `/` 看介绍，
已登录访问 `/` 直接进入 `/c/new`。

## 官方上游现状

- 上游应用当前没有公开产品首页。路由源码把注册、找回密码等放在
  `StartupLayout`，把 `/login` 和 `Root` 放在 `AuthLayout` 下；认证树的根索引
  默认跳转 `/c/new`。[官方路由源码](https://github.com/danny-avila/LibreChat/blob/main/client/src/routes/index.tsx)
- 认证上下文在静默刷新失败或没有 token 时，若 `authConfig.optional` 不是
  `true`，会导航到登录页。[官方认证源码](https://github.com/danny-avila/LibreChat/blob/main/client/src/hooks/AuthContext.tsx)
- `Root` 在未认证时直接返回空内容，因此把公开页面放进现有受保护树会得到
  登录跳转或空白页，而不是公开首页。[官方 Root 源码](https://github.com/danny-avila/LibreChat/blob/main/client/src/routes/Root.tsx)
- 上游的 `client/src/components/Chat/Landing.tsx` 是聊天窗口的新会话落地内容，
  依赖 `useChatContext()` 和 `useAuthContext()`；它支持 `customWelcome`、实体描述
  和会话 starters，但不是公开站点首页。[官方聊天 Landing 源码](https://github.com/danny-avila/LibreChat/blob/main/client/src/components/Chat/Landing.tsx)
- `interface.customWelcome` 的官方定义只是聊天界面的欢迎消息，并支持
  `{{user.name}}`，不能配置完整的产品介绍或教程。[官方 interface 文档](https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/interface)
- 官方确实有产品介绍页和用户指南，但它们位于独立的 `librechat.ai` 官网/文档
  体系，而非自托管应用的 `/`。[官方产品页](https://www.librechat.ai/)、[官方用户指南](https://www.librechat.ai/docs/user_guides)、[官方文档站源码](https://github.com/LibreChat-AI/librechat.ai)
- 社区曾提出首次登录时用箭头引导模型选择、提示词库和历史记录的 UI Tutorial，
  但该 Issue 描述的是需求，不构成上游已有通用产品 tour 的证据。[Issue #6818](https://github.com/danny-avila/LibreChat/issues/6818)
- 上游近期对“landing”的增强仍围绕聊天落地页，例如 model spec 的 landing
  品牌信息和 conversation starters；这进一步说明这里的 landing 是聊天上下文，
  不宜直接承担公开产品首页职责。[PR #13662](https://github.com/danny-avila/LibreChat/pull/13662)、[PR #13710](https://github.com/danny-avila/LibreChat/pull/13710)

## 认证模式选项

### 推荐：公开根路由，认证用户回到聊天

为 `/` 增加独立 public route/layout，不放在强制认证的 `AuthLayout` 内：

- 未登录：渲染介绍和快速教程。
- 点击“开始使用”：跳转 `/login`，必要时带安全的 `redirect_to=/c/new`。
- 已登录：只对根路由使用可选认证检查，认证状态就绪后跳转 `/c/new`。
- `/login`、聊天、侧边栏和 `/help` 继续使用现有强制认证树。

这保留了回访用户的原有入口，同时避免把整个受保护树改成 optional。上游已有
`authConfig.optional` 分支可作为这一个 public route 的认证探测依据，但不应把它
套到 `Root`、`/help` 或所有认证路由上。[官方认证源码](https://github.com/danny-avila/LibreChat/blob/main/client/src/hooks/AuthContext.tsx)

### 最简单：根路由始终展示公开 Landing

完全不探测认证状态，`/` 永远展示介绍，按钮再进入 `/login` 或 `/c/new`。实现和
回归面最小，但已登录用户每次打开根地址都会先看到介绍，改变当前“根地址直接新会话”
的习惯。只有明确接受这个行为变化时才适用。

### 保守：保留 `/`，新增 `/welcome` 或 `/about`

风险最低，但不满足“根地址就是介绍页”的目标，也会保留当前未登录访问 `/` 即
进入 `/login` 的体验。除非部署方必须保持根路由不变，否则不推荐。

## Landing / Help 内容分工

| 页面 | 面向对象 | 内容职责 | 不应承担 |
| --- | --- | --- | --- |
| `/` public Landing | 未登录访客、刚注册用户 | LibreChat 能做什么、一次最短上手路径、真实截图/GIF/MP4、进入应用的 CTA | 用户私有数据、需要 token 的查询、完整配置参考 |
| `/help` authenticated Help | 已登录用户 | 可搜索的操作手册：对话、附件、工具/Skill、Artifact、分享、故障处理 | SEO 首页、登录前的首次介绍、依赖聊天上下文的动态状态 |
| 聊天 `Landing.tsx` | 已登录且位于新会话 | 当前模型/Agent 的欢迎语、描述和 conversation starters | 产品总览和公开教程 |

内容应尽量只有一个事实来源：教程条目的标题、步骤和媒体元数据放在共享的
typed content 中；Landing 只取每个主题的短摘要，Help 展示完整步骤。用户提供的
Markdown 可以作为编写输入，短期构建时转换为该结构即可，避免为一个静态页面引入
运行时 Markdown 解析和额外安全面。媒体使用真实的截图、GIF 或 MP4，并预留固定
宽高；不要用 div 拼假的聊天界面。

## 关键风险

1. **认证树误挂载。** Landing 若放进现有 `AuthLayout`，匿名用户会被
   `AuthContext` 重定向到 `/login`；若复用 `Root` 或聊天 `Landing.tsx`，则可能因
   缺少 provider 直接报错或空白。公开组件必须只依赖静态内容、路由和全局主题。
2. **登录回跳丢失。** CTA、直接访问深链接和 OAuth 回调都要保留安全的
   `redirect_to`，不能用固定 `/c/new` 覆盖用户原本要访问的路径。上游已有安全重定向
   和 session redirect 处理，应复用其约束，而不是新增任意 URL 跳转。[官方登录源码](https://github.com/danny-avila/LibreChat/blob/main/client/src/components/Auth/Login.tsx)
3. **把 optional 扩大到全局。** 如果整个 `AuthLayout` 改为可选认证，聊天、帮助页
   和侧边栏可能在未认证时挂载，出现空白、未授权请求或状态污染。optional 只能局限
   于根路由的公开壳层。
4. **内容重复漂移。** Landing 的短教程和 Help 的完整教程如果各写一份，后续
   截图、工具名称和操作步骤会不一致；应共享内容 ID 和媒体引用，只在展示层裁剪。
5. **公开资源泄露与包体积。** Landing 不应引用用户附件、私有 S3 URL 或需要
   登录的 Artifact 资源。首屏媒体应小而真实，非首屏媒体懒加载并固定尺寸，否则会
   增加首屏加载和布局偏移。
6. **路由行为回归。** `/login`、`/register`、OAuth、`/share/*`、`/help` 和带
   query 的 `/c/new` 必须分别验证；尤其避免新增两个同优先级的 `/` index 分支，导致
   登录回跳或已登录根路由命中错误。
