---
title: AI 开发指南
description: Spec-Kit 工作流、5 个 user story、增量开发
---

本页面介绍 OryxOS 如何借助 AI 工具构建。OryxOS 明确采用两阶段方法:**主体开发阶段**用 Spec-Kit 驱动五个 user story;**增量开发阶段**切到 Claude Code 配合手动提示词,做小改动。**七条 Constitution 原则**和**按依赖排序的五个 user story**,是把工作拉回正轨的两项关键输入。

## 两阶段方法

OryxOS 的 AI 编程实现分两阶段,各阶段使用不同的协作工具。

**主体开发阶段** —— 从零构建 OryxOS 1.0 的五大核心能力。整个项目有 9 个 Maven 模块,模块边界清晰;需求文档和技术方案完整。用 Spec-Kit 跑完整的"spec 驱动"流程:constitution → specify → plan → tasks → implement。这能保证产出对齐需求,避免 vibe-coding 漂移。

**增量开发阶段** —— 扩展特性、修 bug、补 Plugin Tool。这些都是小粒度增量,通常改 1 到 3 个文件。切到 Claude Code 配合手动提示词;为小增量跑完整 Spec-Kit 流程太重了。

> 两阶段的边界很清晰:Spec-Kit 适合大粒度 greenfield;手动提示词适合小粒度增量。OryxOS 的主体开发是前者,社区接力是后者。**工具与工作性质匹配**。

## 为什么这跟 OryxOS 匹配

OryxOS 是 Spec-Kit 的教科书级适用场景:

- **Greenfield** —— OryxOS 是一个从零构建的全新项目,不是对既有代码的重写。Spec-Kit 的甜点。
- **中等规模** —— 9 个 Maven 模块、5 个定义清晰的核心能力,经典中等规模。
- **需求清晰** —— 完整的需求文档和技术方案已经存在,五个核心能力各自都有 user-story 级的描述。
- **AI agent 协作** —— OryxOS 以 Claude Code 作为主要开发 agent 构建。
- **方法论价值** —— Spec-Kit 强制的流程能让产出对齐需求,对团队学习工程方法论有价值。

社区对 Spec-Kit 在 brownfield 项目上的疑虑,OryxOS 都不沾边 —— OryxOS 是纯 greenfield。

Spec-Kit 有四个已知局限,值得提前知道:

1. **流程开销对小增量过重。** 完整流程对小改动太贵。OryxOS 通过在增量阶段切到手动提示词来应对。
2. **Spec 不会自动跟实现同步。** 如果 AI agent 在 `implement` 阶段偏离 spec,spec 文件不会更新。OryxOS 通过每个 user story 完成后跑 `/speckit.analyze` 来抓跨 artifact 漂移。
3. **大 brownfield 上上下文会爆。** 几十万文件的旧项目超出 LLM 上下文。OryxOS 是 greenfield,整个代码库塞进上下文窗口都没问题。
4. **Spec-Kit 本身迭代快。** 命令名、artifact 格式、集成方式都在变。本页面描述的原则和节奏不锁特定版本。

## 七条 Constitution 原则

Constitution 是项目的**不可协商原则**。后续每一步 spec、plan、task、implement 都必须遵守。它们源自需求文档的设计目标和技术方案的关键技术决策。

| # | 原则 |
|---|---|
| 1 | JDK 21 + Spring Boot 3.x 单二进制应用,Maven 多模块(9 个)。 |
| 2 | 五大核心能力(LLM、ReAct、Memory、Tool、Web Service)优先,支撑模块次之。核心阶段交付运行时内核;企业级治理层在扩展阶段补齐。 |
| 3 | 自实现 ReAct 循环。不使用 Spring AI 的 Agent 抽象。 |
| 4 | Spring AI 只用一半。**只用**它的 Provider 抽象、协议转换和 `@Tool` 的 schema 生成。**关闭**它的自动 Tool 执行。Tool 调度完全由 `ReActLoop` 和 `ToolExecutor` 控制。 |
| 5 | Plugin Tool 三档接入,主推 `SKILL.md` + MCP 零代码方式。 |
| 6 | 核心阶段 SQLite + `MEMORY.md`。向量检索在扩展阶段补齐。审计表(`tool_invocations` 和 `llm_calls`)day one 落库。 |
| 7 | 每个 user story 完成后有一个可演示的 demo。"跑通"优于"完美"。 |

