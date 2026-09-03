---
title: Requirements
description: Feature requirements, core capabilities, milestones
---

This page covers the feature requirements for OryxOS. It covers what OryxOS does, the five core capabilities, the core feature set, the milestone plan, and the acceptance demos that gate the core release.

The core development phase ships the runtime kernel of the Agent OS. The governance layer (multi-tenant isolation, SSO, full audit, Tool Policy) that turns OryxOS into a fully regulated enterprise Agent OS is built incrementally after the core ships.

## What OryxOS does

OryxOS is installed on the enterprise's own Kubernetes or server. It acts as a unified substrate on which various business Agents run — operations assistants, customer service assistants, HR assistants, sales assistants, knowledge management assistants — all sharing one channel layer, one model router, one tool execution layer, one memory system, and one sandbox. Data stays inside the enterprise's own infrastructure. No cloud lock-in.

The product is positioned in the Java ecosystem because Spring AI Alibaba has already solved LLM call infrastructure. What was missing was the Agent OS layer above it. OryxOS fills that layer.

## The five core capabilities

OryxOS prioritizes five core capabilities in the core development phase. These capabilities cover what is needed for a single Agent to run well inside the runtime kernel. The governance layer that makes OryxOS a true enterprise Agent OS is added in subsequent phases.

### Capability 1: LLM Provider abstraction

OryxOS connects to mainstream LLMs (DeepSeek, Qwen, Kimi, Zhipu, Hunyuan, Doubao, Anthropic, OpenAI, and others) through a Provider abstraction layer. Agents do not know which specific model they are calling. Switching at runtime is non-binding.

What this enables:

- Natural-language conversation Assistants for any business scenario.
- One Agent using different models for different tasks: cheap models for simple tasks, strong models for complex ones.
- Integration with enterprise-owned local inference (Ollama, vLLM), keeping data inside the enterprise.
- Multi-provider orchestration: use a cheap model for planning, a strong model for synthesis.

### Capability 2: ReAct loop

**ReAct** (Reason + Act) is the Agent's core operating mechanism. When an Agent receives a task, the LLM thinks about whether to call a tool and which one. The Agent executes the tool, sees the result, and decides the next step until a final response is produced.

What this enables:

- Agents autonomously decide when to call which tool. No hard-coded business logic.
- Multi-step tasks complete within a single conversation (read a file, analyze it, call an API, generate a report).
- Agents recover from errors: roll back, retry, switch tools.
- Complex business processes do not need pre-orchestrated flows. Agents dynamically choose execution paths at runtime.

### Capability 3: Three-layer memory

Agents remember user preferences, projects, decisions, and conversation history. The three-layer design is fully scoped, but the core phase ships only two layers (session memory and long-term memory). Episodic memory is added in the extension phase.

- **Session memory** — full history of the current conversation, automatically compressed when long.
- **Long-term memory** — user preferences, project background, key facts, stored in a `MEMORY.md` file, persisting across conversations.
- **Episodic memory** — what each task learned: which files were modified, which decisions were made, which results were produced. Added in the extension phase.

What this enables:

- Agents remember user preferences across conversations ("I generally use Spring Boot, not Spring MVC"; "my project is deployed on Kubernetes").
- Long-running tasks maintain state across interruptions and resume after a conversation break.
- Multiple Agents in a team share a user's preferences.
- Historical decisions are traceable ("why did we pick DeepSeek over Kimi last time" is searchable in memory).

### Capability 4: Plugin tools plus built-in tool set

Agents can call Tools to actually do things. OryxOS provides two kinds of Tools:

- **Built-in Tools** that OryxOS ships with — file operations, Shell execution, HTTP requests.
- **Plugin Tools** that business teams extend, with three modes by increasing complexity.

The three Plugin Tool modes:

- **Zero-code** — write a `SKILL.md` describing the intent and reuse community MCP servers (GitHub, Slack, Notion, and others). The LLM reads the description and figures out the rest.
- **Light-code** — write your own MCP server in any language (Python, Shell, Go, Java) and connect enterprise systems to it.
- **Full-code** — use the `@Tool` annotation to write Java Spring Beans for deep integration.

What this enables:

- Connect Agents to enterprise ERP, CRM, and CMDB.
- Connect to GitHub, Jira, and Confluence for engineering Assistants.
- Connect to Prometheus, Grafana, and SSH for operations self-healing.
- Connect to enterprise lookup, weather, and news APIs for information aggregation.
- Business teams ship new scenarios in markdown-only zero-code mode.

