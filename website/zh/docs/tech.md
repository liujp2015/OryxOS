---
title: 架构设计
description: 技术架构、9 个 Maven 模块、关键设计决策
---

本页面介绍 OryxOS 是如何被构建的。它涵盖七项关键技术决策、分层架构、五大能力的深度解析,以及九个 Maven 模块。

核心开发阶段交付运行时内核。架构上有意为治理层 —— 多租户隔离、SSO、完整审计、Tool Policy —— 留出了后续扩展空间。

## 技术栈一览

OryxOS 是一个跑在 JDK 21 上的 Spring Boot 3.x 单二进制应用,自实现 ReAct 循环,用 Spring AI Alibaba 调 LLM,用 SQLite 做持久化,用 Picocli 做 CLI。一句话总结:

**JDK 21 + Spring Boot 3.x + Spring AI Alibaba + 自实现 ReAct 循环 + SQLite + Picocli**。

## 七项关键技术决策

五大核心能力催生了七项关键设计决策。它们不可协商:核心开发必须遵守。

| # | 决策 | 选择 | 一句话理由 |
|---|---|---|---|
| 1 | ReAct 循环 | 自实现,不依赖 Spring AI Agent 抽象 | Agent 内核完全可控 |
| 2 | Spring AI 边界 | 仅用协议转换和 schema 生成,关闭自动 Tool 执行 | 否则 Tool 会被调两次 |
| 3 | 执行模型 | 同步阻塞 + 虚拟线程 | 代码直白,真有并发 |
| 4 | Tool 注册 | `@Tool` 注解 + `OryxTool` 抽象层 | ReAct 不关心 Tool 从哪来 |
| 5 | HTTP 层 | Spring MVC + 虚拟线程 | 单节点承载数千并发连接 |
| 6 | 沙箱 | 路径 / 命令 / 域名白名单,不用 SecurityManager | SecurityManager 在 JDK 21 已消失 |
| 7 | 持久化 | SQLite + `MEMORY.md`,审计表 day one 落库 | 可审计地基从一开始就打 |

### 决策 1:自实现 ReAct 循环

Spring AI 处理 LLM 调用、Function Calling 协议转换、Provider 抽象。ReAct 循环从头写起。这让 Agent 内核完全可控,并为未来循环定制留出空间。

### 决策 2:Spring AI 仅用于协议转换和 schema 生成

> **决策 2 是 bug 最容易钻进来的地方,因此被单列为一项决策。**

Spring AI 自带一套完整的 Tool 调用自动执行机制,它能自动执行 Tool 并把结果回喂给模型。OryxOS 不使用这套自动执行。OryxOS 用 Spring AI 只做两件事:

- Provider 抽象和到各家 LLM 的协议转换。
- `@Tool` 注解的 JSON Schema 生成。

Tool 的调度与执行完全由 OryxOS 自己的 `ReActLoop` 和 `ToolExecutor` 控制。Spring AI 在 OryxOS 里只是协议适配器和 schema 生成器,不是循环引擎。开发期间必须把 Spring AI 的自动 Tool 执行关掉,否则 Tool 会被调两次。

### 决策 3:同步执行模型

核心阶段使用同步阻塞执行,与 Spring MVC 保持一致。一条消息从入站经 ReAct 循环、Tool 调用、Provider 调用,最后回到最终响应,全程同步。这与 Java 21 虚拟线程天然合拍,**不用响应式编程就能拿到高并发**。流式输出(SSE)和异步 Tool 调用落在扩展阶段。

### 决策 4:`@Tool` 注解 + `OryxTool` 抽象层

Spring AI 注解扫描 Java 方法并生成 JSON Schema。OryxOS 在此之上加一层薄的 `OryxTool` 抽象,统一内置 Tool 与 MCP Tool 的接口形态,这样 ReAct 循环不关心 Tool 从哪来。具体的注解名称跟随所选 Spring AI 版本,开发前对照所用版本核对。

### 决策 5:HTTP 服务层用 Spring MVC + 虚拟线程

同步直白的代码配合虚拟线程并发,让单节点轻松承载数千并发连接。扩展阶段加入 SSE 流式响应时,Spring MVC 的 `SseEmitter` 原生支持。

### 决策 6:沙箱用路径 / 命令 / 域名白名单

文件操作限定在工作目录;Shell 命令使用白名单;HTTP 请求使用域名白名单;校验在应用层完成。**不使用 Java SecurityManager** —— 它自 JDK 17 起被弃用,JDK 21 已经移除,与 JDK 21+ 要求冲突。扩展阶段用 subprocess + bwrap 或 Docker 做完整的沙箱隔离。

