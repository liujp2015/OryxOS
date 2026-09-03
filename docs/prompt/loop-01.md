# OryxOS Loop 提示词 · 01

> 来源：`docs/prompt/01.md`（39 句对话）。
> 目的：把同一份工作表达成 autonomous loop agent（ReAct / Claude Code / Cursor agent 模式）能直接拿来执行的单文件提示词 —剥掉对话噪音、合并 UI 选项回答与纠正、按依赖排序、每阶段带可验证判据。

---

## 目标

从 4 份设计文档出发，把 OryxOS 项目从 greenfield 端到端搭起来。最终交付：Maven 多模块 Spring Boot 应用（runtime）+ VitePress + GitHub Pages 网站（文档 + 主页）。两者都要能 build、能 run、能 ship。

## 上下文（先读）

| 项 | 值 |
|---|---|
| 工作根目录 | `E:\VibeCoding\OryxOS` |
| 设计文档（单一事实来源） | `docs/IndustryResearch.md`、`docs/DemandAnalysis.md`、`docs/TechnicalSolution.md`、`docs/AiProgrammingGuide.md` |
| 技术栈 | JDK 21 + Spring Boot 3.x + Spring AI Alibaba（只用于 Provider）+ SQLite + JPA + Picocli |
| Maven 模块（9 个，固定） | `oryxos-boot`、`oryxos-core`、`oryxos-provider`、`oryxos-memory`、`oryxos-tool`、`oryxos-web`、`oryxos-channel-cli`、`oryxos-storage`、`oryxos-cli` |
| Constitution | `CLAUDE.md` — 7 条不可协商原则（最关键：自实现 ReAct loop；Spring AI 只用于协议/schema — 禁用自动 tool 执行；审计表 `tool_invocations` + `llm_calls` day-one 落库；`ProviderService` 用显式 name→ChatModel 映射，不用类型扫描；Tool 是一个模块不是三个；SKILL.md 是 prompt 输入不是 Tool） |
| Git remote | `https://github.com/liujp2015/OryxOS.git` |
| Git proxy | `http://127.0.0.1:7890`（一次性 `git config http.proxy`） |
| 参考站点（主页视觉基线） | `E:\github\mq9\website` — 1:1 复制视觉（纯 achromatic、8 个 section、单点 pulse 动画） |
| 工具链 | Maven `mvn`（或生成后的 `mvnw`）；Node 22+ 用于 website |

---

## 阶段（按顺序执行，不要跳）

### Phase 1 — 项目元文件

**文件**：`CLAUDE.md`、`README.md`（都在仓库根）。

- 读完 `docs/` 下 4 份设计文档。
- 写 `CLAUDE.md`，包含 7 条 constitution 原则（见 `docs/AiProgrammingGuide.md` §3.2）。为 website 单列一条偏离声明（single-binary 仅在 `website/` 上暂停，owner 显式授权）。
- 写 `README.md`，参考标准开源项目布局，顶部放 logo（`docs/images/logo.svg`）。
- 进入下一步前**重读 CLAUDE.md**。**约束**：不要把 4 份设计文档从 `docs/` 移到别处。

**完成判据**：两个文件都在仓库根；4 份设计文档仍在 `docs/`。

### Phase 2 — 架构图 + Maven 骨架

**文件**：`docs/images/architecture.svg`、`docs/images/react-loop.svg`、`pom.xml`、`mvnw` + `mvnw.cmd` + `.mvn/`、9 个空模块目录。

- 从技术方案 + AI 编程指南生成 `architecture.svg` 和 `react-loop.svg`，在描述它们的文档里引用。
- 生成 `pom.xml` 父 POM，`packaging` 写 `pom`，声明 9 个模块（`module` 列表里全列 `oryxos-*`）。
- 创建 9 个模块目录，每个至少包含一个 `pom.xml`，继承父 POM 并声明预期依赖。例如 `oryxos-core` 不依赖任何其他模块，`oryxos-boot` 依赖全部。
- 跑 `mvn -q -DskipTests validate` 验证 POM 图正确。**硬关卡**：每个模块必须能编译出 `target/`，本阶段不通过不能往下走。