### Capability 5: Web Service

OryxOS exposes all capabilities through a complete REST API. Business systems integrate Agents through HTTP without caring about internal implementation. **Web Service is the external facade of OryxOS** and the only channel for enterprises to embed AI capabilities into existing business systems.

The API covers six categories: session management (create session, send message, fetch history, archive session), Agent invocation (stateless invocation, streaming response added in extension), Profile management (list, view, reload), Memory operations (fetch long-term memory, manual write, clear), Tool information (list available Tools, view metadata), and system status (health check, runtime metrics, Provider status).

What this enables:

- Business systems invoke Agents through REST APIs and embed AI capabilities into existing products.
- Cross-language integration: any language with HTTP can integrate.
- One OryxOS instance serves multiple business systems simultaneously.
- Monitoring alerts, Webhook triggers, and scheduled tasks invoke Agents through the Web Service.
- Third-party developers build higher-level AI products on top of the REST API.

## Channel note

Beyond the five core capabilities, one foundational module is **Channel** (inbound message channels). Channels handle "messages in, responses out". The core phase ships only the CLI channel. IM channels (WeCom, Feishu, DingTalk) ship in the extension phase. Channel is a core functional module but is not counted among the "five core capabilities" to keep the numbering clean.

## Combining the five capabilities

The five capabilities are five gears. Combined, they unlock real enterprise scenarios:

- **Omnichannel customer service** — LLM understands questions, ReAct loop queries the knowledge base, Memory retains customer history, Plugin Tools hook into CRM, Web Service exposes the customer service system over HTTP.
- **Operations Assistant** — LLM analyzes alerts, ReAct loop queries logs and restarts services, Memory retains historical incident knowledge, Plugin Tools hook into Prometheus and SSH, Web Service triggers from alert webhooks.
- **Engineering Assistant** — LLM understands requirements, ReAct loop reads and writes code, Memory retains project conventions, Plugin Tools hook into GitHub and CI, Web Service plugs into IDE plugins.
- **Knowledge management** — LLM understands questions, ReAct loop retrieves documents, Memory retains team agreements, Plugin Tools hook into Confluence, Web Service embeds into intranet portals.
- **Sales Assistant** — LLM assembles customer profiles, ReAct loop queries CRM and enterprise lookup, Memory retains customer preferences, Plugin Tools hook into sales systems, Web Service powers sales apps.
- **Data analysis** — LLM generates SQL, ReAct loop executes queries and generates charts, Memory retains business table schemas, Plugin Tools hook into BI systems, Web Service lets BI tools integrate natural-language queries.

These scenarios do not require OryxOS to build dedicated modules. Business teams configure Profiles, write Plugin Tools, and call Web Service APIs.

## Core feature set

The core feature set is the shortest path that must be completed in the 4-week (12-hour total) core phase. It corresponds to the runtime kernel of the Agent OS.

### Workspace initialization

OryxOS's working directory is `.oryxos/`. The `oryxos init` command initializes it, creating the workspace and its contents:

- Five subdirectories: `profiles/` for Profile configs (one YAML per Agent), `sessions/` for conversation history, `skills/` for `SKILL.md` files, `logs/` for structured logs, `tools/` for custom Tool configs.
- Three Bootstrap files (loaded into the system prompt when an Agent starts, so the Agent knows project context, its identity, and user preferences): `AGENTS.md` (project-level Agent behavior), `SOUL.md` (default Agent persona), `USER.md` (user preferences).
- A default Profile (`profiles/default.yaml`) so the user has something runnable: one default LLM Provider, a few basic Tools, CLI channel.

### Profile configuration

A **Profile** is the complete configuration of an Agent, expressed as a YAML file. One Profile corresponds to one Agent. This is OryxOS's central configuration abstraction.

The Profile YAML contains five sections:

- `identity` — Agent name, description, persona prompt. May reference `SOUL.md`.
- `provider` — bound LLM Provider, provider name plus model plus parameters. Optional fallback config.
- `tools` — list of Tools, each by name, with optional parameters.
- `channels` — bound Channels, channel name plus config.
- `bootstrap` — Bootstrap files to load into the system prompt.

Profile commands: `oryxos profile create <name>`, `oryxos profile list`, `oryxos profile show <name>`, `oryxos profile delete <name>`. Edits to the YAML do not require restarting OryxOS; they take effect on next Agent start.

