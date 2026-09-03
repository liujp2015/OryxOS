---
title: 需求分析
description: 功能需求、核心能力、里程碑
---

本页面介绍 OryxOS 的功能需求。它涵盖了 OryxOS 的能力范围、五大核心能力、核心功能集合、里程碑计划,以及作为核心阶段发布门槛的验收 demo。

核心开发阶段交付 Agent OS 的**运行时内核**。将 OryxOS 推向真正受监管企业级 Agent OS 的**治理层**(多租户隔离、SSO、完整审计、Tool Policy)会在核心发布后逐步增量构建。

## OryxOS 做什么

OryxOS 安装在企业自有 Kubernetes 或服务器上,扮演一个统一底座,让各种业务 Agent(运维助理、客服助理、HR 助理、销售助理、知识管理助理)共享同一套渠道层、同一套模型路由、同一套工具执行层、同一套记忆系统、同一套沙箱。数据停留在企业自有基础设施之内,不存在云厂商锁定。

之所以把产品定位在 Java 生态,是因为 Spring AI Alibaba 已经解决了 LLM 调用基础设施。**缺的正是它上面那一层 Agent OS**。OryxOS 补上这一层。

## 五大核心能力

OryxOS 在核心开发阶段优先打磨五大核心能力。这些能力覆盖了让单个 Agent 在运行时内核中跑好所需的全部内容。把 OryxOS 变成真正企业级 Agent OS 的治理层,在后续阶段补齐。

### 能力一:LLM Provider 抽象

OryxOS 通过 Provider 抽象层对接主流 LLM(DeepSeek、Qwen、Kimi、智谱、混元、豆包、Anthropic、OpenAI 等)。Agent 不知道自己调用的具体是哪一个模型。运行时切换是非绑定的。

它能解锁:

- 任意业务场景下的自然语言对话 Assistant。
- 同一个 Agent 在不同任务上用不同模型:简单任务用便宜模型,复杂任务用强模型。
- 接入企业自有的本地推理(Ollama、vLLM),数据留在企业内部。
- 多 Provider 编排:用便宜模型做规划,用强模型做综合。

### 能力二:ReAct 循环

**ReAct**(Reason + Act 的简称)是 Agent 的核心运行机制。当 Agent 收到任务时,LLM 思考要不要调用 Tool、调哪个。Agent 执行 Tool 拿到结果,再决定下一步,直到产出最终回答。

它能解锁:

- Agent 自决定何时调用哪个 Tool,没有硬编码的业务逻辑。
- 多步任务在单次会话内完成(读文件、分析、调接口、出报告)。
- Agent 能从错误中恢复:回滚、重试、换 Tool。
- 复杂业务流程不需要预先编排,Agent 在运行中动态选择执行路径。

### 能力三:三层记忆

Agent 记住用户偏好、项目背景、决策与对话历史。三层设计是完整范围,核心阶段只交付两层(会话记忆 + 长期记忆),情节记忆(episodic memory)在扩展阶段补齐。

- **会话记忆(Session memory)** —— 当前对话的完整历史,过长时自动压缩。
- **长期记忆(Long-term memory)** —— 用户偏好、项目背景、关键事实,存储在 `MEMORY.md` 文件中,跨会话持续。
- **情节记忆(Episodic memory)** —— 每一次任务学到了什么:改了哪些文件、做了哪些决策、产出了哪些结果。扩展阶段补齐。

它能解锁:

- Agent 跨会话记住用户偏好("我一般用 Spring Boot 而不是 Spring MVC"、"我的项目部署在 Kubernetes 上")。
- 长期任务跨中断保持状态,在会话断开后能续上。
- 团队里的多个 Agent 共享同一个用户的偏好。
- 历史决策可追溯("为什么上次选 DeepSeek 不选 Kimi"在记忆里可被搜到)。

### 能力四:Plugin Tool + 内置 Tool 集

Agent 通过调用 Tool 来真正做事。OryxOS 提供两类 Tool:

- **内置 Tool** —— OryxOS 自带:文件操作、Shell 执行、HTTP 请求。
- **Plugin Tool** —— 业务团队扩展,按复杂度递增分三档。

Plugin Tool 的三档:

- **零代码** —— 写一份 `SKILL.md` 描述意图,复用社区 MCP server(GitHub、Slack、Notion 等)。LLM 读完描述后自己串起来。
- **轻代码** —— 用任意语言(Python、Shell、Go、Java)自己写一个 MCP server,把企业系统接进来。
- **全代码** —— 用 `@Tool` 注解把 Java Spring Bean 写成 Tool,做深度集成。

它能解锁:

- 把 Agent 接到企业 ERP、CRM、CMDB。
- 接到 GitHub、Jira、Confluence,服务工程 Assistant。
- 接到 Prometheus、Grafana、SSH,服务运维自愈。
- 接到企业查号、天气、新闻 API,做信息聚合。
- 业务团队只用 Markdown 就能上线新场景,零代码模式。

### 能力五:Web Service

OryxOS 通过一套完整的 REST API 暴露所有能力。业务系统不用关心内部实现,通过 HTTP 就能集成 Agent。**Web Service 是 OryxOS 对外的门面**,也是企业把 AI 能力嵌入既有业务系统的唯一通道。

API 覆盖六大类:会话管理(创建会话、发送消息、拉取历史、归档会话)、Agent 调用(无状态调用、流式响应扩展阶段补)、Profile 管理(列表、查看、重载)、Memory 操作(拉取长期记忆、手动写入、清空)、Tool 信息(列出可用 Tool、查看元数据)、系统状态(健康检查、运行时指标、Provider 状态)。

它能解锁:

- 业务系统通过 REST API 调用 Agent,把 AI 能力嵌入既有产品。
- 跨语言集成:任何能发 HTTP 的语言都能集成。
- 一个 OryxOS 实例同时服务多个业务系统。
- 监控告警、Webhook 触发、定时任务通过 Web Service 调用 Agent。
- 第三方开发者在 REST API 之上构建更上层的 AI 产品。

## 关于 Channel

除了五大核心能力,还有一个基础模块叫 **Channel**(入站消息渠道)。Channel 负责处理"消息进来、响应出去"。核心阶段只交付 CLI Channel。IM 渠道(企业微信、飞书、钉钉)在扩展阶段交付。Channel 是核心功能模块,但不计入"五大核心能力"以保持编号清爽。

## 五大能力的组合

五大能力是五个齿轮,组合起来能解锁真实的企业场景:

- **全渠道客服** —— LLM 理解问题,ReAct 循环查询知识库,Memory 保留客户历史,Plugin Tool 接 CRM,Web Service 把客服系统以 HTTP 形式暴露。
- **运维 Assistant** —— LLM 分析告警,ReAct 循环查日志并重启服务,Memory 保留历史故障知识,Plugin Tool 接 Prometheus 和 SSH,Web Service 被告警 Webhook 触发。
- **工程 Assistant** —— LLM 理解需求,ReAct 循环读写代码,Memory 保留项目规范,Plugin Tool 接 GitHub 和 CI,Web Service 接入 IDE 插件。
- **知识管理** —— LLM 理解问题,ReAct 循环检索文档,Memory 保留团队约定,Plugin Tool 接 Confluence,Web Service 嵌入内网门户。
- **销售 Assistant** —— LLM 组装客户档案,ReAct 循环查 CRM 和企业查号,Memory 保留客户偏好,Plugin Tool 接销售系统,Web Service 驱动销售 App。
- **数据分析** —— LLM 生成 SQL,ReAct 循环执行查询并出图,Memory 保留业务表结构,Plugin Tool 接 BI 系统,Web Service 让 BI 工具接入自然语言查询。

这些场景不需要 OryxOS 单独建模块。业务团队配置 Profile、写 Plugin Tool、调用 Web Service API 即可。

## 核心功能集合

核心功能集合是核心阶段 4 周(共 12 小时)必须走通的最短路径。它对应 Agent OS 的运行时内核。

### 工作区初始化

OryxOS 的工作目录是 `.oryxos/`。`oryxos init` 命令对它做初始化,创建工作区及其内容:

- 五个子目录:`profiles/`(Profile 配置,每个 Agent 一份 YAML)、`sessions/`(会话历史)、`skills/`(存放 `SKILL.md`)、`logs/`(结构化日志)、`tools/`(自定义 Tool 配置)。
- 三份 Bootstrap 文件(Agent 启动时被加载到系统 prompt,让 Agent 知道项目上下文、自身身份和用户偏好):`AGENTS.md`(项目级 Agent 行为)、`SOUL.md`(默认 Agent 人格)、`USER.md`(用户偏好)。
- 一个默认 Profile(`profiles/default.yaml`),让用户有东西可跑:一个默认 LLM Provider、几个基础 Tool、CLI 渠道。

### Profile 配置

**Profile** 是一个 Agent 的完整配置,以 YAML 文件形式表达。一个 Profile 对应一个 Agent。这是 OryxOS 的核心配置抽象。

Profile YAML 包含五段:

- `identity` —— Agent 名称、描述、人格 prompt。可引用 `SOUL.md`。
- `provider` —— 绑定的 LLM Provider,provider 名加模型加参数。可选的 fallback 配置。
- `tools` —— Tool 列表,每个按名称,可带参数。
- `channels` —— 绑定的渠道,渠道名加配置。
- `bootstrap` —— 加载到系统 prompt 的 Bootstrap 文件。

Profile 命令:`oryxos profile create <name>`、`oryxos profile list`、`oryxos profile show <name>`、`oryxos profile delete <name>`。编辑 YAML 不需要重启 OryxOS,下次 Agent 启动时生效。

核心阶段支持多个 Profile 共存于一个实例。多个 Agent 并行运行是核心阶段"OS"概念的最小演示。

### Provider 抽象(能力一)

Provider 是 LLM 调用的统一抽象。所有 LLM 调用都走 Provider 接口,Agent 不知道具体调用的是哪一个模型。

核心阶段直接基于 Spring AI Alibaba 的 `ChatClient` 实现。Spring AI Alibaba 已经自带 DeepSeek、Qwen、文心、Kimi、智谱、混元、豆包、Anthropic、OpenAI 等连接器。OryxOS 将其包装成自己的 Provider 抽象,不再重造一遍。

每个 Provider 实例配置 provider 名(deepseek、qwen、kimi 等)、模型名、API key、可选的 base URL。Profile 按名字引用 Provider。

核心阶段不实现 fallback 或 hedge racing。Provider 失败直接以错误返回给 Agent。Fallback 链、熔断、hedge racing 留到后续阶段。

### ReAct 循环(能力二)

ReAct 循环是 OryxOS 最关键的代码。算法是 Reason + Act:LLM 思考(Reason)是否调用 Tool、调哪个、用什么参数;OryxOS 执行(Act)Tool 并把结果回喂给 LLM;LLM 看到结果后决定下一步。循环直到 LLM 给出最终回答或达到迭代上限。

执行步骤:

1. 接收用户消息,追加到 Session 的对话历史。
2. 组装 prompt(系统 prompt + Bootstrap + 对话历史 + 可用 Tool 列表)。
3. 调用 LLM Provider 获取响应。
4. 如果响应里没有 Tool 调用,返回最终响应。
5. 如果响应里有 Tool 调用,OryxOS 执行 Tool,把结果作为 tool message 追加到对话历史。
6. 回到第 2 步继续循环。
7. 当达到最大迭代次数(默认 10)时,循环终止。

核心阶段实现说明:

- ReAct 逻辑刻意保持精简:核心循环就是几十行 Java。自实现,不依赖 Spring AI 的 Agent 抽象。
- 最大迭代次数可在 Profile 中覆盖。每次 LLM 调用和 Tool 调用都以结构化形式记录,便于排错。
- Tool 调用失败按重试策略重试。重试次数限制在 Tool Result 内部返回。

核心阶段不实现并行 Tool 调用(同一响应里的多个 Tool 调用按顺序执行)、动态上下文压缩、Agent 间任务委托。这些后续补齐。

### Memory(能力三)

Agent 跨会话保留状态。三层设计是完整范围;核心阶段交付最小的两层实现(会话 + 长期),情节记忆留给扩展阶段。

**会话记忆**(经由 Session 管理):当前对话的完整历史。超出 LLM 上下文窗口时按简单策略截断。