**完成判据**：`mvn validate` 成功；产出 9 个 `target/` 目录；`architecture.svg` + `react-loop.svg` 已提交。

### Phase 3 — Runtime 入口

**文件**：`oryxos-boot/src/main/java/.../OryxOsApplication.java`、`oryxos-boot/src/main/resources/application.yaml`、`oryxos-cli/src/main/java/.../OryxOsCli.java`、`oryxos-channel-cli/src/main/java/.../CliChannel.java`。

- `OryxOsApplication` 加 `@SpringBootApplication`。`mvn package` 后必须能 `java -jar` 启动 boot。
- 加 `application.yaml`：`spring.application.name=oryxos`、server port `8080`、SQLite 数据源指向 `${user.home}/.oryxos/oryxos.db`。
- `OryxOsCli` 是 Picocli 入口。`java -jar oryxos-boot.jar --version` 必须打印版本字符串。`java -jar oryxos-boot.jar`（不带参数）启动 Spring 上下文。
- `CliChannel` 在 `oryxos-channel-cli`，同样暴露 `--version`（委托给 boot）。

**完成判据**：
- `java -jar target/oryxos-boot-*.jar --version` 输出 `OryxOS <version>`，exit code 0。
- `java -jar target/oryxos-boot-*.jar` 启动 Spring 监听 :8080，`GET /api/v1/health` 返回 200。

### Phase 4 — 五大核心能力

顺序 = `AiProgrammingGuide.md` §1.3 的依赖序，不是优先级。

| US | 能力 | 涉及模块 | 验证 demo |
|---|---|---|---|
| US-1 | LLM Provider | `oryxos-provider`、`oryxos-core` | 2 个真实 Provider 跑通单元测试 |
| US-2 | ReAct 循环 | `oryxos-core`、`oryxos-tool`（HTTP tool）、`oryxos-channel-cli`、`oryxos-cli` | "查天气穿衣"通过 `oryxos chat` |
| US-3 | Memory | `oryxos-memory`、`oryxos-core` | "跨对话记偏好"— 第二次会话引用首次保存的偏好 |
| US-4 | Plugin Tool | `oryxos-tool`（file/shell/http）、`oryxos-core`（SKILL.md 通过 ContextLoader） | "零代码 PR digest" |
| US-5 | Web Service | `oryxos-web`、`oryxos-storage`、`oryxos-cli` | 10 个 REST 端点响应；Session 持久化到 SQLite |

每个 US 完成后跑 `/speckit.analyze`（或手动 cross-check `spec.md` vs 实现）。

**US-2 期间的 constitution 提醒**：
- ReAct 循环自实现；`ToolExecutor` 控制调度。
- **禁用** Spring AI 的自动 tool 执行。确认没有 `chatClient.call(prompt)` 拿到 tool calls 后被自动执行的路径。
- `ProviderService` 用显式 `Map<String, ChatModel>`，**不**按 Bean 类型扫描。

**US-3 和 US-5 期间的 constitution 提醒**：
- `tool_invocations` 和 `llm_calls` **执行当天就写** SQLite（不是只打日志）。
- 长期记忆是 `MEMORY.md` 文件 + `save_memory` / `recall_memory` 两个内置 Tool。核心阶段不引入向量库。

### Phase 5 — Logo

**文件**：`docs/images/logo.svg`、`docs/images/logo-dark.svg`、`docs/images/logo-mark.svg`。

- 画一个羚羊 mark（两只角 + 头 + 轨道环），SVG 格式。
- 彩色版 + 深色版。README 用 `<picture>`，彩色默认、深色在 `prefers-color-scheme: dark` 下切换。

**完成判据**：README 顶部在两种色彩模式下都能渲染 logo。

### Phase 6 — 主页（视觉基线 = `E:\github\mq9\website`）

**文件**：`website/package.json`、`website/.vitepress/{config.mts,theme/index.ts,theme/custom.css,theme/components/Home.vue}`、`website/index.md`、`website/public/logo*.svg`、`website/public/favicon.svg`、`website/public/architecture.svg`、`.github/workflows/deploy-website.yml`。