The core phase supports multiple Profiles coexisting in one instance. Multiple Agents running side by side is the minimum demonstration of the "OS" concept in the core phase.

### Provider abstraction (Capability 1)

The Provider is the unified abstraction for LLM calls. All LLM calls go through the Provider interface, and Agents do not know which specific model is being called.

The core phase implements directly on top of Spring AI Alibaba's `ChatClient`. Spring AI Alibaba already ships connectors for DeepSeek, Qwen, Wenxin, Kimi, Zhipu, Hunyuan, Doubao, Anthropic, OpenAI, and others. OryxOS wraps these into its Provider abstraction without reinventing them.

Each Provider instance configures a provider name (deepseek, qwen, kimi, etc.), a model name, an API key, and an optional base URL. Profiles reference Providers by name.

The core phase does not implement fallback or hedge racing. Provider failures surface as errors to the Agent. Fallback chains, circuit breakers, and hedge racing are added later.

### ReAct loop (Capability 2)

The ReAct loop is OryxOS's most critical code. The algorithm is Reason + Act: the LLM thinks (Reason) about whether to call a tool, which tool, and with what parameters; OryxOS executes (Act) the tool and feeds the result back to the LLM; the LLM sees the result and decides the next step. The loop continues until the LLM gives a final response or the iteration cap is reached.

Execution steps:

1. Receive the user message and append it to the Session's conversation history.
2. Assemble the prompt (system prompt + Bootstrap + conversation history + available Tool list).
3. Call the LLM Provider for a response.
4. If the response contains no Tool calls, return the final response.
5. If the response contains Tool calls, OryxOS executes the Tool and adds the result as a tool message to the conversation history.
6. Go back to step 2 and continue the loop.
7. The loop terminates when the maximum iteration count (default 10) is reached.

Core phase implementation notes:

- ReAct logic is intentionally minimal: the core loop is dozens of lines of Java. Self-implemented, not relying on Spring AI's Agent abstractions.
- Maximum iteration count can be overridden per Profile. Each LLM call and Tool call is logged in structured form for troubleshooting.
- Tool call failures retry per a retry policy. Retry count limits are returned inside the Tool Result.

The core phase does not implement parallel Tool calls (multiple Tool calls in one response execute sequentially), dynamic context compression, or inter-Agent task delegation. These are added later.

### Memory (Capability 3)

Agents retain state across conversations. The three-layer design is the complete scope; the core phase ships a minimal two-layer implementation (session and long-term), leaving episodic memory for the extension phase.

**Session memory** (via Session management): full conversation history of the current dialog. Truncated simply when context exceeds the LLM's context window.

**Long-term memory** (minimal core implementation): one `MEMORY.md` file in `.oryxos/memory/`, persisting across all conversations. Agents actively read and write this file through two built-in Tools — `save_memory(content)` appends content to `MEMORY.md`; `recall_memory(query)` retrieves matching content by keyword. When an Agent starts, the entire `MEMORY.md` is injected into the system prompt as long-term context. Files exceeding a default size limit (4000 characters) are simply truncated; compression is added in the extension phase.

The core phase does not include automatic fact extraction (let the LLM decide when to call `save_memory`), semantic retrieval (`recall_memory` uses keyword matching, not vectorization), episodic memory (Task-process file changes, decisions, results go to the extension phase), Memory Wiki with claim/evidence structure, contradiction detection, or freshness management.

> The user-facing experience: after using OryxOS for a while, the Agent naturally remembers user preferences, project context, and key decisions. The user does not re-explain these in the next conversation. This is what distinguishes an Agent OS from a chatbot.

### Tool system (Capability 4)

Tools are external capabilities Agents can call. Agents decide when to call which Tool through LLM Function Calling; OryxOS handles Tool registration, lookup, invocation, and result return. There are two categories, and this distinction is the core mechanism OryxOS uses to let business teams extend.

**Built-in Tools** (ship with OryxOS). The core phase provides five built-in Tools in three groups:

- **File operation Tools** — `read_file`, `write_file`, `list_dir`. Execute inside the sandbox with path whitelist restrictions.
- **Shell Tool** — executes bash commands. Includes timeout and command whitelist restrictions.
- **HTTP Tool** — sends HTTP requests (GET, POST). Includes domain whitelist restrictions.
- Plus two Memory-related built-in Tools: `save_memory` (appends content to `MEMORY.md`) and `recall_memory` (retrieves matching content by keyword).