> 第 4 条(Spring AI 只用一半)和第 6 条(审计表 day one)是 AI agent 最容易跳过的两条,也是最关键的两条。它们被写进 constitution,让 AI agent 每次都能看到。

Constitution 一次写好,在整个主体开发期间锁住。**如果发现某条原则错了,团队停下讨论**。AI agent 无权自行修改 constitution。

## 准备阶段:Spec-Kit artifacts

开始实施前,项目团队准备三份 Spec-Kit artifact,让每个 user story 都有清晰的依据。

### Spec-Kit 安装与 Claude Code 配置

Specify CLI 是 Spec-Kit 的入口(Python 实现,要求 Python 3.11+,推荐用 uv 安装)。安装后跑 `specify init` 初始化 OryxOS 的 Spec-Kit 工作区,生成 `.specify/memory/constitution.md` 目录结构以及 spec、plan、tasks artifact 目录。

Claude Code 是推荐的主 AI agent。Spec-Kit 官方支持 Claude Code。具体的集成方式(早期 slash command、目前的 Claude Code skills 模式,通过 init 时参数指定)以官方文档为准。本页面不锁定具体安装步骤,因为它们随版本变化。

### 编写 constitution

Constitution 是项目的不可协商原则。它承载了上面列出的七条原则。AI agent 在每次 specify / plan / implement 循环中主动引用它,让开发始终与 OryxOS 的方向对齐。

Constitution 一次写好,在整个主体开发期间保持稳定。

### 编写 spec:五个按依赖排序的 user story

`/speckit.specify` 以需求文档为输入,产出五份 user story spec,每个核心能力一份。

五个 user story **按依赖排序,而不是按重要性排序**。这是一个关键点:US-5(Web Service)被放在最后实现,**不是因为它不重要**,而是因为它依赖前四个先就绪。事实上 Web Service 是把 OryxOS 区别于个人 Assistant 项目的关键能力。本页面不使用 P1/P2/P3 优先级标签,因为它容易被误读成"后面的可以跳"。依赖顺序就是规则:US-1 → US-2(基座),US-3 + US-4(并行),US-5(收口)。

每个 user story 的验收标准直接对应五个验收 demo:

- US-1 + US-2 → Demo 1(查天气,推荐穿衣)。
- US-3 → Demo 2(跨会话记住偏好)。
- US-4 → Demo 3(零代码 PR 摘要)。
- US-5 → Demo 4 + Demo 5(Web Service 同步调用 + 多端点流程)。

`/speckit.specify` 产出 `spec.md` 后,跑 `/speckit.clarify`,让 AI agent 问几个澄清性问题(比如默认最大迭代数、对话历史截断策略)。这步可选,但建议做。

### 编写 plan

`/speckit.plan` 以技术方案加先前生成的 `spec.md` 和 `constitution.md` 为输入,产出实施 plan。plan 包含:技术栈选型(JDK 21 + Spring Boot 3.x + Spring AI Alibaba + SQLite + Picocli)、9 个 Maven 模块的职责(对应技术方案的"项目结构"一节)、关键技术决策的展开(自实现 ReAct、Spring AI 仅用一半的边界、Plugin Tool 三档、SQLite + `MEMORY.md`、审计表 day one)、数据流和模块间协作(`PromptBuilder` + `ProviderService` + `ToolExecutor` + `MemoryService` 三层门面)。

> 人工 review 生成的 plan 是必要步骤。AI agent 可能基于自己对技术方案的理解做出不该做的选择。检查点:有没有把 Memory 简化合并到 Session(应该是 `MemoryService` 三层统一门面)?有没有把 Tool 拆成多个模块(应该是合并的 `oryxos-tool`)?有没有把 `SkillLoader` 当成 Tool(应该放在 core 里的 `ContextLoader`)?有没有启用 Spring AI 的自动 Tool 执行(必须关闭)?Review 通过后,`plan.md` 锁住。