### 决策 7:SQLite + `MEMORY.md`,审计表 day one 落库

Profile YAML 位于 `.oryxos/profiles/`。Session、Tool 调用、LLM 调用落到 SQLite。两张与审计相关的表 `tool_invocations` 和 `llm_calls` 在核心阶段就写(读 API 可以后续再加),可审计性的数据地基从一开始就打。**避免之后不得不反向解析日志来凑审计**。完整向量检索在扩展阶段交付。

## 分层架构

OryxOS 的整体架构围绕五大核心能力加上支撑模块来组织。核心能力是 Agent OS 运行时内核的主体;支撑模块是让核心能力跑起来的工程底座。

OryxOS 是一个 Spring Boot 单二进制应用,有两个外部入口:

- **CLI Channel**:本地交互与调试。
- **Web Service**:业务系统通过 REST API 集成。

两个入口都汇入同一台引擎。

引擎就是 **ReAct 循环**,系统的中枢。它驱动这条链路:组装 prompt、调 LLM、执行 Tool、回喂结果、继续推理。引擎自己不干活 —— 它调度三个能力:

- **Provider** 负责 LLM 调用,接入各家模型厂商。
- **Memory** 负责会话与长期记忆,读写本地文件。
- **Tool** 负责 Tool 执行,通过 MCP Client 与外部 MCP server 对接。

在这些能力下方是存储层。Session 和审计数据落进 SQLite。Profile、Bootstrap 文件、Memory、Skill 数据这些用户可维护的内容,放在文件系统里。

> 有两点值得强调。
>
> 第一,所有能力汇聚成一台引擎、一套存储、一个进程 —— 与"单二进制,装上就跑"的定位吻合。外部依赖(LLM 厂商 API、外部 MCP server)在应用边界之外;OryxOS 自身不绑定其中任何一家。
>
> 第二,引擎与能力之间、能力与外部系统之间,所有耦合都走抽象接口。扩展阶段加新的 Channel、Provider 或 Tool,只需扩边;核心引擎不动。

### 四层结构

自顶向下:

- **接入层**(顶)—— CLI Channel、Web Service REST API。处理消息进出。
- **引擎层**(中)—— `ReActLoop`、`PromptBuilder`、`ToolExecutor`。Agent 的大脑。
- **能力层**—— Provider、Memory、Tool。为引擎提供 LLM 调用、上下文与执行能力。
- **基础层**(底)—— Profile / Bootstrap / Skill 加载、Session 存储、SQLite、配置与密钥加载。工程底座。

### 五大能力之间的关系

五大能力不是平行的功能模块。它们有特定的关系:

- **ReAct 循环**(能力 2)是引擎。它驱动从用户消息到 LLM 推理到 Tool 执行到结果回喂到继续推理的链路。
- **Provider**(能力 1)为 ReAct 循环提供 LLM 调用能力。每次推理都调它。
- **Memory**(能力 3)为 ReAct 循环提供上下文。每次组装 prompt 都会注入会话历史和长期记忆。
- **Tool**(能力 4)为 ReAct 循环提供执行能力。LLM 决定调用哪个 Tool,ReAct 循环去执行。
- **Web Service**(能力 5)是这些内部能力的对外出口。它把其他四个能力包装成 REST API 供业务系统集成。**它不参与 Agent 的内部循环**;它是循环的触发入口之一,也是结果出口之一(另一个是 CLI Channel)。

一句话总结:Provider、Memory、Tool 为 ReAct 循环引擎提供燃料;引擎的产出经 CLI 与 Web Service 暴露。

## 能力 1:LLM Provider 抽象

LLM 调用的复杂性已经被 Spring AI Alibaba 吸收掉了。OryxOS 在它之上包了一层,把 Spring AI 的 `ChatClient` 转成 OryxOS 内部的 `ProviderService` 抽象。

### 组件

- **`ProviderService` 模块**。统一管理所有 LLM Provider。对 ReAct 循环隐藏各家 LLM 厂商之间的差异。循环调用 LLM 时,把 Profile 和 Prompt 传进来,ProviderService 根据 Profile 配置挑选对应的底层 `ChatModel`。
- **Function Calling 适配模块**。把 OryxOS 内部的 `OryxTool` 抽象翻译成 Spring AI 的 tool calling 格式。Spring AI 已经处理了到各家厂商的协议转换(OpenAI tools、Anthropic tools、Gemini function declarations)。OryxOS 不需要知道各家细节。注意这里只用协议转换,不用自动执行(见决策 2)。
- **Provider 配置模块**。Provider 的 API key 和 base URL 通过 `application.yaml` 配置。Spring AI Alibaba 根据配置创建对应的 `ChatModel` Bean。