**长期记忆**(核心阶段最小实现):`.oryxos/memory/` 下的一份 `MEMORY.md` 文件,跨所有会话持续。Agent 通过两个内置 Tool 主动读写 —— `save_memory(content)` 把内容追加到 `MEMORY.md`;`recall_memory(query)` 按关键词检索匹配内容。Agent 启动时,整份 `MEMORY.md` 被注入到系统 prompt 作为长期上下文。文件超过默认大小限制(4000 字符)时直接截断;压缩机制在扩展阶段补齐。

核心阶段不包括:自动事实抽取(由 LLM 自己决定何时调用 `save_memory`)、语义检索(`recall_memory` 用关键词匹配,不做向量化)、情节记忆(任务过程的文件变化、决策、结果归到扩展阶段)、带 claim/evidence 结构的 Memory Wiki、矛盾检测、新鲜度管理。

> 用户侧的体感:用 OryxOS 一段时间后,Agent 自然地记住用户偏好、项目上下文和关键决策。下一次会话时用户不需要复述。这是 Agent OS 区别于普通聊天机器人的地方。

### Tool 体系(能力四)

Tool 是 Agent 可以调用的外部能力。Agent 通过 LLM 的 Function Calling 决定何时调用哪个 Tool;OryxOS 负责 Tool 注册、查找、执行和结果返回。分两类,这种划分是 OryxOS 让业务团队做扩展的核心机制。

**内置 Tool**(随 OryxOS 一起发布)。核心阶段按三组提供五个内置 Tool:

- **文件操作 Tool** —— `read_file`、`write_file`、`list_dir`。在沙箱内运行,带路径白名单限制。
- **Shell Tool** —— 执行 bash 命令。带超时和命令白名单限制。
- **HTTP Tool** —— 发送 HTTP 请求(GET、POST)。带域名白名单限制。
- 加上两个 Memory 相关的内置 Tool:`save_memory`(追加内容到 `MEMORY.md`)、`recall_memory`(按关键词检索匹配内容)。

**Plugin Tool**(由业务团队扩展)。业务团队通过三档递增模式扩展 OryxOS 能力。第一档是推荐默认 —— 它是 LLM 时代最优雅的写作方式:业务团队只描述意图,LLM 自己组合既有能力。

- **第一档(零代码)** —— 写 `SKILL.md` 并复用既有 MCP server。业务团队写一份 `.oryxos/skills/<name>.md` 描述要做什么,Profile 引用这份 Skill 和所需的 MCP server(GitHub、Slack、Notion 等社区都有大量 MCP server),LLM 读完 Skill 决定调哪些 MCP 工具,把任务组合起来。
- **第二档(轻代码)** —— 自写 MCP server。业务团队用任意语言(Python、Shell、Go、Java)写 MCP server,通过标准 MCP 协议暴露 Tool,OryxOS 以 MCP Client 身份连接。
- **第三档(全代码)** —— 写 Java Spring Bean。用 Spring AI 的 `@Tool` 注解标记 Java 方法,OryxOS 在启动时注册。适合直接调用企业内部 Java 服务的场景。

> 选型原则:能选第一档就选第一档,能选第二档就选第二档。Plugin Tool 是 OryxOS 让业务团队把真实场景落地的途径。OryxOS 自身只提供基础的内置 Tool;运维 Assistant、客服 Assistant、销售 Assistant 都依赖业务团队把 `SKILL.md` 和 MCP server 组装起来。

**MCP Client 集成**(核心阶段)。OryxOS 实现一个最小可用的 MCP Client,连接到外部 MCP server 并调用它们的 Tool。配置通过 `.oryxos/mcp_servers.yaml` 声明 MCP server 的 URL 或启动命令。OryxOS 在启动时连接,把这些 server 的 Tool 注册进 Tool 池,Profile 按名字引用它们。

**沙箱**是 Tool 调用的安全隔离机制。核心阶段使用应用层白名单校验:文件操作走路径白名单、Shell 走命令白名单、HTTP 走域名白名单。还会强制超时和资源限制。核心阶段不用 Java SecurityManager(JDK 17 起弃用,JDK 21 已移除,与项目的 JDK 21 要求冲突)。基于 bwrap、Docker 或 K8s pod 的完整沙箱隔离在扩展阶段交付。