### 准备阶段交付物

准备阶段结束时,OryxOS 仓库里应该有:`.specify/memory/constitution.md`(原则集)、`spec.md`(5 个 user story)、`plan.md`(技术栈 + 9 模块 + 技术决策)、原始的需求文档和技术方案文档(留在仓库作为源参考)、Claude Code 与 Specify CLI 配置说明。准备完成,五个 user story 就可以按依赖顺序推进。

## 五个 user story(按依赖排序)

> 五个 user story 按 user story 拆分,而不是按时间拆分。依赖顺序就是实现顺序。US-3 和 US-4 在 US-2 完成后并行。

| User Story | 核心能力 | 依赖 | 对应 demo |
|---|---|---|---|
| US-1 | LLM Provider | 无(基座) | (与 US-2 一起) Demo 1 |
| US-2 | ReAct 循环 | US-1 | Demo 1(查天气,推荐穿衣) |
| US-3 | 三层 Memory | US-2 | Demo 2(跨会话记住偏好) |
| US-4 | Plugin Tool 体系 | US-2(与 US-3 并行) | Demo 3(零代码 PR 摘要) |
| US-5 | Web Service | 前四个 | Demo 4 + Demo 5(同步调用、多端点流程) |

依赖关系展开:

- US-1 是基座。没有 LLM 调用,任何 Agent 能力都跑不起来。
- US-2 依赖 US-1。ReAct 循环每次迭代都要调 LLM。
- US-3 + US-4 并行依赖 US-2。Memory 注入到 ReAct 的 prompt;Tool 由 ReAct 调用。
- US-5 依赖前四个。它把所有能力对外暴露。

推进顺序是 US-1 → US-2 → (US-3 + US-4 并行) → US-5。具体时间投入由项目团队决定。

User story 拆分恰好契合 Spec-Kit 的天然组织方式。Spec-Kit 的 `/speckit.tasks` 按 user story 组织任务;每个 user story 成为一个独立的实施阶段,任务按依赖排序,标出可并行的项。OryxOS 按五大核心能力拆分,跟 Spec-Kit 的工作方式对得上。

### US-1:LLM Provider(能力一)

**目标** —— 让 OryxOS 能调用任何主流 LLM。Agent 不知道具体调的是哪一个模型。LLM 调用的复杂性由 Spring AI Alibaba 吸收;OryxOS 只是在它之上套一层薄壳。

**涉及 Maven 模块** —— `oryxos-core`(`OryxTool` 接口、`Session`、`Profile`、`ContextLoader` 等核心抽象)、`oryxos-provider`(能力一)、`oryxos-boot`(Spring Boot 启动模块)。

**预期任务类别** —— 环境搭建(9 个模块的 Maven 多模块骨架、Spring Boot 启动配置、Spring AI Alibaba 依赖);核心抽象(`OryxTool` 接口、`Profile` 数据结构、`Message` 数据结构);Provider 实现(`ProviderService` 实现、显式 provider name → `ChatModel` 映射、Function Calling 适配);配置(`application.yaml` 配置至少一个跑通的 Provider,DeepSeek 或 Kimi,`ConfigLoader` 从环境变量加载 API key)。

> 一个要在任务备注里重点标出的点:`ProviderService` 不能用"扫描容器里所有 `ChatModel`"的方式区分 Provider。当多个 Provider 共存时,Bean 类型一样,产生歧义。维护一份**显式的 provider name → `ChatModel` 映射**。AI agent 倾向于写类型扫描;任务需要专门点出来。

US-1 自身没有 demo,因为还没有用户可见的入口。下一个 US-2 与 US-1 一起跑 Demo 1。

### US-2:ReAct 循环(能力二)

**目标** —— 实现 Agent 的核心工作机制。LLM 思考是否调用 Tool,调用,看结果,决定下一步,直到产出最终响应。ReAct 循环是 OryxOS 最关键的代码。