### 显式的 provider name → ChatModel 映射

这一点值得明确说明。Spring AI Alibaba 在配置多个 Provider 时,Spring 容器里持有多个 `ChatModel` Bean。用"扫描容器里所有 `ChatModel`"来区分 `deepseek` 和 `kimi` **并不可靠**:Bean 类型一样,Bean 名字也不总是等于 provider 名。

OryxOS 维护一份**显式的 provider name → `ChatModel` 映射**,不做类型扫描。

具体来说,每个 Provider 在配置里声明一个唯一的 provider 名(`deepseek`、`qwen`、`kimi` 等)。ProviderService 在启动时按名字构建映射表,Profile 按名字引用 Provider。多 Provider 共存依然不模糊。具体实现(Spring Qualifier 还是内部维护一张配置表)在开发阶段定夺,但"**显式映射,不做类型扫描**"的原则必须遵守,否则多 Provider 场景就立不住。

### 关键设计要点

- 核心阶段不做 fallback、hedge racing。Provider 失败直接以错误形式抛给 Agent。Fallback 链、熔断、hedge racing 通过 Profile 的 fallback 字段在扩展阶段补齐。
- 核心阶段做基础成本透明。每次 LLM 调用记录 token 用量、Provider、模型,写到 `llm_calls` 表。完整的成本聚合和 Web Dashboard 在扩展阶段补齐。

## 能力 2:ReAct 循环

ReAct 循环是 OryxOS 最关键的代码。它接收一条用户消息,产出 Agent 的最终响应,中间可能多次调用 LLM 和 Tool。

### ReAct 循环算法

ReAct 是 Reason + Act 的简称。算法:

1. 接收用户消息,追加到 Session 的对话历史。
2. 组装 prompt(系统 prompt + Bootstrap + Skill + Memory + 对话历史 + 可用 Tool 列表)。
3. 调用 LLM Provider 获取响应。
4. 如果响应里没有 Tool 调用,返回最终响应。
5. 如果响应里有 Tool 调用,OryxOS 执行 Tool,把结果作为 tool message 追加到对话历史。
6. 回到第 2 步继续循环。
7. 当达到最大迭代次数(默认 10)时,循环终止。

### 组件

- **`ReActLoop` 模块**。Agent 的核心循环引擎。接收 Session 和用户消息,产出最终响应。内部维护当前迭代计数。调 ProviderService 调 LLM,调 ToolExecutor 调 Tool。把每一轮的响应和 Tool 结果追加到 Session 对话历史。核心循环逻辑刻意保持精简,几十行 Java,**不依赖 Spring AI 的 Agent 抽象**。实现者对 Agent 的工作机制保持完整理解。
- **`PromptBuilder` 模块**。组装每次 LLM 调用的 prompt。按顺序拼接四段:
  1. 系统 prompt(Profile 身份 prompt + Bootstrap 文件 + Skill 文件,全部由 ContextLoader 提供)。
  2. Memory 注入(对话历史 + 长期记忆,由 MemoryService 提供)。
  3. 对话历史(Session 消息,按 `maxHistoryTurns` 截断)。
  4. 当前 Profile 可用的 Tool 列表(以 Function Calling 格式)。
- **`ToolExecutor` 模块**。执行 LLM 返回的 Tool 调用请求。在 ToolRegistry 找到对应 Tool,做沙箱检查,执行 Tool,把结果包成 `ToolResult` 返回给 ReAct 循环,同时写入 `tool_invocations` 表。失败时返回带重试策略的错误信息。

### 关键设计要点

- **MAX_ITERATIONS 上限**。核心阶段默认 10,防止无限 Tool 调用循环。可在 Profile 中覆盖。
- **消息累积**。每一轮迭代都会把 LLM 响应和 Tool 结果追加到 Session 的消息列表。Session 的对话历史包含完整的 LLM 调用链和 Tool 调用链,**对外可查询、可审计**。
- **上下文长度管理**。核心阶段策略很简单:保留系统 prompt 和最近 N 轮;其余丢弃。N 按 Profile 配置,默认 20 轮。摘要式压缩在扩展阶段补齐。

核心阶段不实现并行 Tool 调用(同一响应的多个 Tool 调用按顺序执行)、Agent 间任务委托、流式响应。这些后续补齐。

## 能力 3:三层记忆

