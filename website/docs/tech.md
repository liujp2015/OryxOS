---
title: Architecture
description: Technical architecture, 9 Maven modules, key design decisions
---

This page covers how OryxOS is built. It walks through the seven key technical decisions, the layered architecture, deep dives on each of the five capabilities, and the nine Maven modules.

The core development phase ships the runtime kernel. The architecture is intentionally laid out to leave room for the governance layer — multi-tenant isolation, SSO, full audit, Tool Policy — that lands later.

## Technology stack at a glance

OryxOS is a Spring Boot 3.x single-binary application running on JDK 21, with self-implemented ReAct loop, Spring AI Alibaba for LLM calls, SQLite for persistence, and Picocli for the CLI. One sentence summary:

**JDK 21 + Spring Boot 3.x + Spring AI Alibaba + self-implemented ReAct loop + SQLite + Picocli**.

## The seven key technical decisions

The five core capabilities generate seven key design decisions. They are non-negotiable: the core development must honor them.

| # | Decision | Choice | One-line rationale |
|---|---|---|---|
| 1 | ReAct loop | Self-implemented, not Spring AI Agent abstractions | Agent core stays fully under our control |
| 2 | Spring AI boundary | Protocol conversion and schema generation only; auto tool execution disabled | Otherwise tools get called twice |
| 3 | Execution model | Synchronous blocking with virtual threads | Straightforward code, real concurrency |
| 4 | Tool registration | `@Tool` annotation plus `OryxTool` abstraction layer | ReAct does not care where a Tool comes from |
| 5 | HTTP layer | Spring MVC with virtual threads | Thousands of concurrent connections per node |
| 6 | Sandbox | Path/Pattern whitelist, no SecurityManager | SecurityManager is gone in JDK 21 |
| 7 | Persistence | SQLite plus MEMORY.md, audit tables day one | The auditability foundation is laid from day one |

### Decision 1: Self-implement the ReAct loop

Spring AI handles LLM calls, Function Calling protocol conversion, and Provider abstraction. The ReAct loop is written from scratch. This keeps the Agent core fully under our control and preserves room for future loop customization.

### Decision 2: Spring AI used only for protocol conversion and schema generation

> **Decision 2 is the single most common place where bugs creep in, and is called out as its own decision.**

Spring AI has a complete auto-execution mechanism for tool calling. It can automatically execute a tool and feed the result back to the model. OryxOS does not use this auto-execution. It uses Spring AI for two things only:

- The Provider abstraction and protocol conversion to each LLM vendor.
- The `@Tool` annotation's JSON Schema generation.

Tool scheduling and execution are fully controlled by OryxOS's own `ReActLoop` and `ToolExecutor`. Spring AI in OryxOS is a protocol adapter and schema generator, not a loop engine. During development, Spring AI's auto tool execution must be disabled, otherwise tools will get called twice.

### Decision 3: Synchronous execution model

The core phase uses synchronous blocking execution, consistent with Spring MVC. A single message flows from inbound through ReAct loop, Tool calls, and Provider calls back to the final response, all synchronously. This pairs well with Java 21 virtual threads, so high concurrency is reached without reactive programming. Streaming output (SSE) and asynchronous Tool calls land in the extension phase.

### Decision 4: `@Tool` annotation plus `OryxTool` abstraction layer

Spring AI annotations scan Java methods and generate JSON Schemas. OryxOS adds a thin `OryxTool` abstraction on top, unifying the interface form for built-in Tools and MCP Tools, so the ReAct loop does not care where a Tool comes from. Exact annotation names follow the chosen Spring AI version; verify against the version in use before development.

### Decision 5: HTTP service layer with Spring MVC plus virtual threads

Synchronous, straightforward code combined with virtual thread concurrency lets a single node comfortably support thousands of concurrent connections. When the extension phase adds SSE streaming, Spring MVC's `SseEmitter` supports it natively.

### Decision 6: Path and Pattern whitelists for the sandbox

File operations are limited to the working directory; Shell commands use a whitelist; HTTP requests use a domain whitelist; validation runs at the application layer. Java SecurityManager is not used; it has been deprecated since JDK 17 and is unavailable in JDK 21, conflicting with the JDK 21+ requirement. The extension phase introduces subprocess + bwrap or Docker for full sandbox isolation.