**涉及 Maven 模块** —— `oryxos-core`(`ReActLoop`、`PromptBuilder`、`ToolExecutor`、`ContextLoader`)、`oryxos-tool`(一个 HTTP Tool + 简化版 `SandboxChecker`,Demo 1 需要)、`oryxos-channel-cli`(CLI 渠道,Demo 1 需要)、`oryxos-cli`(`oryxos init` 与 `oryxos chat` 命令)。

注意 Tool 相关模块已经统一到 `oryxos-tool`。原本的多 Tool 模块结构不再保留。

**预期任务类别** —— ReAct 循环类(`ReActLoop` 主循环、`PromptBuilder`、`ToolExecutor`、`MAX_ITERATIONS` 控制);CLI 渠道类(`CliChannel`、`oryxos chat` 命令、`oryxos init` 工作区初始化);基础 Tool 类(HTTP Tool、简化版 `SandboxChecker` 只校验 URL 白名单);Profile YAML 解析类(SnakeYAML、Profile 校验);Session 类(Session 数据结构、内存版 SessionManager,持久化在 US-5)。

**关键任务粒度** —— US-2 是 Spec-Kit 拆分的重头戏。几个复杂任务需要更细的拆分:

- `ReActLoop` 主循环(核心循环逻辑精简,几十行 Java,但错误处理、日志、消息累积、迭代控制这些工程部分,建议拆 2 到 3 个子任务)。
- `PromptBuilder` 组装(四段:系统 prompt + Bootstrap + Memory + 对话历史 + Tool 列表,建议拆成渐进叠加的子任务)。

> 再次强调关键边界(constitution 原则 4):调用 Spring AI 时,只用它的协议转换和 schema 生成。关闭它的自动 Tool 执行。Tool 调度由 `ToolExecutor` 控制。AI agent 实现 `ReActLoop` 时倾向于启用 Spring AI 的自动执行,导致 Tool 被调两次。任务里必须显式禁止。

US-1 + US-2 完成后,跑 `/speckit.analyze` 检查 spec / 代码一致性。

**Demo 1 验收:查天气,推荐穿衣。** `oryxos chat` 启动 CLI。用户输入"查北京天气,告诉我穿什么"。Agent 用 ReAct 循环调 HTTP Tool 拉天气 JSON,根据数据推荐穿衣,完整对话日志正确累积到 Session。至少一个 Provider(DeepSeek 或 Kimi)跑通。

### US-3:三层 Memory(能力三)

**目标** —— 让 Agent 跨会话保留状态。核心阶段交付最小的两层实现(会话 + 长期),用一份 `MEMORY.md` 加两个内置 Tool,让 Agent 主动读写。

**涉及 Maven 模块** —— `oryxos-memory`(能力三,含 `MemoryService` 三层门面、`LongTermMemory`、`MemoryTools`)。

**预期任务类别** —— `MemoryService` 门面类(三层统一门面,对 ReAct 循环只暴露一个接口,内部把会话记忆委托给 `SessionManager`,长期记忆委托给 `LongTermMemory`);`LongTermMemory` 类(四个方法:`append`、`load`、`recallByKeyword`、`truncateIfNeeded`,接口通过带 mode 参数的 `recall` 为向量检索预留升级空间);`MemoryTools` 类(`save_memory`、`recall_memory` 两个内置 Tool,带 `@Tool` 注解);`PromptBuilder` 集成类(`PromptBuilder` 中的 Memory 注入,确保 US-2 已跑通的 ReAct 不被破坏);`MEMORY.md` 文件管理类(文件位置、格式约定、超长截断策略)。

US-3 的任务粒度小,整体工程量中等。`MemoryService` 门面和 `LongTermMemory` 各方法都不大,两个 Tool 略大,`PromptBuilder` 集成是变更类任务,小心别破坏既有逻辑。US-3 完成后跑 `/speckit.analyze`。