**Plugin Tools** (extended by business teams). Business teams extend OryxOS's capabilities through three modes by increasing complexity. Mode one is the recommended default — it is the most elegant way to write for the LLM era: business teams only describe intent, and the LLM composes existing capabilities on its own.

- **Mode 1 (zero-code)** — write `SKILL.md` and reuse existing MCP servers. Business teams write a `.oryxos/skills/<name>.md` describing what to do, the Profile references this Skill and the required MCP servers (GitHub, Slack, Notion have many community MCP servers), and the LLM reads the Skill, decides which MCP tools to call, and composes the task.
- **Mode 2 (light-code)** — write your own MCP server. Business teams write MCP servers in any language (Python, Shell, Go, Java) exposing Tools through the standard MCP protocol, and OryxOS connects to them as an MCP Client.
- **Mode 3 (full-code)** — write Java Spring Beans. Use Spring AI's `@Tool` annotation to mark Java methods, and OryxOS auto-registers them on startup. Best for deep integration that calls enterprise Java services directly.

> The selection principle: prefer Mode 1 over Mode 2, prefer Mode 2 over Mode 3. Plugin Tools are how OryxOS lets business teams land real scenarios. OryxOS itself only ships basic built-in Tools; the operations Assistant, customer service Assistant, and sales Assistant all rely on business teams composing `SKILL.md` with MCP servers.

**MCP Client integration** in the core phase. OryxOS implements a minimal MCP Client that connects to external MCP servers and invokes their Tools. Configuration declares MCP server URLs or startup commands in `.oryxos/mcp_servers.yaml`. OryxOS connects on startup, registers the server's Tools into the Tool pool, and Profiles reference them by name.