### Decision 7: SQLite plus MEMORY.md, audit tables day one

Profile YAMLs live under `.oryxos/profiles/`. Sessions, Tool invocations, and LLM calls land in SQLite. The two audit-related tables, `tool_invocations` and `llm_calls`, are written in the core phase (read APIs may come later), so the data foundation for auditability is laid on day one. Avoiding the trap of having to reverse-parse logs later to build audit. Full vector retrieval ships in the extension phase.

## Layered architecture

OryxOS's overall architecture is organized around the five core capabilities plus the supporting modules. The capabilities are the body of the Agent OS runtime kernel; the supporting modules are the engineering infrastructure that lets those capabilities run.

OryxOS is a Spring Boot single-binary application with two external entry points:

- **CLI Channel** for local interaction and debugging.
- **Web Service** for business system integration over REST APIs.

Both entry points route into a single engine.

The engine is the **ReAct loop**, the system's central nervous system. It drives the chain: assemble prompt, call LLM, execute Tool, feed results back, continue reasoning. The engine does not do the work itself — it schedules three capabilities:

- **Provider** handles LLM calls and integrates with each model vendor's API.
- **Memory** handles session and long-term memory, reads and writes local files.
- **Tool** handles Tool execution and integrates outward with external MCP servers through the MCP Client.

Underneath these capabilities sits the storage layer. Sessions and audit data land in SQLite. Profile, bootstrap files, Memory, and Skill data, all user-maintainable, live in the file system.

> Two points are worth highlighting.
>
> First, all capabilities converge into one engine, one storage, one process — matching the "single binary, installs and runs" positioning. External dependencies (LLM vendor APIs, external MCP servers) live outside the application boundary; OryxOS itself binds to none of them.
>
> Second, between engine and capabilities, and between capabilities and external systems, all coupling goes through abstract interfaces. Adding a new Channel, Provider, or Tool in the extension phase only requires extending the edges; the core engine stays put.

### The four layers

From top to bottom:

- **Access layer** (top) — CLI Channel, Web Service REST APIs. Handles message in/out.
- **Engine layer** (middle) — `ReActLoop`, `PromptBuilder`, `ToolExecutor`. The Agent's brain.
- **Capability layer** — Provider, Memory, Tool. Provides the engine with LLM calls, context, and execution.
- **Foundation layer** (bottom) — Profile/Bootstrap/Skill loading, Session storage, SQLite, configuration and secret loading. The engineering bedrock.

### How the five capabilities relate to each other

The five capabilities are not parallel feature modules. They have specific relationships:

- **ReAct loop** (Capability 2) is the engine. It runs the chain from user message to LLM reasoning to Tool execution to result feedback to continuation.
- **Provider** (Capability 1) gives the ReAct loop LLM call capability. Every reasoning turn calls it.
- **Memory** (Capability 3) gives the ReAct loop context. Every prompt assembly injects session history and long-term memory.
- **Tool** (Capability 4) gives the ReAct loop execution capability. When the LLM decides which Tool to call, the ReAct loop executes it.
- **Web Service** (Capability 5) is the external exit point for these internal capabilities. It wraps the other four capabilities into REST APIs for business system integration. It does not participate in the Agent's internal loop; it is one of the loop's trigger entries and result exits (the other is the CLI Channel).

Condensed into one sentence: Provider, Memory, and Tool feed the ReAct loop engine; the engine's output is exposed through CLI and Web Service.

## Capability 1: LLM Provider abstraction

The complexity of LLM calls has been absorbed by Spring AI Alibaba. OryxOS puts a thin wrapper on top, transforming Spring AI's `ChatClient` into OryxOS's internal `ProviderService` abstraction.

### Components

- **`ProviderService` module**. Unified management of all LLM Providers. Hides differences between LLM vendors from the ReAct loop. When the loop calls an LLM, it passes the Profile and Prompt; ProviderService selects the right underlying `ChatModel` based on Profile config.
- **Function Calling adapter module**. Translates OryxOS's internal `OryxTool` abstraction into Spring AI's tool calling format. Spring AI already handles protocol conversion to each LLM vendor (OpenAI tools, Anthropic tools, Gemini function declarations). OryxOS does not need to know each vendor's specifics. Note that only protocol conversion is used here, not auto execution (see Decision 2).
- **Provider config module**. Provider API keys and base URLs are configured through `application.yaml`. Spring AI Alibaba creates the corresponding `ChatModel` Bean based on configuration.

