# tool.tl 项目开发指南

## 基本信息

- **网站**：tool.tl / tool-tl.com（镜像域名）
- **定位**：87 个免费在线工具，隐私优先，多语言（en / zh-CN / zh-TW / ja）
- **技术栈**：Astro 5.9 + React 18 + Tailwind CSS v4.1 + Cloudflare Pages
- **搜索**：Pagefind 1.4（构建时生成静态索引）
- **收益模式**：Google AdSense 广告，优先开发高 CPC 金融工具

## 重要规则（必读）

- **始终用中文回复**，本地文档也用中文
- 新增工具必须在 **8 个路由文件**中各加一次 import + render 条件（4 locale × [slug].astro + 4 locale × [slug]/[variant].astro）
- 工具组件注册后，GeneratorTool fallback 条件里也要加 `tool.component !== 'YourComponent'` 排除
- commit message 格式：`feat/fix/docs/chore: 描述`，末尾加 `Co-Authored-By: Codex Sonnet 4.6 <noreply@anthropic.com>`

## 项目结构

```
src/
├── data/
│   └── tools.json          # 工具数据唯一来源（groups + tools 数组）
├── components/tools/       # 每个工具一个 .tsx 文件
├── pages/
│   ├── [slug].astro        # 英文工具页（注册工具组件）
│   ├── zh-CN/[slug].astro
│   ├── zh-TW/[slug].astro
│   └── ja/[slug].astro
├── i18n/
│   └── config.ts           # toolCategories 必须与 tools.json groups 一致
└── styles/global.css       # CSS 变量、prose 样式
```

## 添加新工具流程

1. 在 `src/components/tools/` 新建 `XxxTool.tsx`
2. 在 `src/data/tools.json` 的 `groups[category].tools` 数组加 slug
3. 在 `src/data/tools.json` 的 `tools` 数组加完整工具定义（含 4 语言 name/description/subtitle、variants）
4. 在 8 个 `[slug].astro` 文件中加 import + render 条件
5. 提交推送，Cloudflare Pages 自动部署

## 工具定义结构

```json
{
  "slug": "tool-slug",
  "name": { "en": "...", "zh-CN": "...", "zh-TW": "...", "ja": "..." },
  "description": { ... },
  "subtitle": { ... },
  "category": "dev",
  "component": "ComponentName",
  "keywords": "space separated keywords",
  "apiType": "frontend",
  "variants": [
    {
      "slug": "variant-slug",
      "name": { ... },
      "defaultMode": "",
      "title": { ... },
      "description": { ... }
    }
  ]
}
```

## 后端 API

- **本地路径**：`C:\WorkSpace\website-md\en\tool.tl\api\<service-name>\`（Z: 盘也可访问）
- **Git 远程**：`git.reshub.cn:readme/md-website.git`（master 分支）
- **发布流程**：改代码 → commit/push → 运行 `release_all_api.tool.tl_<name>.sh`
  - Server A：git pull + docker build --no-cache + push Harbor
  - Server B：pull + restart container
- **注意**：必须先 commit/push，再跑 release 脚本，否则 Server A 拉到旧代码

## 环境变量（wrangler.toml 管理）

```toml
[vars]
PUBLIC_API_BASE = "https://api.tool.tl"
PUBLIC_CONTENT_API_BASE = "https://api.tool.tl/content"
PUBLIC_NETWORK_API_BASE = "https://api.tool.tl/network"
PUBLIC_GA_ID = "G-8SLSZV6G0S"
PUBLIC_ADSENSE_ID = "pub-9845089349130720"
```

## CSS 变量（global.css）

```css
--color-bg / --color-text / --color-border / --color-primary
--color-card-bg / --color-card-hover
--site-shell-max: 72rem
```

## 工具追踪

```javascript
window.__trackToolUsed?.(slug)  // 5 分钟去重，POST 到 api.tool.tl
```

## 已知问题与决策记录

- **nav 居中**：Header.astro 的 nav wrapper 用 `style="max-width: var(--site-shell-max)"` + `mx-auto`，不用 `site-shell` 类（Tailwind v4 CSS 排序问题）
- **site-shell 类**：CSS 排序问题导致 `@media (min-width: 1180px)` 被基础规则覆盖，内容区各页面仍使用 `site-shell`，nav 已改用内联 style
- **文章阅读数**：客户端 JS POST 上报（绕过 CDN 缓存），不用 SSR
- **语言跳转**：tool 页面用 sessionStorage 存 `tl_locale_redirect` 防止循环跳转

## 开源相关

- 公开仓库：`git@github.com:reshub-ai/tool.tl.git`（此目录）
- 私有开发仓库：`git@github.com:reshub-ai/astro-tool.tl.git`（C:\WorkSpace\website-pages\astro-tool.tl）
- **TOOLS_ROADMAP.md 已加入 .gitignore**，不会被提交
- GA ID / AdSense ID 是前端公开值，放 wrangler.toml 没问题

## 工具分类（当前各分类数量）

| 分类 key | 数量 |
|---|---|
| pdf | 7 |
| image | 14 |
| barcode | 5 |
| dev | 20 |
| network | 11 |
| email | 9 |
| finance | 16 |
| password | 3 |
| video | 1 |
| health | 1 |
| **合计** | **87** |