**Sandbox** is the security isolation mechanism for Tool invocation. The core phase uses application-layer whitelist validation: file operations have path whitelists, Shell has command whitelists, HTTP has domain whitelists. Execution timeouts and resource limits are also enforced. The core phase does not use Java SecurityManager (deprecated since JDK 17, removed in JDK 21, incompatible with the project's JDK 21 requirement). Full sandbox isolation using bwrap, Docker, or K8s pods ships in the extension phase.

### Channel integration

Channels are the inbound message entry points. They handle "messages in, responses out". HTTP integration belongs to Web Service (Capability 5), not to Channels.

The core phase ships only one channel: **CLI Channel**, started via `oryxos chat`. This is the primary interaction mode for development and debugging. It supports multi-turn conversation, context viewing, and Tool call record inspection.

WeCom, Feishu, DingTalk, and Slack IM channels ship in the extension phase. Their implementation complexity (webhooks, cards, media, org structure) and the need for separate OAuth flows and enterprise qualifications keep them out of the 12-hour core phase. Extension-phase IM channels call into the Web Service internally, so Agent implementation is not duplicated.

### Web Service (Capability 5)

The Web Service is OryxOS's complete external facade. Business systems integrate OryxOS through REST APIs. This is the key capability that distinguishes OryxOS from personal Assistant projects like OpenClaw and Hermes.

The API covers six categories: session management (create session, send message, fetch history, archive session), Agent invocation (stateless invocation, streaming response added in extension), Profile management (list, view, reload), Memory operations (fetch long-term memory, manual write, clear), Tool information (list available Tools, view metadata), and system status (health check, runtime metrics, Provider status).

The core phase ships the 10 most critical endpoints. Twelve hours is tight, so the core covers the shortest path; the rest ships in the extension phase:

| Endpoint | Description | Category |
|---|---|---|
| `POST /api/v1/sessions` | Create a session | Session management |
| `POST /api/v1/sessions/{id}/messages` | Send a message | Session management |
| `GET /api/v1/sessions/{id}` | Fetch session history | Session management |
| `DELETE /api/v1/sessions/{id}` | Archive a session | Session management |
| `POST /api/v1/agents/{name}/invoke` | Stateless Agent invocation | Agent invocation |
| `GET /api/v1/profiles` | List Profiles | Information query |
| `GET /api/v1/memory` | Fetch long-term memory | Information query |
| `GET /api/v1/tools` | List available Tools | Information query |
| `GET /api/v1/health` | Health check | System status |
| `GET /api/v1/info` | System information | System status |

15 more endpoints added in the extension phase: Profile show/reload/create/update/delete; Memory append/clear/search; Tool describe and invocation history; LLM call history and token usage statistics; Webhook triggers; SSE streaming responses; Prometheus metrics; OpenAPI spec.

The core phase does not include authentication (assumes internal network, extension adds API Key + JWT), SSE streaming responses (core is synchronous blocking returns, extension adds SSE), WebSocket, or RBAC permissions.

### Session management

A Session is the context container for one conversation between a user and an Agent. It contains start and end times, user identity, Agent identifier, conversation history, current context, and transient variables. The Session identifier is generated from a combination of channel, user, and Agent.

The core phase persists Session data to local SQLite (under `.oryxos/sessions/`). Active sessions can be resumed after an OryxOS restart.

Cross-session long-term memory, context compression, and Memory Wiki ship in the extension phase. The core phase simply truncates early conversation turns when context exceeds the LLM's context window.

### Three run modes

OryxOS provides three run modes, all implemented in the core phase. These are the entry points for users interacting with OryxOS:

- `oryxos chat` — interactive multi-turn conversation. The user talks to the Agent in the terminal; the Agent calls LLMs and Tools and returns results in real time. Supports `--message "xxx"` for single-message send-and-exit.
- `oryxos serve` — HTTP API mode. OryxOS exposes RESTful interfaces on a specified port (default 8080). Business systems call OryxOS Agents over HTTP.
- `oryxos gateway` — long-running daemon mode. OryxOS serves multiple channels simultaneously (full multi-channel functionality lands in the extension phase; the core phase only attaches CLI and HTTP API).

All three modes share the same Profile configuration and Session storage.

### Command-line tools

OryxOS is operated through command-line tools. The core phase ships 12 commands. These are the complete entry points for user interaction:

- **Startup and status** — `oryxos init`, `oryxos status`, `oryxos chat`, `oryxos serve`, `oryxos gateway`.
- **Profile management** — `oryxos profile list`, `oryxos profile create <name>`, `oryxos profile show <name>`, `oryxos profile delete <name>`.
- **Query** — `oryxos provider list`, `oryxos tool list`, `oryxos session list`.

> The command-line tool is OryxOS's most direct interface with the user. The core phase must deliver a smooth command-line experience with clear error messages and help text.

### Configuration and secret loading

OryxOS loads sensitive configurations including LLM API keys, Provider credentials, and MCP server credentials.

The core phase ships a basic version: sensitive configurations are injected through environment variables or loaded from a dedicated local config file; they are not written in plaintext into Profile YAMLs. Loading validates required fields and shapes, with clear errors when missing or invalid. Full encryption storage, secret rotation, and integration with enterprise key management (KMS, Vault) ship in the extension phase.

## Milestone plan

The core feature implementation follows a 4-week rhythm (3 hours per week, 12 hours total). Each week centers on one or more core capabilities, and each week ends with a demonstrable result.

| Week | Core capabilities | Demo at week end |
|---|---|---|
| Week 1 | LLM Provider + ReAct loop (Capabilities 1 + 2) | Agent conducts multi-turn conversation and calls HTTP Tools |
| Week 2 | Memory + Tool system (Capabilities 3 + 4) | Agent remembers preferences, reads/writes files, calls external MCP tools |
| Week 3 | Web Service (Capability 5) | External systems call OryxOS through 10 REST endpoints |
| Week 4 | Multi-Agent demo + engineering polish | Multiple Agents coexist, full CLI, Session recovery across restarts, public homepage |

### Week 1: LLM Provider + ReAct loop (Capabilities 1 + 2)

Scope:

- `oryxos init` workspace initialization, Profile YAML parsing.
- Provider abstraction on top of Spring AI Alibaba (start with DeepSeek or Kimi running).
- ReAct loop (core loop dozens of lines of Java, including LLM calls, Tool call parsing, message accumulation).
- One basic built-in Tool (HTTP), CLI channel.
- Session management (in-memory version, SQLite persistence added in Week 4).

Demo: `oryxos chat` can conduct multi-turn conversation with an Agent; the Agent uses the ReAct loop to call an HTTP Tool for a simple task (for example, "check Beijing weather and tell me what to wear").

### Week 2: Memory + Tool system (Capabilities 3 + 4)

Scope:

- Long-term memory minimal version (`MEMORY.md` file, `save_memory` and `recall_memory` built-in Tools, full file injected into system prompt on startup).
- File operation Tools (`read_file`, `write_file`, `list_dir`), Shell Tool (with whitelist validation).
- MCP Client integration (connect external MCP servers).

Demo: Agent remembers user preferences ("I use Spring Boot") and applies them in later conversations; Agent reads and writes local files and calls external MCP server tools to complete a cross-tool task.

### Week 3: Web Service + API endpoints (Capability 5)

Scope:

- 10 core REST endpoints across Session management (4), Agent invocation (1), Profile/Memory/Tool listing (3), and health/info (2).
- `oryxos serve` starts Spring MVC service.
- Configuration and secret loading (environment variable injection plus basic validation).

Demo: External systems call OryxOS through the 10 REST endpoints (create session, send message, fetch Profile, fetch Memory, fetch Tools, fetch health). The API call chain is complete.

### Week 4: Multi-Agent demo + engineering polish

Scope:

- Multi-Agent demo (two Agents with different Profiles on one instance, validating the "OS" multi-Agent form).
- Complete 12-command CLI, Session persistence to SQLite (recovery across restarts).
- Bootstrap file mechanism (`AGENTS.md`, `SOUL.md`, `USER.md` loaded into system prompt).
- Structured logging, public homepage (VitePress or similar static site tool).

Demo: Multiple Agents coexist on one instance; the CLI experience is complete and smooth; Bootstrap files influence Agent behavior; Sessions recover across restarts; the public homepage is accessible.

After the core phase, OryxOS 1.0 is a demonstrable, minimal complete Agent OS runtime kernel. All five core capabilities are wired and working, with the ability to configure Agents, conduct CLI conversations, run multiple Agents side by side, accept REST API integrations, and integrate with the MCP tool ecosystem.

The community-handoff phase then takes over: extension features (multiple channels, Memory auto-extraction and semantic retrieval, episodic memory, Skill system, MCP server exposure, Tool Policy, full sandbox, the remaining 15 Web Service endpoints plus SSE streaming plus authentication, web dashboard, SSO and multi-tenant isolation, full audit, cluster high availability) and the governance layer that makes OryxOS a truly enterprise-grade Agent OS are progressively driven by community contributors.

## Acceptance criteria

Acceptance splits into four categories: functional, performance, operability, and scenario.

### Functional acceptance

All core features in the core feature set must be complete, with at least one end-to-end test case per feature module:

- `oryxos init` workspace initialization.
- Profile configuration and management (multi-Profile coexistence).
- Provider abstraction (DeepSeek and Kimi at minimum running).
- ReAct loop (multi-step Tool calls, correct message history accumulation, correct termination on max iterations).
- Long-term Memory (`save_memory` write, `recall_memory` keyword retrieval, injected into system prompt on startup).
- Built-in Tools (file, HTTP, Shell, `save_memory`, `recall_memory`).
- Plugin Tool integration (Mode 1 zero-code `SKILL.md` plus MCP running; Mode 3 `@Tool` annotation example running).
- MCP Client integration, CLI channel.
- All 10 core Web Service REST endpoints working.
- Session persistence (SQLite, recovery across restarts), 12 CLI commands, configuration and secret loading.

### Performance acceptance

Stress test verifies: 10 Agents running stably for 4 hours on a single node, 100 concurrent sessions on a single node, Session creation P99 latency under 200ms, internal forwarding overhead under 50ms. These are core-phase targets; missing the mark does not block release but should be addressed in the extension phase.

### Operability acceptance

Complete deployment documentation (a beginner completes single-node deployment within 30 minutes); CLI tools have clear help and error messages; the public homepage is accessible and clearly explains what OryxOS is and how to start.

### Scenario acceptance

Five demo Agents validate the five core capabilities. All five demos running is the hard requirement for the core release:

| Demo | Validates | Content |
|---|---|---|
| Demo 1 | LLM Provider + ReAct | "Check weather and write a daily report"; Agent calls a weather API, uses a file Tool to write the report locally |
| Demo 2 | Memory | First conversation expresses preferences (Spring Boot, Kubernetes); Agent calls `save_memory`; second conversation references stored preferences in answers |
| Demo 3 | Plugin Tool + MCP | Agent uses MCP Client to call external server tools to complete a cross-tool task |
| Demo 4 | Web Service synchronous call | External system creates Session, sends message, fetches response, archives; full chain works |
| Demo 5 | Web Service multi-endpoint | External system sequentially calls info, profiles, tools, invoke, memory to complete a business workflow |

## What comes next

- For how OryxOS is built — the seven key technical decisions, layered architecture, five-capability deep dive, and nine Maven modules — see **[Architecture](/docs/tech)**.
- For how the project is developed using AI tooling (Spec-Kit, five user stories, incremental development), see **[AI Dev Guide](/docs/ai-guide)**.