**Demo 2 验收:跨会话记住偏好。** 第一次对话:告诉 Agent"我的项目用 Spring Boot,部署在 Kubernetes"。Agent 主动调用 `save_memory` 把内容追加到 `MEMORY.md`。重启 OryxOS 或开新会话。第二次对话:问"帮我看下项目可以用哪些数据库"。Agent 在回答里引用之前存的偏好。

### US-4:Plugin Tool 体系(能力四)

**目标** —— 让业务团队扩展 OryxOS 能力。Plugin Tool 三档:零代码 `SKILL.md` + MCP(推荐)、轻代码自写 MCP server、全代码 Java `@Tool` 注解。

核心阶段完成三档基础设施加内置 Tool 收尾。

**涉及 Maven 模块** —— `oryxos-tool`(文件 Tool + Shell Tool 完整、MCP Client、完整 `SandboxChecker`、`ToolRegistry`,三合一模块)、`oryxos-core`(`SKILL.md` 通过 `ContextLoader` 加载,不在 Tool 模块)。

**预期任务类别** —— 内置 Tool 收尾类(文件 Tool `read_file`、`write_file`、`list_dir`;Shell Tool 带白名单;完整 `SandboxChecker` 实现);MCP Client 类(`mcp_servers.yaml` 解析、`McpClientService` 启动连接、`tools/list` 拉取、`McpToolAdapter` 包成 `OryxTool`);`SKILL.md` 类(`ContextLoader` 加载 `.oryxos/skills/` 下引用的 `SKILL.md` 并拼到系统 prompt,属于 core 不属于 tool);Profile 升级类(Profile 加 `skills` 字段和 `mcp_servers` 字段)。

**关键任务粒度** —— US-4 任务较多。几个复杂任务需要重点拆分:

- MCP Client 集成(MCP 协议是 JSON-RPC over stdio 或 SSE。Java 生态成熟度落后于 Python。建议先实现 stdio transport(最常见),SSE 放扩展阶段。stdio MCP Client 建议拆子任务:连接管理;`tools/list`;`tool/call`;错误恢复)。
- 完整 `SandboxChecker`(从 US-2 的只校验 URL 的简化版,扩展到完整版:文件路径白名单 + Shell 命令白名单 + HTTP 域名白名单。建议 3 个子任务)。

US-4 完成后跑 `/speckit.analyze`。

**Demo 3 验收:零代码 PR 摘要。** 业务团队写 `.oryxos/skills/daily-pr-digest.md` 描述任务。`mcp_servers.yaml` 配置 `github-mcp`(用社区 MCP server)。配置一个 Profile 引用这份 Skill 和 MCP server。Agent 启动后读 `SKILL.md` 描述,调 `github-mcp` 拉 PR,汇总成日报。整个流程是业务团队的零代码工作 —— 一份 Markdown 加配置。

### US-5:Web Service(能力五)

**目标** —— 通过 REST API 暴露 OryxOS 的全部能力。业务系统通过 HTTP 集成。这是把 OryxOS 区别于个人 Assistant 项目的关键能力。

**涉及 Maven 模块** —— `oryxos-web`(能力五)、`oryxos-storage`(SQLite 持久化层;Session 持久化从内存版升级;`tool_invocations` 和 `llm_calls` 审计表写入)、`oryxos-cli`(完整的 12 个 Picocli 命令)、`oryxos-core`(`ConfigLoader`、`ContextLoader` Bootstrap 加载完整化)。

**预期任务类别** —— Web Service 基础类(`WebServer` 启动带虚拟线程配置、`GlobalExceptionHandler`、OpenAPI 文档);六个 `ApiController` 类(Session、Agent、Profile、Memory、Tool、System,各 Controller 各自负责一组端点,可并行实现);10 个核心 REST 端点类(4 会话管理、1 Agent 调用、3 Profile/Memory/Tool 列表、2 `health`/`info`);持久化升级类(Session 从内存升级到 SQLite、`SessionRepository`、跨重启恢复,加上 `tool_invocations` 和 `llm_calls` 审计表写入);配置与上下文类(`ConfigLoader` 配置密钥加载、`ContextLoader` Bootstrap 文件加载完整并与 `PromptBuilder` 集成);CLI 完整版(12 个 Picocli 命令全部实现);工程类(Logback + SLF4J 结构化日志 + 错误处理)。