- 1:1 复制 `E:\github\mq9\website` 视觉：纯 achromatic、8 个 section、单点 pulse 动画、900px 和 768px 响应式。
- 文案替换为 OryxOS：Hero / Flow Diagram / Problem / Core Capabilities / Scenarios（8 张）/ SDK Integration（3 张）/ Protocol / CTA。
- 在 `custom.css` 里覆盖 VitePress 默认：隐藏 `VPHero`、`VPFeature`、`VPNavBarAppearance`、`VPSwitchAppearance`。强制 `appearance: 'force-light'`。
- 加载 Google Fonts（Space Grotesk / Inter / JetBrains Mono）。
- 进入 Phase 7 前确认：`npm run docs:dev` 在 http://127.0.0.1:5173/ 正常显示。

**完成判据**：dev server 渲染全部 8 个 section，无布局破损。

### Phase 7 — Website 文档 + i18n

**文件**：`website/docs/{index,overview,demand,tech,ai-guide}.md`、`website/zh/index.md`、`website/zh/docs/{index,overview,demand,tech,ai-guide}.md`、`website/.vitepress/config.mts`。

- 每篇 EN 文档对应一份设计文档：
  - `overview.md` ← `IndustryResearch.md`（定位 + 四词锚点）。
  - `demand.md` ← `DemandAnalysis.md`（5 大能力、里程碑）。
  - `tech.md` ← `TechnicalSolution.md`（7 个决策、9 个模块）。
  - `ai-guide.md` ← `AiProgrammingGuide.md`（5 个 user story、Spec-Kit 流程）。
- `zh/docs/` 镜像翻译。技术词保留英文：`Agent OS`、`ReAct`、`Spring Boot`、`JDK 21`、`MCP`、`MEMORY.md`、`SKILL.md`、`LLM`、`Provider`、`Profile`、`Tool`、`Channel`、`Session`、`Sandbox`，所有 `oryxos-*` 模块名、所有命令名、所有类名。
- `config.mts` 配置 `locales`：`root`（English）+ `zh`（简体中文）。每 locale 独立 nav + sidebar。locale switcher 在 nav 自动出现。
- `config.mts` 设 `base: '/OryxOS/'`（project site 在子路径；漏掉会导致所有 asset 404）。

**完成判据**：`npm run docs:build` 成功；`/`、`/docs/`、`/zh/`、`/zh/docs/`、`/zh/docs/tech` 本地都返回 200；HTML 里 asset URL 全部含 `/OryxOS/`。

### Phase 8 — Logo 接到 website

**文件**：`website/.vitepress/{config.mts,theme/components/Home.vue}`。

- `docs/images/logo-mark.svg` 作为单一源（已镜像到 `website/public/logo-mark.svg`）。
- 在 Home.vue hero 顶部显示（80px 方形，居中）。
- root 和 zh 两个 locale 都加 `themeConfig.logo: { src: '/logo-mark.svg', alt: 'OryxOS' }` — VitePress nav 会用图替换文字标题。

**完成判据**：hero 顶部能看到 mark；nav 左上角是 mark 图。

### Phase 9 — 溢出治理

**文件**：`website/.vitepress/theme/components/Home.vue`（`.oryx-primitives`、`.oryx-primitive`、`.oryx-code`）、`website/.vitepress/theme/custom.css`（html/body）。

问题：3 列 Core Capabilities grid 里 `<pre>` 代码块行长超过列宽，把卡片撑出列外，整页出现横向滚动条。

修复：
1. `.oryx-primitives` 把 `grid-template-columns` 改成 `repeat(3, minmax(0, 1fr))`。
2. `.oryx-primitive` 加 `min-width: 0`。
3. `html, body` 加 `overflow-x: hidden`（兜底，不影响垂直滚动）。
4. `.oryx-code` 保留 `overflow-x: auto` — 代码块自己内部出滚动条。

**完成判据**：viewport 1440 / 1280 / 1100 / 900 / 768 下整页都不出横向滚动条；只有 code block 内部在内容过宽时出滚动条。