### Explicit provider name to ChatModel mapping

This is a key point worth making explicit. When Spring AI Alibaba configures multiple Providers, the Spring container holds multiple `ChatModel` Beans. Scanning "all `ChatModel` in the container" is not a robust way to tell `deepseek` apart from `kimi`: the Bean types are the same and Bean names don't always match provider names.

OryxOS maintains an explicit provider name → `ChatModel` mapping, not type scanning.

Specifically, every Provider declares a unique provider name (`deepseek`, `qwen`, `kimi`, etc.) in its config. ProviderService builds the mapping table by name at startup, and Profiles reference Providers by name. Multi-Provider coexistence stays unambiguous. The exact implementation (Spring Qualifier versus an internally maintained config table) is decided during development, but the "explicit mapping, not type scanning" principle must hold, otherwise multi-Provider setups will not work.

### Key design points

- No fallback or hedge racing in the core phase. Provider failures surface as errors to the Agent. Fallback chains, circuit breakers, and hedge racing land in the extension phase via the Profile's fallback field.
- Basic cost transparency in the core phase. Each LLM call records token usage, Provider, and model, written to the `llm_calls` table. Full cost aggregation and web dashboards land in the extension phase.

## Capability 2: ReAct loop

The ReAct loop is OryxOS's most critical code. It takes one user message in and produces the Agent's final response out, possibly calling LLMs and Tools multiple times in between.

### The ReAct loop algorithm

ReAct stands for Reason + Act. The algorithm:

1. Receive the user message and append it to the Session's conversation history.
2. Assemble the prompt (system prompt + Bootstrap + Skill + Memory + conversation history + available Tool list).
3. Call the LLM Provider for a response.
4. If the response contains no Tool calls, return the final response.
5. If the response contains Tool calls, OryxOS executes the Tool and appends the result as a tool message to the conversation history.
6. Return to step 2 and continue the loop.
7. The loop terminates when the maximum iteration count (default 10) is reached.

### Components

- **`ReActLoop` module**. The Agent's core loop engine. Takes a Session and user message in, produces the final response out. Maintains the current iteration count internally. Calls ProviderService for LLMs, calls ToolExecutor for Tools. Appends each turn's response and tool results to the Session conversation history. The core loop logic is intentionally minimal, dozens of lines of Java, with no dependency on Spring AI's Agent abstractions. The implementer keeps full understanding of the Agent's working mechanism.
- **`PromptBuilder` module**. Assembles each LLM call's prompt. Joins four sections in order:
  1. System prompt (Profile identity prompt + Bootstrap files + Skill files, all provided by ContextLoader).
  2. Memory injection (conversation history + long-term memory, provided by MemoryService).
  3. Conversation history (Session messages truncated by `maxHistoryTurns`).
  4. The current Profile's available Tool list (in Function Calling format).
- **`ToolExecutor` module**. Executes Tool call requests returned by the LLM. Locates the corresponding Tool in ToolRegistry, performs sandbox checks, executes the Tool, wraps the result in `ToolResult` and returns to the ReAct loop, while writing to the `tool_invocations` table. Failures return error information with a retry strategy.

### Key design points

- **MAX_ITERATIONS cap**. Default 10 in the core phase, preventing infinite Tool-call loops. Configurable per Profile.
- **Message accumulation**. Every iteration appends the LLM response and Tool results to the Session's messages list. The Session's conversation history contains the full LLM call chain and Tool call chain, externally queryable and auditable.
- **Context length management**. Core phase strategy is simple: keep the system prompt and the most recent N turns; discard the rest. N is configured per Profile, default 20 turns. Summary compression lands in the extension phase.

The core phase does not implement parallel Tool calls (multiple Tool calls in one response execute sequentially), inter-Agent task delegation, or streaming responses. These are added later.

## Capability 3: Three-layer memory