> 注意审计表写入发生在 US-5(constitution 原则 6):`tool_invocations` 和 `llm_calls` 在核心阶段就落库,不只是打日志。这样审计数据的地基从 day one 就铺好。AI agent 倾向于跳过这步(觉得日志就够了);任务必须明确写出来。

**关键任务粒度** —— US-5 工程量最大。六个 `ApiController` 可并行实现(无相互依赖);每个 Controller 1 到 2 个端点。Session 升级到 SQLite 主要是 `SessionRepository` 加 `messages_json` 序列化,小心 Session 状态迁移。Bootstrap 加载(`ContextLoader`)与 `PromptBuilder` 集成,必须保证已跑通的 ReAct 不被破坏。US-5 完成后跑最后一次 `/speckit.analyze`,整个主体开发结束。

**Demo 4 验收:Web Service 同步调用。** 外部系统 `POST /api/v1/sessions` 创建 Session,`POST /api/v1/sessions/{id}/messages` 发消息,`GET` 拉历史,`DELETE` 归档。完整链路打通。

**Demo 5 验收:Web Service 多端点流程。** 外部系统依次调 `GET /info` 拉健康和 Provider 列表,`GET /profiles` 拉可用 Agent,`GET /tools` 拉可用 Tool,`POST /agents/{name}/invoke` 无状态调用 Agent,`GET /memory` 拉长期记忆。五个不同端点协作完成一个业务工作流。

## 跨 user story 协作模式

五个 user story 实施期间,有几个贯穿的协作点:

- 每个 user story 完成后跑 `/speckit.analyze`,检查 constitution / spec / plan / tasks / 代码的一致性。**尽早抓住漂移是反漂移的核心机制**。
- AI agent 偏离 constitution 时,主动纠正。盯着 Claude Code 生成的代码,看是否与 constitution 不符(比如用了非 JDK 21 特性、改动 ReAct 实现、启用 Spring AI 自动 Tool 执行、把 Tool 拆成多个模块、Provider 用类型扫描)。让 AI agent 重读 constitution 并修正。**这些正是 OryxOS 最容易写错的地方**。
- 跨任务上下文丢失时,回到 spec。Spec-Kit 把代码拆成多个任务后,AI agent 可能不记得前一个任务做了什么。定期让它重读 `spec.md` + `plan.md` + 最近代码。
- 用 `git commit` 标记每个 user story 完成。方便回滚到稳定状态。

## 增量阶段:手动提示词模式

主体开发完成后,OryxOS 进入增量阶段。工作性质与主体开发完全不同:

- 单任务粒度小(加一个 Channel、修一个 bug、加一个 Plugin Tool)。
- 涉及文件少(通常 1 到 3 个)。
- 没有跨模块协作。
- 上下文是既有代码,不是从零设计。

> 这类工作,Spec-Kit 流程太重了。跑完整的 constitution → specify → plan → tasks → implement,代价比工作本身还大。手动提示词 + Claude Code 更合适:打开 Claude Code,描述要做什么,Claude Code 在既有代码上下文里直接改,改完跑测试,直接发 PR,无需事先准备正式的 spec 或 plan artifact。

### 增量开发工作流

典型的增量流程:

- 社区贡献者挑一个 issue(主仓库会标 `good-first-issue`、`feature-request`、`long-term-goal`)。
- 本地 fork 并 clone OryxOS。
- 在 Claude Code 里打开项目,跟 Claude 描述改动。
- Claude 在既有代码基础上修改、加测试、跑通。对主仓库发 PR。
- 项目团队 review 并 merge。

这个流程不强制 Spec-Kit;贡献者按自己舒服的方式工作。对于严格的大型特性,贡献者可以选择跑 Spec-Kit,但不强制。

### 与主体阶段 Spec-Kit artifact 的衔接

主体阶段的产出 `constitution.md` 和 `spec.md` 留在仓库,作为增量阶段的参考:

- `constitution.md` 仍然不可协商。社区贡献的代码必须遵守(JDK 21 + Spring Boot、自实现 ReAct、Spring AI 只用一半、Plugin Tool 三档等)。
- `spec.md` 是核心能力的契约。修改核心能力的社区贡献者不能破坏 spec 里的验收标准。
- `plan.md` 在主体阶段结束后基本冻结。技术方案文档留在仓库作为社区参考。

新 user story 按以下方式处理:

- 小特性直接走手动提示词 + PR。
- 大特性(涉及新 Maven 模块、constitution 变更、跨多个核心能力的横切改动)由项目团队决定是否跑一轮新的 Spec-Kit specify → plan → tasks 流程。

## 风险与注意事项

实施期间有几个风险需要知道:

- **AI agent 偏离 constitution。** AI agent 可能走捷径,生成与 constitution 不符的代码。对策:每个 implement 完成后人工检查。发现漂移时立刻让 AI agent 重读 constitution 并修正。OryxOS 最容易写错的地方是:Spring AI 自动执行没关、Provider 用类型扫描、Tool 拆成多个模块、SkillLoader 被当 Tool 处理、审计表没落库。重点盯这几个点。
- **跨 user story 上下文断裂。** AI agent 可能忘掉前几个 user story 做的具体决策。对策:每个 user story 开始时,让 AI agent 重读 `spec.md` + `plan.md` + 最近代码。
- **`/speckit.analyze` 被跳过。** analyze 是跨 artifact 一致性检查命令。跳过它,spec 和代码会逐渐漂移。对策:把 analyze 视为每个 user story 结束时的硬性 checkpoint,不能跳过。
- **MCP server 集成陷阱。** Java MCP Client 生态成熟度落后于 Python。stdio transport 可能遇到进程启动失败、stdin/stdout 编码问题。对策:US-4 实施 MCP 前,用一个最小 MCP server 测连通性。
- **Java 工程基本功是前提。** 对 Spring Boot + Maven + JPA 不熟会显著拖慢节奏。对策:实施前确保团队成员对 Spring Boot 生态有工作理解。

## 总结

OryxOS 的 AI 编程实现分两阶段。

**主体开发用 Spec-Kit。** 既有需求文档加技术方案喂给 Spec-Kit,转成 constitution + spec + plan + tasks artifact。准备阶段一次性产出 constitution、spec、plan。五个 user story 按依赖顺序推进:US-1 + US-2 搭基座,US-3 与 US-4 并行,US-5 在前四个完成后收口。每个 user story 结束都有一个可演示 demo,对应五个验收 demo。

**增量阶段切到 Claude Code 配合手动提示词。** 小粒度增量不适合 Spec-Kit 的完整流程。社区贡献者用 Claude Code 在既有代码上直接改。主体阶段产出的 constitution + spec 留作长期参考。

Spec-Kit 和 OryxOS 是一对强匹配:纯 greenfield、中等规模(9 模块)、需求清晰、AI agent 协作、有方法论价值 —— 每条都吻合。社区对 Spec-Kit 在 brownfield 项目上的批评不适用于 OryxOS。

> 核心策略:**把既有文档喂给 Spec-Kit,不要重写**。OryxOS 已经在完整的行业研究、需求文档、技术方案上投入了很多。这是 Spec-Kit 最好的输入,远比从零生成 spec 的质量高。关键是喂**最新版本**的文档:9 个模块而不是 11;constitution 必须包含"Spring AI 只用一半"和"审计表 day one";否则 Spec-Kit 生成的 plan 会按旧结构跑偏。

按 user story 拆分,而不是按时间拆分。推进顺序是 US-1 → US-2 → (US-3 + US-4 并行) → US-5。4 周节奏对应技术方案的实施节奏章节。

## 接下来读什么

- 想了解 OryxOS 的功能和里程碑计划,见 **[需求分析](/zh/docs/demand)**。
- 想了解技术架构和模块设计,见 **[架构设计](/zh/docs/tech)**。
- 想了解 OryxOS 是什么以及宏观定位,见 **[概览](/zh/docs/overview)**。