### Channel 集成

Channel 是入站消息入口,负责处理"消息进来、响应出去"。HTTP 集成归 Web Service(能力五),不属于 Channel。

核心阶段只交付一种 Channel:**CLI Channel**,通过 `oryxos chat` 启动。这是开发和调试阶段的主要交互模式。支持多轮对话、上下文查看、Tool 调用记录检查。

企业微信、飞书、钉钉、Slack 等 IM Channel 在扩展阶段交付。它们的实现复杂度(Webhook、卡片、媒体、组织结构)以及单独的 OAuth 流程和企业资质,使得它们被排除在 12 小时核心阶段之外。扩展阶段的 IM Channel 内部调用 Web Service,因此 Agent 实现不会重复。

### Web Service(能力五)

Web Service 是 OryxOS 的完整对外门面。业务系统通过 REST API 集成 OryxOS。这是把 OryxOS 区别于 OpenClaw、Hermes 这类个人 Assistant 项目的关键能力。

API 覆盖六大类:会话管理(创建会话、发送消息、拉取历史、归档会话)、Agent 调用(无状态调用、流式响应扩展阶段补)、Profile 管理(列表、查看、重载)、Memory 操作(拉取长期记忆、手动写入、清空)、Tool 信息(列出可用 Tool、查看元数据)、系统状态(健康检查、运行时指标、Provider 状态)。

核心阶段交付 10 个最关键的端点。12 小时很紧,核心阶段覆盖最短路径;其余在扩展阶段交付:

| 端点 | 描述 | 类别 |
|---|---|---|
| `POST /api/v1/sessions` | 创建会话 | 会话管理 |
| `POST /api/v1/sessions/{id}/messages` | 发送消息 | 会话管理 |
| `GET /api/v1/sessions/{id}` | 拉取会话历史 | 会话管理 |
| `DELETE /api/v1/sessions/{id}` | 归档会话 | 会话管理 |
| `POST /api/v1/agents/{name}/invoke` | 无状态 Agent 调用 | Agent 调用 |
| `GET /api/v1/profiles` | 列出 Profile | 信息查询 |
| `GET /api/v1/memory` | 拉取长期记忆 | 信息查询 |
| `GET /api/v1/tools` | 列出可用 Tool | 信息查询 |
| `GET /api/v1/health` | 健康检查 | 系统状态 |
| `GET /api/v1/info` | 系统信息 | 系统状态 |

扩展阶段再补 15 个端点:Profile show/reload/create/update/delete;Memory append/clear/search;Tool describe 和调用历史;LLM 调用历史和 token 统计;Webhook 触发;SSE 流式响应;Prometheus 指标;OpenAPI 规范。

核心阶段不包含认证(假定内网,扩展阶段补 API Key + JWT)、SSE 流式响应(核心阶段是同步阻塞返回,扩展阶段补 SSE)、WebSocket、RBAC 权限。

### Session 管理

Session 是用户与 Agent 一次会话的容器,包含起止时间、用户身份、Agent 标识、对话历史、当前上下文、临时变量。Session ID 由渠道、用户和 Agent 共同派生。

核心阶段把 Session 数据持久化到本地 SQLite(位于 `.oryxos/sessions/`)。活跃 Session 可以在 OryxOS 重启后继续。

跨会话的长期记忆、上下文压缩、Memory Wiki 在扩展阶段交付。核心阶段超出 LLM 上下文窗口时简单截断早期的对话回合。

### 三种运行模式

OryxOS 提供三种运行模式,都在核心阶段实现。这是用户与 OryxOS 交互的入口:

- `oryxos chat` —— 交互式多轮对话。用户与 Agent 在终端对话;Agent 调用 LLM 和 Tool 实时返回结果。支持 `--message "xxx"` 单条消息发完即退。
- `oryxos serve` —— HTTP API 模式。OryxOS 在指定端口(默认 8080)暴露 RESTful 接口。业务系统通过 HTTP 调用 OryxOS Agent。
- `oryxos gateway` —— 长跑守护进程模式。OryxOS 同时挂载多个渠道(完整多渠道功能落在扩展阶段;核心阶段只挂 CLI 与 HTTP API)。