记忆是把 Agent OS 和普通聊天机器人区分开的核心能力。三层设计是完整范围;核心阶段交付会话与长期记忆,情节记忆留给扩展阶段。

> 一个相对原始设计的架构调整:Memory 被打造成一个跨三层的**统一门面**,只对 ReAct 循环暴露一个 `MemoryService` 接口。内部拆为会话记忆和长期记忆。这样既保持了对外描述的"三层记忆"与内部实现的一致,又让 ReAct 循环不用问两个地方。

### 组件

- **`MemoryService` 模块(统一门面)**。对 ReAct 循环暴露统一的记忆读写接口。内部把会话记忆委托给 SessionManager(由 SQLite Session 存储支撑),把长期记忆委托给 LongTermMemory(由 `MEMORY.md` 文件支撑)。ReAct 循环组装 prompt 时,只需调一次 MemoryService 就拿到完整上下文。这是对原始设计的关键调整;**避免 Memory 概念横跨两个模块却没统一入口**。
- **`LongTermMemory` 子模块**。长期记忆的核心读写,操作 `.oryxos/memory/MEMORY.md`,一个 Markdown 文件。暴露四个方法:`append`(追加内容,带日期头)、`load`(加载整份文件,超阈值时截断)、`recallByKeyword`(按关键词返回匹配行)、`truncateIfNeeded`(超过 4000 字符时保留最新内容)。接口为后续升级向量检索预留空间:`recallByKeyword` 可升级为 `recall`(带 mode 参数,支持关键词 + 语义),切换底层实现不影响上层。
- **`MemoryTools` 子模块**。把长期记忆作为两个内置 Tool(`save_memory`、`recall_memory`)暴露给 Agent,带 `@Tool` 注解,启动时自动注册进 ToolRegistry,与其它内置 Tool 平起平坐。
- **会话记忆**。由 SessionManager 实现(见[持久化](#持久化)),通过 SQLite 持久化,按"渠道 + 用户 + Profile"组合标识管理。MemoryService 将其作为三层中的一层以统一方式暴露。

### `MEMORY.md` 文件设计

文件位置:`.oryxos/memory/MEMORY.md`。内容就是一个简单的 Markdown 列表,每条记忆带日期头。格式不做硬性规定:Agent 想写什么就写什么,LLM 自己能理解。简单但有效。

### 记忆注入系统 prompt

每次 ReAct 循环组装 prompt 时,MemoryService 都把对话历史和整份 `MEMORY.md` 内容提供给 PromptBuilder。长期记忆每轮都重新读,不缓存 —— 这样当 Agent 调用 `save_memory` 时,下一轮立刻就能看到。小文件的读取性能可接受。扩展阶段会加上内存缓存 + 文件 watch 自动失效。

### `MEMORY.md` 与 `USER.md` 的区别

`USER.md`(Bootstrap 文件,由用户编写,**对 OryxOS 只读**)和 `MEMORY.md`(长期记忆,由 Agent 通过 `save_memory` 写入,**对 OryxOS 可读写**)承担的角色不同,容易混淆:

- `USER.md` 是 Bootstrap 文件,由用户手写,对 OryxOS 只读,是用户的"初始设置"。
- `MEMORY.md` 是长期记忆,由 Agent 通过 `save_memory` 写入,对 OryxOS 可读写,是 Agent 的"成长日志"。

两者都会进入系统 prompt,但来源和生命周期不同。

### 核心阶段不包括

自动抽取(由 LLM 决定何时调 `save_memory`;不从对话中自动抽取事实)、语义检索(回忆用关键词,不上向量库)、情节记忆(扩展阶段)、Memory Wiki(结构化 claim/evidence、矛盾检测)、压缩(过长时简单截断)。

## 能力 4:Tool 体系

Tool 是 Agent 可以调用的外部能力。OryxOS 的 Tool 分两类:OryxOS 提供的内置 Tool,以及业务团队扩展的 Plugin Tool。Plugin Tool 按复杂度递增分三档。

> 一条相对原始设计的调整:核心阶段把 Tool 相关的东西**合并到同一个 `oryxos-tool` 模块**(内置 Tool、MCP Client、ToolRegistry、Sanbox 全在里面)。不再拆成 `builtin` / `skill` / `mcp` 等多个模块。原因:它们共用同一个 `OryxTool` 抽象和 ToolRegistry,耦合度高;核心阶段不需要拆得很细。
>
> 同样,`SKILL.md` 严格意义上不是 Tool。它是注入到系统 prompt 的指令模板,所以 SkillLoader 放在上下文加载模块,而不是 Tool 体系,与 Bootstrap 文件同列。概念上更干净。

### `OryxTool` 抽象

OryxOS 内部统一的 Tool 抽象接口。内置 Tool、带 `@Tool` 注解的 Plugin Tool、MCP Tool 都被包装成 `OryxTool` 实例,登记进 ToolRegistry。ReAct 循环不关心一个 Tool 是哪儿来的。

`OryxTool` 接口规定四个核心方法:`getName`、`getDescription`、`getInputSchema`(JSON Schema)、`execute`(接受 JSON 输入,返回 `ToolResult`)。`ToolResult` 包含成功标志、结果内容、错误信息、可重试标志。

### 五个内置 Tool

核心阶段交付五个内置 Tool,分三组:

- **FileTools** —— `read_file`、`write_file`、`list_dir`。执行前先跑 SandboxChecker 做路径白名单检查。
- **ShellTools** —— `shell` Tool 执行 bash 命令。带超时和命令白名单。
- **HttpTools** —— `http_get`、`http_post`。带域名白名单。

加上 MemoryTools 的 `save_memory`、`recall_memory`(属于 Memory 模块,但作为内置 Tool 注册)。

这五个覆盖了最短路径:"Agent 读写文件、跑命令、调外部 API、做笔记"。

### Plugin Tool 第一档:零代码 `SKILL.md` + 复用 MCP

这是 OryxOS 推荐的集成方式。业务团队不写代码,只写一份描述要做什么的 Markdown。LLM 自己读懂任务,把 MCP 工具组合起来。

`SKILL.md` 是一个带 frontmatter(`name`、`description`、`trigger`、`required_tools`)的 Markdown 文件,正文是任务描述。Profile 通过 `skills` 字段引用它,通过 `mcp_servers` 字段引用所需的 MCP server。

OryxOS 把 `SKILL.md` 内容加载到系统 prompt。LLM 读完,理解任务,决定调哪些 MCP 工具,把活儿拼起来。OryxOS 不解析任务步骤,不跑工作流引擎;所有逻辑都委托给 LLM。

注意:`SKILL.md` 的加载归 ContextLoader,**不是 Tool 模块**。它本质上是一个 prompt 输入源,跟 Bootstrap 文件是一类东西。

### Plugin Tool 第二档:自写 MCP server

业务团队用任意语言写 MCP server,通过 MCP 协议暴露 Tool。OryxOS 以 MCP Client 身份连接。MCP server 配置位于 `.oryxos/mcp_servers.yaml`,声明 `name`、`transport`、`command`、`env`。

- **`McpClientService` 子模块**。MCP server 连接维护与 Tool 注册。OryxOS 在启动时连接所有配置的 MCP server,调用 `tools/list` 拉取 Tool 列表,把每个 MCP Tool 包成 `OryxTool` 登记进 ToolRegistry,处理 server 断连、超时与错误恢复。
- **`McpToolAdapter` 子模块**。把 MCP Tool 适配成 `OryxTool` 接口。Tool 调用通过 MCP 协议(JSON-RPC over stdio 或 SSE)转发给对应 MCP server 执行,结果包成 `ToolResult` 返回。

### Plugin Tool 第三档:写 Java Spring Bean

用 Spring AI 的 `@Tool` 注解标记 Java 方法,OryxOS 启动时自动扫描并注册。工程成本最大,但集成深度最深。适合需要直接调用企业内部 Java 服务、复用现有 Spring Bean、或与 Spring Security 集成的场景。写作风格与 OryxOS 的内置 Tool 完全一样 —— 直接的进程内 Java 方法调用,没有 MCP 协议、没有独立进程、没有序列化,性能最好。

### ToolRegistry

统一管理所有 Tool。启动时,扫描 Spring 容器里所有 `@Tool` 注解的方法(内置 Tool 和第三档 Plugin Tool),加上 MCP Client 注册的 Tool(第二档),全部包成 `OryxTool` 实例。Profile 启动 Agent 时,`tools` 字段从 Registry 里筛出该 Profile 可用的 Tool 子集。

### 沙箱检查

核心阶段沙箱用路径与模式白名单做基础检查,在 `application.yaml` 里配置(`file.allowed_paths`、`shell.allowed_commands`、`http.allowed_domains`)。

- **`SandboxChecker` 子模块**。Tool 执行前的白名单校验。三个核心方法:`checkFilePath`(规范化路径并与白名单比对)、`checkShellCommand`(提取命令的第一个 token 与白名单比对)、`checkHttpUrl`(解析 host 并匹配通配符)。

校验失败抛 `SandboxViolationException`,Tool 执行立即终止。扩展阶段用 subprocess + bwrap 或 Docker 做完整沙箱隔离。

> 白名单沙箱是核心阶段唯一的 Tool 治理机制。Profile 级别的 Tool Policy(哪个 Agent 能用哪些 Tool)在扩展阶段补齐。核心阶段的 Profile `tools` 字段已经能限制 Agent 可用的 Tool 子集,这是 Tool 治理的雏形。完整的 allow/deny 策略后续补齐。

## 能力 5:Web Service

Web Service 是 OryxOS 的完整对外门面;业务系统通过 REST API 集成 OryxOS。前四个能力是 OryxOS 的内部能力,Web Service 把它们暴露出来。没有它,OryxOS 就只是 CLI 工具,没法与现有企业业务系统集成。这也是把 OryxOS 区别于 OpenClaw、Hermes 这类个人定位项目的关键能力。

### 组件

- **`WebServer` 模块**。启动 Spring MVC 服务。由 `oryxos serve` 触发。默认端口 `8080`。启用 Java 21 虚拟线程。
- **六个 `ApiController`**。资源型控制器:`SessionApiController`(会话管理)、`AgentApiController`(无状态调用)、`ProfileApiController`(Profile 查询)、`MemoryApiController`(Memory 查询)、`ToolApiController`(Tool 信息)、`SystemApiController`(系统状态)。每个 Controller 只做参数校验、响应包装和错误处理;实际逻辑委托给核心层服务。
- **`GlobalExceptionHandler` 模块**。统一异常处理,把异常转成标准 JSON 错误响应(`errorCode`、`message`、`timestamp`)。
- **OpenAPI 文档模块**。通过 `springdoc-openapi` 自动生成 OpenAPI 3.0 文档,暴露在 `/swagger-ui`。

### 核心阶段十个端点

**会话管理(4)** —— `POST /api/v1/sessions`(创建)、`POST /api/v1/sessions/{id}/messages`(发送消息)、`GET /api/v1/sessions/{id}`(拉历史)、`DELETE /api/v1/sessions/{id}`(归档)。

**Agent 调用(1)** —— `POST /api/v1/agents/{name}/invoke`(无状态调用)。

**Profile/Memory/Tool 信息(3)** —— `GET /api/v1/profiles`、`GET /api/v1/memory`、`GET /api/v1/tools`。

**系统状态(2)** —— `GET /api/v1/health`、`GET /api/v1/info`。

### 扩展阶段补齐的端点

Profile show/reload/create/update/delete;Memory append/clear/search;Tool describe 与调用历史;LLM 调用历史和 token 统计;Webhook 触发;SSE 流式响应;Prometheus 指标;OpenAPI 规范。

### 关键设计要点

- **错误码约定** —— 标准 HTTP 状态码加上内部错误码(400 参数错误、404 资源缺失、500 内部错误、503 Provider 失败)。
- **CORS** —— 核心阶段为调试便利打开所有来源;扩展阶段加上白名单。
- **请求大小限制** —— 单条消息最大 32KB,Session 历史最多返回最近 100 条。
- **超时** —— Agent 调用 60 秒超时,超时返回 504。

### 核心阶段不包括

认证(假定内网,扩展阶段补 API Key + JWT)、SSE 流式响应、WebSocket、RBAC 权限、限流。这些后续补齐。

### 业务系统集成场景

- **同步调用**(最常见)—— 业务系统调 `invoke` 并等待返回。适合无状态短任务。
- **会话持续** —— 先创建 Session,再发多条消息,适合持续对话。
- **Webhook 触发** —— 告警系统、CI/CD、定时任务调用 Agent,打通"监控感知 → 分析 → 处置"链路。
- **跨语言集成** —— 任何能发 HTTP 请求的语言都能集成。核心阶段不交付 SDK;扩展阶段补齐。

## 支撑模块

五大核心能力之外,OryxOS 还有几个支撑模块,让整个系统跑起来。它们不是运行时内核的核心,但每一个都不可或缺。

### 工作区初始化

`InitCommand` 模块。`oryxos init` 命令实现。创建 `.oryxos/` 工作目录及其完整结构:`profiles/`(Profile YAML)、`memory/MEMORY.md`(长期记忆)、`skills/`(SKILL.md)、`mcp_servers.yaml`(MCP 配置)、`sessions/`(Session 数据)、`logs/`(日志)、`AGENTS.md`/`SOUL.md`/`USER.md`(Bootstrap)、`oryxos.db`(SQLite)。创建目录、写默认模板、生成默认 Profile。

### Profile 配置

- **`ProfileLoader` 模块**。从 `.oryxos/profiles/` 加载所有 YAML,解析后登记进 ProfileRegistry。启动校验:Provider 是否存在、Tool 是否已注册、Channel 是否支持、Bootstrap 文件是否存在。校验失败的 Profile 不阻塞启动,但会记录错误。
- **`ProfileRegistry` 模块**。内存中的 Profile 索引,按名字快速查找。Channel 收到消息时,据此拿到对应的 Profile。Profile YAML 包含 `name`、`description`、`identity`(agent_name、prompt)、`provider`(name、model、temperature)、`tools`、`skills`、`mcp_servers`、`channels`、`bootstrap`、`settings`(`max_iterations`、`max_history_turns`)。核心阶段支持多 Profile 共存,单实例多 Agent 并行运行。这是核心阶段"OS"的最小演示。

### 上下文加载(Bootstrap + Skill 统一)

相对原始设计的一条调整:Bootstrap 文件加载和 Skill 文件加载**合并到同一个 ContextLoader 模块**,因为它们本质上是一回事 —— 都是把 Markdown 上下文注入系统 prompt,只是来源不同。

`ContextLoader` 模块。基于 Profile 的 `bootstrap` 和 `skills` 字段,从 `.oryxos/` 读取 `AGENTS.md`、`SOUL.md`、`USER.md`(Bootstrap)以及引用的 `.oryxos/skills/` 下的 `SKILL.md` 文件(Skill),拼成系统 prompt 的上下文部分,提供给 PromptBuilder。每次组装 prompt 时重新加载,不缓存 —— 用户编辑立刻生效。`SKILL.md` 放在这里,不在 Tool 模块,因为它是 prompt 输入,不是可执行的 Tool。

### Channel 集成

Channel 是 Agent 的入站消息入口,负责处理"消息进来、响应出去"。HTTP 集成归 Web Service,不属于 Channel。

`CliChannel` 模块。`oryxos chat` 的实现。读 stdin,写 stdout,实现交互式对话。维护当前 Session。每次输入都调 AgentService.process。支持 `/quit` 退出。扩展阶段加 WeCom、Feishu、DingTalk、Slack 等 IM 渠道,每个都通过 Channel Adapter 插件机制扩展。所有 IM 渠道内部都调 Web Service 的 Agent API,因此 Agent 实现不会重复。

### 三种运行模式

`oryxos chat`(交互式对话)、`oryxos serve`(启动 Web Service)、`oryxos gateway`(挂载多渠道的守护进程模式)。三种模式共用同一份 Profile 配置和 Session 存储;差异只在接入层。

### 命令行工具

`OryxOsCli` 模块。Picocli 命令行入口。整个 OryxOS 的 `main` 函数。注册 12 个子命令:`init`、`status`、`chat`、`serve`、`gateway`、`profile list/create/show/delete`、`provider list`、`tool list`、`session list`。每个子命令是一个 `@Command` 类。不需要 Spring context 的命令(`init`、`profile list`)直接操作文件,启动快。需要 LLM 调用的命令(`chat`、`serve`、`gateway`)启动 Spring context。

### 配置与密钥加载

`ConfigLoader` 模块。统一加载 LLM API key、Provider 凭据、MCP server 凭据等敏感配置。核心阶段基础版本:敏感配置通过环境变量注入,或从专用本地配置文件加载;**不以明文硬编码进 Profile YAML**(在 Profile 里用 `${ENV_VAR}` 占位符,加载时从环境变量解析)。加载时做必填字段和结构的基础校验;缺字段或非法给出清晰错误。完整加密存储、密钥轮换、接入企业 KMS/Vault 在扩展阶段补齐。

## 持久化

### 为什么是 SQLite + `MEMORY.md`

核心阶段选择 SQLite 加 Spring Data JPA 做关系型持久化,`MEMORY.md` 文件加关键词检索做长期记忆。这与"行业内一些 Agent OS 项目用向量数据库做 Memory"的做法不同。理由如下。

核心阶段不用向量数据库。LanceDB 在向量加全文检索上很强,是 Memory 的天然升级路径,但它的 Java 本地嵌入式支持仍在开发中;目前的 Java SDK 只支持远程 Cloud 或 Enterprise,与 OryxOS 的单二进制部署定位冲突。其它向量数据库(Qdrant、Chroma、Milvus)都需要外部进程;pgvector 需要外部 PostgreSQL。JVector(纯 Java 嵌入式向量索引)是另一个选项,但成熟度需要验证。

> 核心阶段判断:用 SQLite + `MEMORY.md` 走通最短路径。让实现者先把 Agent OS 的核心机制摸透。向量检索优化在扩展阶段补齐。

**扩展阶段升级路径**:

- **方案 A** —— 等 LanceDB Java 本地嵌入式 GA,切换并保持单二进制。
- **方案 B** —— 引入 PostgreSQL pgvector,在企业部署中额外起一个 PG 服务。最成熟的社区方案。
- **方案 C** —— 用 JVector 纯 Java 嵌入式向量索引,双写以保持单二进制。

具体选择留到扩展阶段决定。核心阶段 LongTermMemory 接口预留了升级空间(`recallByKeyword` 可升级为带 mode 参数的 `recall`)。切换底层实现不影响上层 Tool。

### SQLite 关系数据

通过 Spring Data JPA 集成。`application.yaml` 配置数据源指向 `.oryxos/oryxos.db`。

> **工程风险提示**:SQLite 本身的 `ALTER TABLE` 能力有限。`hibernate.ddl-auto=update` 对 SQLite 上的表结构演进支持很弱。核心阶段首次建表可以用 `update`,**但后续表结构演进不应依赖 `update` 自动迁移**。需要手动维护建表脚本,或引入 Flyway / Liquibase。开发期间务必注意这一点,否则后续改表结构将举步维艰。

**三张核心表**:

- `sessions` —— Session 元数据加 JSON 序列化的对话历史。
- `tool_invocations` —— 记录每次 Tool 调用。
- `llm_calls` —— 记录每次 LLM 调用。

相对原始设计的一条调整:`tool_invocations` 和 `llm_calls` 在核心阶段就写(读 API 可以有也可以没有),因为"可审计性"是 OryxOS 的差异点之一,审计数据的地基应该从 day one 就铺好。只靠日志就只能事后反向解析来凑审计。查询 API 和审计报表在扩展阶段补齐,但**写入**发生在核心阶段。

**Session 实体字段**:`session_id`(主键,由 channel + user + Profile 派生)、`profile_name`、`channel`、`user_id`、`messages_json`、`status`(active / archived)、`created_at`、`last_active_at`、`archived_at`。

### 文件系统数据

`.oryxos/` 下的几类数据放在文件系统,而不是 SQLite:Profile YAML、Bootstrap 文件、Memory(`MEMORY.md`)、SKILL.md、MCP 配置、日志。文件系统的好处是用户可以直接编辑、用 git 跟踪、做备份。Profile 与 Bootstrap 是用户维护的数据,文件系统比数据库更友好。

## 项目结构:九个 Maven 模块

OryxOS 是一个 Maven 多模块项目,由 9 个模块组成:

| 模块 | 对应 | 职责 |
|---|---|---|
| `oryxos-core` | 核心引擎 | ReActLoop、PromptBuilder、ToolExecutor、ContextLoader、Session、Profile、OryxTool 抽象。所有模块都依赖它。 |
| `oryxos-provider` | 能力一 | ProviderService、Function Calling 适配、provider name 映射 |
| `oryxos-memory` | 能力三 | MemoryService(三层统一门面)、LongTermMemory、MemoryTools |
| `oryxos-tool` | 能力四 | 内置 Tool(文件 / Shell / HTTP)、MCP Client、ToolRegistry、SanboxChecker(三合一) |
| `oryxos-web` | 能力五 | WebServer、六个 ApiController、GlobalExceptionHandler、OpenAPI 文档 |
| `oryxos-channel-cli` | 支撑 | CLI Channel 实现 |
| `oryxos-storage` | 支撑 | SQLite 存储层,包括 sessions、tool_invocations、llm_calls 表 |
| `oryxos-cli` | 支撑 | Picocli 命令行入口(12 个子命令) |
| `oryxos-boot` | 支撑 | Spring Boot 启动模块,把全部依赖打成 fat JAR |

模块之间通过接口解耦。扩展阶段加新的 Channel 或 Tool 只需新增一个模块,`core` 不动。所有 Channel 模块内部都调 `oryxos-web` 的 Agent API。`mvn clean package` 打成 fat JAR;`java -jar` 启动。扩展阶段用 GraalVM Native Image 编译成本地二进制。

## 接下来读什么

- 想了解功能集合、里程碑计划和验收标准,见 **[需求分析](/zh/docs/demand)**。
- 想了解项目如何使用 AI 工具开发(Spec-Kit、五个 user story、增量开发的手动提示词模式),见 **[AI 开发指南](/zh/docs/ai-guide)**。