### Phase 10 — GitHub Pages 部署

**文件**：`.github/workflows/deploy-website.yml`。

- Workflow 在 push 到 `main` 时触发，路径过滤：`website/**`、`docs/images/**`、workflow 文件本身。
- Node 24、`npm ci`、`vitepress build`、`actions/configure-pages@v4`、`actions/upload-pages-artifact@v3`、`actions/deploy-pages@v4`。

需要 owner 手动做的（loop 做不了）：仓库 Settings → Pages → Source 选 **GitHub Actions**。没勾上之前 Pages 不会上线。

**完成判据**：push 后 https://liujp2015.github.io/OryxOS/ 返回 200；HTML 引用的每个 CSS/JS/font 也返回 200。

### Phase 11 — 仓库清理

- 提交 `README.md`、`docs/images/`（logo + 架构图）、`docs/prompt/01.md`（对话归档）— 之前 session 遗留的 untracked。
- 提交 `docs/prompt/loop-01.md`（本文件）。
- 沿用约定：每个新会话追加到 `01.md`（扁平编号，不分类）或开 `02.md`。

**完成判据**：`git status` 在 `docs/` 和仓库根没有 untracked 文件。

---

## 验收（整份提示词的硬关卡）

全部满足才算完成：

1. `mvn -q clean package` 跨 9 个模块成功。
2. `java -jar oryxos-boot/target/oryxos-boot-*.jar --version` 输出 `OryxOS <version>`，exit code 0。
3. `java -jar oryxos-boot/target/oryxos-boot-*.jar` 启动 Spring :8080；`GET /api/v1/health` 返回 200。
4. 5 个 user story demo 全过（US-2 到 US-5；US-1 通过 Provider 单元测试验证）。
5. `cd website && npm run docs:build` 成功无错误。
6. `curl -I https://liujp2015.github.io/OryxOS/` 返回 200；页面引用的每个 asset URL 也都返回 200。

## 失败恢复

| 症状 | 动作 |
|---|---|
| `mvn` 报模块依赖错 | 重读 `CLAUDE.md` §1（模块表）；修依赖方向（始终 `core` ← 能力模块 ← `boot`）；不允许循环依赖。 |
| AI agent 启用了 Spring AI 自动 tool 执行 | 重读 constitution 第 4 条；删掉任何 `ChatClient.call(...).getOutput().getToolCalls()` 后接自动执行的路径。`ToolExecutor` 是唯一执行者。 |
| `ProviderService` 按 Bean 类型扫描 `ChatModel` | 改成显式 `Map<String, ChatModel>`，key 是 provider name。 |
| Tool 被拆到多个模块 | 合并回 `oryxos-tool` 一个模块。 |
| SQLite 里没有审计表 | 确认 `tool_invocations` 和 `llm_calls` 的 repository 已注册，从 `ToolExecutor` / `ProviderService` 调用写入。 |
| 端口 5173 被占 | `taskkill //F //PID <pid>` 后重启 `npm run docs:dev`。 |
| 端口 8080 被占 | `taskkill //F //PID <pid>` 后启动 OryxOS。 |
| Git push 失败（SSL handshake / connection reset） | 确认 `git config http.proxy http://127.0.0.1:7890` 已设；重试。 |
| GitHub Pages 上了但 asset 404 | `config.mts` 必须设 `base: '/OryxOS/'`；rebuild 后 push。 |
| Hero 太宽 → Core Capabilities 溢出 | 确认 grid 用 `minmax(0, 1fr)`、item 用 `min-width: 0`、body 用 `overflow-x: hidden`。 |
| VitePress 出现暗模式按钮 | `config.mts` 设 `appearance: 'force-light'`；在 `custom.css` 隐藏 `VPSwitchAppearance` / `VPNavBarAppearance`。 |

## Loop 卫生

- 每次会话开头往 `docs/prompt/01.md`（或开 `02.md`）追加一条新编号 turn。
- `loop-01.md` 只在新增 phase 或验收标准变化时更新。
- 每个 phase 结束就 commit，不要等到整个 run 跑完再提交。