Memory is the core capability that distinguishes an Agent OS from a regular chatbot. The three-layer design is the complete scope; the core phase ships session and long-term memory, leaving episodic memory for the extension phase.

> An architectural adjustment from the original design: Memory is built as a unified facade across the three layers, exposing only a single `MemoryService` interface to the ReAct loop. Internally it splits into session memory and long-term memory. This keeps the externally described "three-layer memory" consistent with the internal implementation, and the ReAct loop doesn't have to ask two different places.

### Components

- **`MemoryService` module (unified facade)**. Exposes a unified memory read/write interface to the ReAct loop. Internally, it delegates session memory to SessionManager (backed by SQLite Session storage), and delegates long-term memory to LongTermMemory (backed by the `MEMORY.md` file). When the ReAct loop assembles a prompt, it calls MemoryService once and gets the complete context. This is the key adjustment from the original design; it avoids the Memory concept spanning two modules without a unified entry point.
- **`LongTermMemory` submodule**. Long-term memory core read/write, operating on `.oryxos/memory/MEMORY.md`, a single Markdown file. Exposes four methods: `append` (appends content with date header), `load` (loads the entire file, truncates if over threshold), `recallByKeyword` (returns matching lines by keyword), `truncateIfNeeded` (keeps the most recent content if over 4000 characters). The interface reserves upgrade space for vector retrieval: `recallByKeyword` can be upgraded to `recall` (with a mode parameter supporting keyword + semantic), and switching the underlying implementation does not affect upper layers.
- **`MemoryTools` submodule**. Exposes long-term memory to the Agent as two built-in Tools (`save_memory`, `recall_memory`), marked with `@Tool` annotations, automatically registered into ToolRegistry, on equal footing with other built-in Tools.
- **Session memory**. Implemented by SessionManager (see [Persistence](#persistence)), persisted via SQLite, managed under a combined channel + user + Profile identifier. MemoryService exposes it as one of the three layers in a unified way.

### MEMORY.md file design

File location: `.oryxos/memory/MEMORY.md`. Content is a simple Markdown list. Each memory entry has a date header. The format is not rigidly specified; the Agent writes what it likes, the LLM understands on its own. Simple but effective.

### Memory injection into the system prompt

Every time the ReAct loop assembles a prompt, MemoryService provides the conversation history and the full `MEMORY.md` content to PromptBuilder. Long-term memory is re-read each turn, no cache, so when the Agent calls `save_memory`, the next turn sees the result immediately. Each read of a small file is acceptable performance. The extension phase adds in-memory caching plus file watch auto-invalidation.

### MEMORY.md versus USER.md

`USER.md` (a Bootstrap file written by user, read-only to OryxOS) and `MEMORY.md` (long-term memory written by the Agent through `save_memory`, read-write to OryxOS) serve different roles that are easy to confuse:

- `USER.md` is a Bootstrap file, hand-written by the user, read-only to OryxOS, the user's "initial setup".
- `MEMORY.md` is long-term memory, written by the Agent through `save_memory`, read-write to OryxOS, the Agent's "growth log".

Both enter the system prompt, but they have different origins and lifecycles.

### What the core phase does not include

Auto extraction (the LLM decides when to call `save_memory`; facts are not auto-extracted from dialog), semantic retrieval (recall uses keywords, no vector library), episodic memory (extension phase), Memory Wiki (structured claim/evidence, contradiction detection), compression (simple truncation when too long).

## Capability 4: Tool system

Tools are external capabilities that Agents can call. OryxOS Tools split into two categories: built-in Tools provided by OryxOS, and Plugin Tools extended by business teams. Plugin Tools have three modes, in order of increasing complexity.

> An adjustment from the original design: the core phase merges Tool-related modules into a single `oryxos-tool` module (built-in Tools, MCP Client, ToolRegistry, and Sandbox all live inside). They are not split into `builtin`/`skill`/`mcp` modules. The reason: they share the same `OryxTool` abstraction and ToolRegistry, with high coupling; the core phase has no need to split finely.
>
> Also, `SKILL.md` is strictly speaking not a Tool. It is an instruction template injected into the system prompt, so SkillLoader lives in the context loading module, not the Tool system, alongside Bootstrap files. The concepts are cleaner this way.

### OryxTool abstraction

OryxOS's internal unified Tool abstraction interface. Built-in Tools, `@Tool`-annotated Plugin Tools, and MCP Tools are all wrapped as `OryxTool` instances and registered into ToolRegistry. The ReAct loop does not care about a Tool's origin.

The `OryxTool` interface specifies four core methods: `getName`, `getDescription`, `getInputSchema` (JSON Schema), `execute` (takes JSON input, returns `ToolResult`). `ToolResult` contains success flag, result content, error info, and retryability flag.

### Five built-in Tools

The core phase ships five built-in Tools, grouped into three sets:

- **FileTools** — `read_file`, `write_file`, `list_dir`. Run SandboxChecker for path whitelist checks before execution.
- **ShellTools** — `shell` Tool executes bash commands. Includes timeout and command whitelist.
- **HttpTools** — `http_get`, `http_post`. Includes domain whitelist.

Plus the two MemoryTools `save_memory`, `recall_memory` (belong to the Memory module but register as built-in Tools).

These five cover the shortest path: "Agent reads and writes files, runs commands, calls external APIs, takes notes".

### Plugin Tool Mode 1: Zero-code SKILL.md plus reuse MCP

This is OryxOS's recommended integration mode. Business teams write no code, only write a Markdown description of what to do. The LLM understands the task on its own and composes the MCP tools.

`SKILL.md` is a Markdown file with frontmatter (`name`, `description`, `trigger`, `required_tools`) plus task description body. The Profile references it via the `skills` field and references required MCP servers via the `mcp_servers` field.

OryxOS loads the `SKILL.md` content into the system prompt. The LLM reads it, understands the task, decides which MCP tools to call, and composes the work. OryxOS does not parse task steps, does not run a workflow engine; all logic is delegated to the LLM.

Note that loading `SKILL.md` is the responsibility of ContextLoader, not the Tool module. It is fundamentally a prompt input source, in the same category as Bootstrap files.

### Plugin Tool Mode 2: Write your own MCP server

Business teams write MCP servers in any language, exposing Tools through the MCP protocol. OryxOS connects as an MCP Client. MCP server config lives in `.oryxos/mcp_servers.yaml`, declaring `name`, `transport`, `command`, `env`.

- **`McpClientService` submodule**. MCP server connection maintenance and Tool registration. OryxOS connects to all configured MCP servers on startup, calls `tools/list` to fetch the Tool list, wraps each MCP Tool as an `OryxTool` and registers it into ToolRegistry, handles server disconnections, timeouts, and error recovery.
- **`McpToolAdapter` submodule**. Adapts MCP Tools into the `OryxTool` interface. Tool calls are forwarded to the corresponding MCP server for execution through the MCP protocol (JSON-RPC over stdio or SSE), and results are wrapped into `ToolResult` for return.

### Plugin Tool Mode 3: Write Java Spring Beans

Use Spring AI's `@Tool` annotation to mark Java methods; OryxOS auto-scans and registers them on startup. The largest engineering cost but the best integration depth. Suitable for scenarios that need to call enterprise internal Java services directly, reuse existing Spring Beans, or integrate with Spring Security for permission control. The writing style is identical to OryxOS's built-in Tools — direct in-process Java method calls, no MCP protocol, no separate process, no serialization, and the best performance.

### ToolRegistry

Unified management of all Tools. On startup, scans all `@Tool`-annotated methods in the Spring container (built-in Tools and Mode 3 Plugin Tools), plus tools registered by the MCP Client (Mode 2). All are wrapped as `OryxTool` instances. When a Profile starts an Agent, the `tools` field filters out the subset of Tools available to that Profile from the Registry.

### Sandbox checks

The core phase Sandbox uses Path and Pattern whitelists for basic checks, configured in `application.yaml` (`file.allowed_paths`, `shell.allowed_commands`, `http.allowed_domains`).

- **`SandboxChecker` submodule**. Whitelist validation before Tool execution. Three core methods: `checkFilePath` (normalizes the path and compares to the whitelist), `checkShellCommand` (extracts the first token of the command and compares to the whitelist), `checkHttpUrl` (parses the host and matches wildcards).

Any validation failure throws `SandboxViolationException`; Tool execution terminates. The extension phase uses subprocess + bwrap or Docker for full sandbox isolation.

> Sandbox with whitelisting is the only Tool governance mechanism in the core phase. Profile-level Tool Policy (which Agent can use which Tools) lands in the extension phase. The core phase's Profile `tools` field can already limit the subset of Tools available to an Agent, which is the embryonic form of Tool governance. Full allow/deny policies land later.

## Capability 5: Web Service

The Web Service is OryxOS's complete external facade; business systems integrate OryxOS through REST APIs. The first four capabilities are OryxOS's internal capabilities; the Web Service exposes them. Without it, OryxOS is just a CLI tool, unable to integrate with existing enterprise business systems. It is also the capability that distinguishes OryxOS from personal-positioning projects like OpenClaw and Hermes.

### Components

- **`WebServer` module**. Starts the Spring MVC server. Triggered by `oryxos serve`. Default port `8080`. Java 21 virtual threads enabled.
- **Six `ApiController`s**. Resource-based controllers: `SessionApiController` (session management), `AgentApiController` (stateless invocation), `ProfileApiController` (Profile queries), `MemoryApiController` (Memory queries), `ToolApiController` (Tool information), `SystemApiController` (system status). Each Controller only does parameter validation, response wrapping, and error handling; actual logic is delegated to core-layer services.
- **`GlobalExceptionHandler` module**. Unified exception handling, converting exceptions into standard JSON error responses (`errorCode`, `message`, `timestamp`).
- **OpenAPI documentation module**. Auto-generates OpenAPI 3.0 documentation via `springdoc-openapi`, exposed at `/swagger-ui`.

### Ten core-phase endpoints

**Session management (4)** — `POST /api/v1/sessions` (create), `POST /api/v1/sessions/{id}/messages` (send message), `GET /api/v1/sessions/{id}` (fetch history), `DELETE /api/v1/sessions/{id}` (archive).

**Agent invocation (1)** — `POST /api/v1/agents/{name}/invoke` (stateless invocation).

**Profile/Memory/Tool information (3)** — `GET /api/v1/profiles`, `GET /api/v1/memory`, `GET /api/v1/tools`.

**System status (2)** — `GET /api/v1/health`, `GET /api/v1/info`.

### Endpoints added in the extension phase

Profile show/reload/create/update/delete; Memory append/clear/search; Tool describe and invocation history; LLM call history and token statistics; Webhook triggers; SSE streaming responses; Prometheus metrics; OpenAPI spec.

### Key design points

- **Error code conventions** — standard HTTP status codes plus internal error codes (400 for parameter errors, 404 for missing resources, 500 for internal errors, 503 for Provider failures).
- **CORS** — core phase opens all origins for debugging convenience; the extension phase adds whitelisting.
- **Request size limits** — single message max 32KB, Session history returns at most the most recent 100 entries.
- **Timeouts** — Agent invocation has a 60-second timeout, returning 504 on exceedance.

### What the core phase does not include

Authentication (assumes internal network, extension adds API Key + JWT), SSE streaming responses, WebSocket, RBAC permissions, rate limiting. These land later.

### Business system integration scenarios

- **Synchronous call** (most common) — business systems call `invoke` and wait for return. Suitable for stateless short tasks.
- **Session persistence** — create a Session first, then send multiple messages, suitable for continuous dialog.
- **Webhook triggers** — alert systems, CI/CD, scheduled tasks call Agent, closing the loop from monitoring perception to analysis to action.
- **Cross-language integration** — any language that can send HTTP requests can integrate. The core phase does not ship an SDK; that comes in the extension phase.

## Supporting modules

Outside the five core capabilities, OryxOS has several supporting modules that let the whole system run. They are not the core of the runtime kernel, but each is necessary.

### Workspace initialization

`InitCommand` module. `oryxos init` command implementation. Creates the `.oryxos/` working directory and its full structure: `profiles/` (Profile YAML), `memory/MEMORY.md` (long-term memory), `skills/` (SKILL.md), `mcp_servers.yaml` (MCP config), `sessions/` (Session data), `logs/` (logs), `AGENTS.md`/`SOUL.md`/`USER.md` (Bootstrap), `oryxos.db` (SQLite). Creates directories, writes default templates, generates the default Profile.

### Profile configuration

- **`ProfileLoader` module**. Loads all YAMLs from `.oryxos/profiles/`, parses them, and registers them into ProfileRegistry. Startup validation: does the Provider exist, are Tools registered, is the Channel supported, do Bootstrap files exist. Failed-validation Profiles do not block startup but log errors.
- **`ProfileRegistry` module**. In-memory Profile index, fast lookup by name. When a Channel receives a message, it retrieves the specific Profile through this. The Profile YAML contains `name`, `description`, `identity` (agent_name, prompt), `provider` (name, model, temperature), `tools`, `skills`, `mcp_servers`, `channels`, `bootstrap`, `settings` (`max_iterations`, `max_history_turns`). The core phase supports multiple Profiles coexisting, with multiple Agents running side by side on one instance. This is the minimum demonstration of "OS" in the core phase.

### Context loading (Bootstrap plus Skill unified)

An adjustment from the original design: Bootstrap file loading and Skill file loading are merged into one ContextLoader module, because they are fundamentally the same — both inject Markdown context into the system prompt, just from different sources.

`ContextLoader` module. Based on the Profile's `bootstrap` field and `skills` field, reads `AGENTS.md`, `SOUL.md`, `USER.md` (Bootstrap) and referenced `SKILL.md` files under `.oryxos/skills/` (Skill) from `.oryxos/`, concatenates them into the system prompt's context portion, and provides them to PromptBuilder. Reloaded every time the prompt is assembled, not cached, so user edits take effect immediately. `SKILL.md` lives here, not in the Tool module, because it is prompt input, not an executable Tool.

### Channel integration

Channels are the Agent's inbound message entry points, handling "messages in, responses out". HTTP integration belongs to Web Service, not to Channels.

`CliChannel` module. Implementation of `oryxos chat`. Reads stdin, writes stdout to implement interactive dialog. Maintains the current Session. Each input calls AgentService.process. Supports `/quit` to exit. The extension phase adds WeCom, Feishu, DingTalk, Slack, etc. IM channels, each extended through a Channel Adapter plugin mechanism. All IM channels internally call Web Service's Agent API, so Agent implementation is not duplicated.

### Three run modes

`oryxos chat` (interactive dialog), `oryxos serve` (start Web Service), `oryxos gateway` (daemon mode attaching multiple channels). All three modes share the same Profile config and Session storage; they differ only at the access layer.

### Command-line tools

`OryxOsCli` module. Picocli command-line entry point. The whole OryxOS `main` function. Registers 12 subcommands: `init`, `status`, `chat`, `serve`, `gateway`, `profile list/create/show/delete`, `provider list`, `tool list`, `session list`. Each subcommand is one `@Command` class. Commands that don't need Spring context (`init`, `profile list`) operate files directly and start fast. Commands that need LLM calls (`chat`, `serve`, `gateway`) start the Spring context.

### Configuration and secret loading

`ConfigLoader` module. Unified loading of LLM API keys, Provider credentials, MCP server credentials, and other sensitive configurations. Core phase basic version: sensitive configurations are injected through environment variables or loaded from a dedicated local config file; they are not hardcoded in plaintext into Profile YAML (use `${ENV_VAR}` placeholders in Profile, resolved from environment variables on load). Loading does basic validation of required fields and shapes; missing or invalid gives clear errors. Full encryption storage, secret rotation, integration with enterprise KMS/Vault land in the extension phase.

## Persistence

### Why SQLite plus MEMORY.md

The core phase selects SQLite plus Spring Data JPA for relational persistence, and MEMORY.md file plus keyword retrieval for long-term memory. This differs from "some Agent OS projects in the industry use vector databases for Memory". Here is the trade-off.

The core phase does not use a vector database. LanceDB is strong on vector plus full-text retrieval, the natural upgrade path for Memory, but its Java local embedded support is still in development; the current Java SDK only supports remote Cloud or Enterprise, which conflicts with OryxOS's single-binary deployment positioning. Other vector databases (Qdrant, Chroma, Milvus) all require external processes; pgvector requires an external PostgreSQL. JVector (pure Java embedded vector index) is another option but maturity is to be verified.

> The core phase judgment: use SQLite plus `MEMORY.md` to ship the shortest path first. Let implementers master the Agent OS core mechanism. Vector retrieval optimization lands in the extension phase.

**Extension phase upgrade paths**:

- **Option A** — wait for LanceDB Java local embedded GA, switch and keep single-binary.
- **Option B** — adopt PostgreSQL pgvector, stand up an additional PG service for enterprise deployment. The most mature community option.
- **Option C** — use JVector pure Java embedded vector index with SQLite dual-write, keep single-binary.

The specific choice is decided in the extension phase. The core phase LongTermMemory interface has reserved upgrade space (`recallByKeyword` can be upgraded to `recall` with a mode parameter). Switching the underlying implementation does not affect upper-layer Tools.

### SQLite relational data

Integrated through Spring Data JPA. `application.yaml` configures the data source pointing to `.oryxos/oryxos.db`.

> **Engineering risk note**: SQLite itself has limited `ALTER TABLE` capability. `hibernate.ddl-auto=update` has weak support for table schema evolution on SQLite. The core phase can use `update` for first-time table creation, but subsequent schema evolution should not rely on `update` auto-migration. Manually maintain creation scripts or introduce Flyway/Liquibase. Note this during development; otherwise schema changes will be unchangeable later.

**Three core tables**:

- `sessions` — Session metadata plus JSON-serialized conversation history.
- `tool_invocations` — record each Tool invocation.
- `llm_calls` — record each LLM call.

An adjustment from the original design: `tool_invocations` and `llm_calls` are written in the core phase (read APIs may or may not exist), because "auditability" is one of OryxOS's differentiators, and the audit data foundation should be laid on day one. Relying purely on logs forces reverse-parsing later to build audit. Query APIs and audit reports land in the extension phase, but writes happen in the core phase.

**Session entity fields**: `session_id` (primary key, generated from channel + user + Profile), `profile_name`, `channel`, `user_id`, `messages_json`, `status` (active/archived), `created_at`, `last_active_at`, `archived_at`.

### File system data

Several data categories under `.oryxos/` live on the file system rather than SQLite: Profile YAML, Bootstrap files, Memory (MEMORY.md), SKILL.md, MCP config, logs. The file system has the advantage that users can edit directly, track with git, and back up. Profile and Bootstrap are user-maintained data; the file system is friendlier than a database.

## Project structure: nine Maven modules

OryxOS is a Maven multi-module project. It consists of 9 modules:

| Module | Maps to | Responsibility |
|---|---|---|
| `oryxos-core` | Core engine | ReActLoop, PromptBuilder, ToolExecutor, ContextLoader, Session, Profile, OryxTool abstractions. All modules depend on it. |
| `oryxos-provider` | Capability 1 | ProviderService, Function Calling adapter, provider name mapping |
| `oryxos-memory` | Capability 3 | MemoryService (three-layer unified facade), LongTermMemory, MemoryTools |
| `oryxos-tool` | Capability 4 | Built-in Tools (File/Shell/Http), MCP Client, ToolRegistry, SandboxChecker (three-in-one) |
| `oryxos-web` | Capability 5 | WebServer, six ApiControllers, GlobalExceptionHandler, OpenAPI documentation |
| `oryxos-channel-cli` | Supporting | CLI Channel implementation |
| `oryxos-storage` | Supporting | SQLite storage layer, including sessions, tool_invocations, llm_calls tables |
| `oryxos-cli` | Supporting | Picocli command-line entry point (12 subcommands) |
| `oryxos-boot` | Supporting | Spring Boot startup module, packaging all dependencies into a fat JAR |

Modules are decoupled through interfaces. Adding a new Channel or Tool in the extension phase only adds a new module, no change to `core`. All Channel modules internally call `oryxos-web`'s Agent API. Build with `mvn clean package` to produce the fat JAR; start with `java -jar`. The extension phase uses GraalVM Native Image to compile down to a native binary.

## What comes next

- For the feature set, milestone plan, and acceptance criteria, see **[Requirements](/docs/demand)**.
- For how the project is built using AI tooling (Spec-Kit, five user stories, manual prompt mode for incremental work), see **[AI Dev Guide](/docs/ai-guide)**.