三种模式共用同一份 Profile 配置和 Session 存储。

### 命令行工具

OryxOS 通过命令行工具操作。核心阶段交付 12 个命令。这是用户交互的完整入口集合:

- **启动与状态** —— `oryxos init`、`oryxos status`、`oryxos chat`、`oryxos serve`、`oryxos gateway`。
- **Profile 管理** —— `oryxos profile list`、`oryxos profile create <name>`、`oryxos profile show <name>`、`oryxos profile delete <name>`。
- **查询** —— `oryxos provider list`、`oryxos tool list`、`oryxos session list`。

> 命令行工具是 OryxOS 与用户最直接的接口。核心阶段必须交付顺畅的命令行体验,包括清晰的错误信息和帮助文本。

### 配置与密钥加载

OryxOS 加载敏感配置,包括 LLM API key、Provider 凭据、MCP server 凭据。

核心阶段交付一个基础版本:敏感配置通过环境变量注入,或从专用本地配置文件加载;**不以明文写入 Profile YAML**。加载时校验必填字段和结构,缺字段或非法时给出清晰错误。完整加密存储、密钥轮换、接入企业密钥管理(KMS、Vault)在扩展阶段交付。

## 里程碑计划

核心功能实现按 4 周节奏推进(每周 3 小时,共 12 小时)。每周聚焦一项或多项核心能力,每周结束时都有一个可演示的结果。

| 周次 | 核心能力 | 周末 demo |
|---|---|---|
| 第 1 周 | LLM Provider + ReAct 循环(能力 1 + 2) | Agent 进行多轮对话并调用 HTTP Tool |
| 第 2 周 | Memory + Tool 体系(能力 3 + 4) | Agent 记住偏好、读写文件、调用外部 MCP Tool |
| 第 3 周 | Web Service(能力 5) | 外部系统通过 10 个 REST 端点调用 OryxOS |
| 第 4 周 | 多 Agent 演示 + 工程打磨 | 多 Agent 共存、完整 CLI、跨重启 Session 恢复、公开主页 |

### 第 1 周:LLM Provider + ReAct 循环(能力 1 + 2)

范围:

- `oryxos init` 工作区初始化、Profile YAML 解析。
- 基于 Spring AI Alibaba 的 Provider 抽象(先用 DeepSeek 或 Kimi 跑通)。
- ReAct 循环(核心循环几十行 Java,包括 LLM 调用、Tool 调用解析、消息累积)。
- 一个基础内置 Tool(HTTP),CLI Channel。
- Session 管理(内存版,SQLite 持久化第 4 周补)。

Demo:`oryxos chat` 能与 Agent 进行多轮对话;Agent 用 ReAct 循环调用 HTTP Tool 完成一个简单任务(比如"查北京天气,告诉我穿什么")。

### 第 2 周:Memory + Tool 体系(能力 3 + 4)

范围:

- 长期记忆最小实现(`MEMORY.md` 文件、`save_memory` 与 `recall_memory` 内置 Tool、启动时整文件注入系统 prompt)。
- 文件操作 Tool(`read_file`、`write_file`、`list_dir`)、Shell Tool(带白名单校验)。
- MCP Client 集成(连接外部 MCP server)。

Demo:Agent 记住用户偏好("我用 Spring Boot"),并在后续会话中应用这些偏好;Agent 读写本地文件、调用外部 MCP server 的 Tool,完成一个跨工具任务。

### 第 3 周:Web Service + API 端点(能力五)

范围:

- 10 个核心 REST 端点:会话管理(4)、Agent 调用(1)、Profile/Memory/Tool 列表(3)、健康/系统信息(2)。
- `oryxos serve` 启动 Spring MVC 服务。
- 配置与密钥加载(环境变量注入加基础校验)。

Demo:外部系统通过 10 个 REST 端点调用 OryxOS(创建会话、发消息、拉 Profile、拉 Memory、拉 Tool、拉健康)。API 调用链路完整。

### 第 4 周:多 Agent 演示 + 工程打磨

范围:

- 多 Agent 演示(同一实例上跑两个不同 Profile 的 Agent,验证"OS"多 Agent 形态)。
- 完整的 12 命令 CLI、Session 持久化到 SQLite(跨重启恢复)。
- Bootstrap 文件机制(`AGENTS.md`、`SOUL.md`、`USER.md` 加载到系统 prompt)。
- 结构化日志、公开主页(VitePress 或同类静态站点工具)。

Demo:多 Agent 在同一实例上共存;CLI 体验完整顺畅;Bootstrap 文件影响 Agent 行为;Session 跨重启恢复;公开主页可访问。

核心阶段结束后,OryxOS 1.0 就是一个可演示的、最小完整的 Agent OS 运行时内核。全部五大核心能力已经接好并能工作,具备配置 Agent、CLI 对话、并行运行多个 Agent、接受 REST API 集成、对接 MCP 工具生态的能力。

之后进入**社区接力阶段**:扩展特性(多渠道、Memory 自动抽取与语义检索、情节记忆、Skill 系统、MCP server 暴露、Tool Policy、完整沙箱、剩余 15 个 Web Service 端点 + SSE 流式响应 + 认证、Web Dashboard、SSO 与多租户隔离、完整审计、集群高可用)和让 OryxOS 变成真正企业级 Agent OS 的治理层,由社区贡献者逐步推进。

## 验收标准

验收分为四类:功能、性能、可运维性、场景。

### 功能验收

核心功能集合里的全部核心特性必须完成,每个功能模块至少一个端到端测试用例:

- `oryxos init` 工作区初始化。
- Profile 配置与管理(多 Profile 共存)。
- Provider 抽象(DeepSeek 与 Kimi 至少跑通)。
- ReAct 循环(多步 Tool 调用、对话历史正确累积、达到最大迭代时正确终止)。
- 长期 Memory(`save_memory` 写入、`recall_memory` 关键词检索、启动时注入系统 prompt)。
- 内置 Tool(文件、HTTP、Shell、`save_memory`、`recall_memory`)。
- Plugin Tool 集成(第一档零代码 `SKILL.md` + MCP 跑通;第三档 `@Tool` 注解示例跑通)。
- MCP Client 集成、CLI Channel。
- 全部 10 个核心 Web Service REST 端点工作正常。
- Session 持久化(SQLite、跨重启恢复)、12 个 CLI 命令、配置与密钥加载。

### 性能验收

压测验证:单节点 10 个 Agent 稳定运行 4 小时,单节点 100 个并发 Session,Session 创建 P99 延迟 < 200ms,内部转发开销 < 50ms。这些是核心阶段目标;不达标不阻塞发布,但应在扩展阶段解决。

### 可运维性验收

完整的部署文档(新手在 30 分钟内完成单节点部署);CLI 工具有清晰的帮助和错误信息;公开主页可访问,并清楚说明 OryxOS 是什么、如何开始。

### 场景验收

五个 demo Agent 验证五大核心能力。**五个 demo 全部跑通是核心发布的硬性条件**:

| Demo | 验证内容 | 内容 |
|---|---|---|
| Demo 1 | LLM Provider + ReAct | "查天气并写日报";Agent 调用天气 API,用文件 Tool 把日报写到本地 |
| Demo 2 | Memory | 第一次对话表达偏好(Spring Boot、Kubernetes),Agent 调用 `save_memory`;第二次对话的回答引用已存的偏好 |
| Demo 3 | Plugin Tool + MCP | Agent 用 MCP Client 调用外部 server 的 Tool,完成跨工具任务 |
| Demo 4 | Web Service 同步调用 | 外部系统创建 Session、发消息、拉响应、归档;完整链路打通 |
| Demo 5 | Web Service 多端点 | 外部系统依次调 info、profiles、tools、invoke、memory,完成一个业务工作流 |

## 接下来读什么

- 想了解 OryxOS 的构建方式 —— 七项关键技术决策、分层架构、五大能力详解、九个 Maven 模块 —— 见 **[架构设计](/zh/docs/tech)**。
- 想了解项目如何使用 AI 工具开发(Spec-Kit、五个 user story、增量开发),见 **[AI 开发指南](/zh/docs/ai-guide)**。