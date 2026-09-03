---
title: AI Dev Guide
description: Spec-Kit workflow, 5 user stories, incremental development
---

This page covers how OryxOS is built using AI tooling. OryxOS has a clear two-phase approach: the main development phase uses Spec-Kit to drive the five user stories, and the incremental phase switches to manual prompts with Claude Code for small changes. The seven constitution principles and the five user stories ordered by dependency are the two key inputs that keep the work on track.

## Two-phase approach

OryxOS's AI programming implementation splits into two phases with different collaboration tools.

**Main development phase** — building OryxOS 1.0's five core capabilities from scratch. The whole project has 9 Maven modules with clear module boundaries, and the requirement documents plus technical solution are complete. Use Spec-Kit to run the full spec-driven flow: constitution → specify → plan → tasks → implement. This keeps the output aligned with the requirements and avoids vibe-coding drift.

**Incremental development phase** — extension features, bug fixes, additional Plugin Tools. These are small-grained increments, typically 1 to 3 file changes. Switch to manual prompts with Claude Code, because running the full Spec-Kit flow for a small increment is too heavy.

> The boundary between the two phases is sharp: Spec-Kit fits large-grained greenfield; manual prompts fit small-grained increments. OryxOS's main development is the former; the community handoff is the latter. Tool choice matches the nature of the work.

## Why this fits OryxOS

OryxOS is a textbook fit for Spec-Kit:

- **Greenfield** — OryxOS is a brand-new project built from zero, not a rewrite of existing code. Spec-Kit's sweet spot.
- **Medium scale** — 9 Maven modules and 5 well-defined core capabilities is classic medium size.
- **Clear requirements** — complete requirement documents and technical solution exist, with user-story-level descriptions for each of the five core capabilities.
- **AI agent collaboration** — OryxOS is being built with Claude Code as the main developer agent.
- **Methodology value** — Spec-Kit's enforced flow keeps outputs aligned with requirements, and is valuable for the team learning engineering methodology.

The community has reservations about Spec-Kit on brownfield projects. None of those concerns apply to OryxOS, which is pure greenfield.

Spec-Kit has four known limitations worth knowing in advance:

1. **Process overhead is too heavy for small increments.** The full flow is too expensive for small changes. OryxOS addresses this by switching to manual prompts in the incremental phase.
2. **Spec does not auto-sync with implementation.** If the AI agent drifts from spec during `implement`, the spec file does not update. OryxOS addresses this by running `/speckit.analyze` after each user story to catch cross-artifact drift.
3. **Context limit failures on large brownfield.** Hundred-thousand-file legacy projects exceed LLM context. Not an issue for greenfield OryxOS, where the entire codebase fits within the context window.
4. **Spec-Kit itself is iterating quickly.** Command names, artifact formats, and integration methods all change. The principles and rhythm described in this page do not lock to specific versions.

## The seven constitution principles

The constitution is the project's non-negotiable principles. Every subsequent spec, plan, task, and implementation step must honor them. They are derived from the requirement document's design goals and the technical solution's key technical decisions.

| # | Principle |
|---|---|
| 1 | JDK 21 + Spring Boot 3.x single-binary application, Maven multi-module (9 modules). |
| 2 | Five core capabilities (LLM, ReAct, Memory, Tool, Web Service) prioritized; supporting modules are secondary. The core phase delivers the runtime kernel; the enterprise governance layer lands in the extension phase. |
| 3 | Self-implement the ReAct loop. Do not use Spring AI's Agent abstractions. |
| 4 | Spring AI used only halfway. Use only its Provider abstraction, protocol conversion, and `@Tool` schema generation. Disable its auto tool execution. Tool scheduling is fully controlled by `ReActLoop` and `ToolExecutor`. |
| 5 | Plugin Tool three-mode integration, with `SKILL.md` plus MCP zero-code as the recommended default. |
| 6 | SQLite plus `MEMORY.md` in the core phase. Vector retrieval lands in the extension phase. Audit tables (`tool_invocations` and `llm_calls`) are written to storage from day one. |
| 7 | Each user story completes with a demonstrable demo. "Working" outranks "perfect". |

> Principles 4 (Spring AI only halfway) and 6 (audit tables day one) are the two most likely to be skipped by AI agents and the two most critical to enforce. They are written into the constitution so the AI agent sees them every time.

The constitution is written once and locked in for the entire main development period. If a principle turns out to be wrong, the team stops and discusses. AI agents are not permitted to modify the constitution on their own.

## Preparation phase: Spec-Kit artifacts

Before implementation starts, the project team prepares three Spec-Kit artifacts so each user story has clear grounding.

### Spec-Kit installation and Claude Code configuration

The Specify CLI is the entry point for Spec-Kit (Python implementation, requires Python 3.11+, uv recommended for installation). After installation, run `specify init` to initialize the OryxOS Spec-Kit workspace, which contains the `.specify/memory/constitution.md` directory structure plus spec, plan, and tasks artifact directories.

Claude Code is the recommended primary AI agent. Spec-Kit officially supports Claude Code. The exact integration method (early slash commands, currently Claude Code skills mode, specified via parameters during init) follows the official documentation. This page does not lock specific installation steps, since they change with versions.

### Writing the constitution

The constitution is the project's non-negotiable principles. It captures the seven principles listed above. AI agents actively reference it during every specify/plan/implement cycle, which keeps development aligned with OryxOS's direction.

The constitution is written once and held stable through the main development period.

### Writing the specification: five user stories by dependency

`/speckit.specify` takes the requirement document as input and produces five user story specifications, one per core capability.

The five user stories are ordered by dependency, not by importance. This is a key point: US-5 (Web Service) is implemented last because it depends on the first four being ready, not because it is unimportant. Web Service is in fact the key capability that distinguishes OryxOS from personal Assistant projects. This page does not use P1/P2/P3 priority labels, because that gets misread as "later ones can be skipped". The dependency order is the rule: US-1 → US-2 (foundation), US-3 + US-4 (parallel), US-5 (capstone).

Each user story's acceptance criteria map directly to the five acceptance demos:

- US-1 + US-2 → Demo 1 (check weather, recommend clothing).
- US-3 → Demo 2 (remember preferences across conversations).
- US-4 → Demo 3 (zero-code PR digest).
- US-5 → Demo 4 + Demo 5 (Web Service synchronous call + multi-endpoint flow).

After `/speckit.specify` produces `spec.md`, running `/speckit.clarify` lets the AI agent ask a few clarifying questions (such as default max iterations, conversation history truncation policy). This step is optional but recommended.

### Writing the plan

`/speckit.plan` takes the technical solution plus the previously generated `spec.md` and `constitution.md` as input and produces an implementation plan. The plan includes technology stack selection (JDK 21 + Spring Boot 3.x + Spring AI Alibaba + SQLite + Picocli), the responsibilities of the 9 Maven modules (matching the technical solution's Module Structure section), expansion of key technical decisions (self-implemented ReAct, Spring AI only halfway boundaries, three-mode Plugin Tool, SQLite plus MEMORY.md, audit tables day one), data flow and inter-module collaboration (`PromptBuilder` + `ProviderService` + `ToolExecutor` + `MemoryService` three-layer facade).

> Manual review of the generated plan is a necessary step. The AI agent may have made choices it should not have, based on its own reading of the technical solution. Check points: did it simplify Memory by merging with Session (should be the `MemoryService` three-layer unified facade)? did it split Tool into multiple modules (should be the merged `oryxos-tool`)? did it treat `SkillLoader` as a Tool (should be `ContextLoader` in core)? did it enable Spring AI's auto tool execution (must be disabled)? Once review passes, `plan.md` is locked.

### Preparation phase deliverables

At the end of the preparation phase, the OryxOS repository should contain `.specify/memory/constitution.md` (principles set), `spec.md` (5 user stories), `plan.md` (technology stack + 9 modules + technical decisions), the original requirement documents and technical solution documents (kept in the repo as source reference), and Claude Code plus Specify CLI configuration notes. With preparation complete, the five user stories are ready to drive in dependency order.

## The five user stories by dependency order

> The five user stories are split by user story, not by time. The dependency order is the implementation order. US-3 and US-4 run in parallel after US-2 finishes.

| User Story | Core capability | Depends on | Maps to demo |
|---|---|---|---|
| US-1 | LLM Provider | None (base) | (with US-2) Demo 1 |
| US-2 | ReAct loop | US-1 | Demo 1 (check weather, recommend clothing) |
| US-3 | Three-layer Memory | US-2 | Demo 2 (remember preferences across conversations) |
| US-4 | Plugin Tool system | US-2 (parallel with US-3) | Demo 3 (zero-code PR digest) |
| US-5 | Web Service | First four | Demo 4 + Demo 5 (synchronous call, multi-endpoint flow) |

The dependencies, expanded:

- US-1 is the foundation. Without LLM calls, no Agent capability runs.
- US-2 depends on US-1. The ReAct loop calls the LLM every iteration.
- US-3 + US-4 parallel-depend on US-2. Memory injects into ReAct's prompt; Tools are called by ReAct.
- US-5 depends on the first four. It exposes everything externally.

The push order is US-1 → US-2 → (US-3 + US-4 in parallel) → US-5. Specific time investment is decided by the project team.

The user story split happens to match Spec-Kit's natural organization. Spec-Kit's `/speckit.tasks` command organizes tasks by user story; each user story becomes an independent implementation phase, tasks are dependency-ordered with parallel ones flagged. Splitting OryxOS by the five core capabilities fits Spec-Kit's working style.

### US-1: LLM Provider (Capability 1)

**Goal** — enable OryxOS to call any mainstream LLM. Agents do not know which specific model is being called. The complexity of LLM calls is absorbed by Spring AI Alibaba; OryxOS only puts a thin wrapper on top.

**Involved Maven modules** — `oryxos-core` (`OryxTool` interface, `Session`, `Profile`, `ContextLoader` core abstractions), `oryxos-provider` (Capability 1), `oryxos-boot` (Spring Boot startup module).

**Expected task categories** — environment setup (Maven multi-module skeleton with 9 modules, Spring Boot startup config, Spring AI Alibaba dependency); core abstractions (`OryxTool` interface, `Profile` data structure, `Message` data structure); Provider implementation (`ProviderService` implementation, explicit provider name → `ChatModel` mapping, Function Calling adapter); configuration (`application.yaml` configured with at least one Provider running, DeepSeek or Kimi, with `ConfigLoader` loading API keys from environment variables).

> A key point to flag in task notes: `ProviderService` cannot distinguish Providers by "scanning all `ChatModel` in the container". When multiple Providers coexist, the Bean types are identical, creating ambiguity. Maintain an explicit provider name → `ChatModel` mapping. AI agents tend to write type scanning; the task needs to call this out.

US-1 has no demo of its own, because there is no user-visible entry point yet. The next US-2 combines with US-1 to run Demo 1.

### US-2: ReAct loop (Capability 2)

**Goal** — implement the Agent's core working mechanism. The LLM thinks about whether to call a tool, calls it, sees the result, and decides the next step until a final response is produced. The ReAct loop is OryxOS's most critical code.

**Involved Maven modules** — `oryxos-core` (`ReActLoop`, `PromptBuilder`, `ToolExecutor`, `ContextLoader`), `oryxos-tool` (one HTTP Tool plus a simplified `SandboxChecker`, needed for Demo 1), `oryxos-channel-cli` (CLI channel, needed for Demo 1), `oryxos-cli` (`oryxos init` and `oryxos chat` commands).

Note that Tool-related modules are unified into `oryxos-tool`. The original multi-tool-module structure is gone.

**Expected task categories** — ReAct loop class (`ReActLoop` main loop, `PromptBuilder`, `ToolExecutor`, `MAX_ITERATIONS` control); CLI channel class (`CliChannel`, `oryxos chat` command, `oryxos init` workspace initialization); basic Tool class (HTTP Tool, simplified `SandboxChecker` validating only URL whitelist); Profile YAML parsing class (SnakeYAML, Profile validation); Session class (Session data structure, in-memory SessionManager, persistence in US-5).

**Key task granularity** — US-2 is the focus of Spec-Kit splitting. Several complex tasks need finer-grained splits:

- `ReActLoop` main loop (core loop logic is minimal, dozens of lines of Java, but engineering parts such as error handling, logging, message accumulation, iteration control suggest 2 to 3 sub-tasks).
- `PromptBuilder` assembly (four sections: system prompt + Bootstrap + Memory + conversation history + Tool list, suggest splitting into sub-tasks added progressively).

> Re-emphasize the key boundary (constitution principle 4): when calling Spring AI, use only its protocol conversion and schema generation. Disable its auto tool execution. Tool scheduling is controlled by `ToolExecutor`. AI agents implementing `ReActLoop` tend to enable Spring AI's auto execution, causing tools to be called twice. The task must explicitly disable this.

After US-1 + US-2 complete, run `/speckit.analyze` to check spec/code consistency.

**Demo 1 acceptance: check weather, recommend clothing.** `oryxos chat` starts CLI. The user inputs "check Beijing weather and tell me what to wear". The Agent uses the ReAct loop to call the HTTP Tool to fetch weather JSON, recommends clothing based on data, and the full conversation log correctly accumulates into the Session. At least one Provider (DeepSeek or Kimi) runs.

### US-3: Three-layer memory (Capability 3)

**Goal** — enable Agents to retain state across conversations. The core phase ships a minimal two-layer implementation (session and long-term) using one `MEMORY.md` file plus two built-in Tools, letting Agents actively write and read.

**Involved Maven module** — `oryxos-memory` (Capability 3, including `MemoryService` three-layer facade, `LongTermMemory`, `MemoryTools`).

**Expected task categories** — `MemoryService` facade class (three-layer unified facade, exposes only one interface to the ReAct loop, internally delegates session memory to `SessionManager` and long-term memory to `LongTermMemory`); `LongTermMemory` class (four methods: `append`, `load`, `recallByKeyword`, `truncateIfNeeded`, interface reserves upgrade space for vector retrieval via `recall` with mode parameter); `MemoryTools` class (`save_memory` and `recall_memory` built-in Tools, marked with `@Tool`); `PromptBuilder` integration class (Memory injection in `PromptBuilder`, ensuring the working ReAct loop from US-2 is not broken); `MEMORY.md` file management class (file location, format convention, over-length truncation policy).

US-3's task granularity is small; overall engineering cost is moderate. `MemoryService` facade and `LongTermMemory` methods are each small, the two Tools are each slightly larger, and `PromptBuilder` integration is a change-type task that needs care not to break existing logic. After US-3, run `/speckit.analyze`.

**Demo 2 acceptance: remember preferences across conversations.** First conversation: tell the Agent "my project uses Spring Boot, deployed on Kubernetes". The Agent proactively calls `save_memory` to append to `MEMORY.md`. Restart OryxOS or open a new session. Second conversation: ask "help me see what databases my project can use". The Agent references previously stored preferences in its response.

### US-4: Plugin Tool system (Capability 4)

**Goal** — let business teams extend OryxOS's capabilities. Plugin Tools have three modes: zero-code `SKILL.md` plus MCP (recommended), light-code own MCP server, full-code Java `@Tool` annotation.

The core phase completes the three-mode infrastructure plus built-in Tool completion.

**Involved Maven modules** — `oryxos-tool` (complete file Tools + Shell Tool, MCP Client, full `SandboxChecker`, `ToolRegistry`, three-in-one module), `oryxos-core` (`SKILL.md` loading via `ContextLoader`, not in the Tool module).

**Expected task categories** — built-in Tool completion class (file Tools `read_file`, `write_file`, `list_dir`; Shell Tool with whitelist; full `SandboxChecker` implementation); MCP Client class (`mcp_servers.yaml` parsing, `McpClientService` startup connection, `tools/list` fetch, `McpToolAdapter` wrapping into `OryxTool`); `SKILL.md` class (`ContextLoader` loads referenced `SKILL.md` files under `.oryxos/skills/` and concatenates them into system prompt, belongs to core not tool); Profile upgrade class (Profile adds `skills` field and `mcp_servers` field).

**Key task granularity** — US-4 has many tasks. Several complex tasks need focused splitting:

- MCP Client integration (the MCP protocol is JSON-RPC over stdio or SSE. Java ecosystem maturity lags behind Python. Suggest implementing stdio transport (the most common) first, with SSE in the extension phase. The stdio MCP Client is suggested split into sub-tasks: connection management; `tools/list`; `tool/call`; error recovery).
- Full `SandboxChecker` (extends from the simplified URL-only version in US-2 to a complete one: file path whitelist + Shell command whitelist + HTTP domain whitelist. Suggest 3 sub-tasks).

After US-4, run `/speckit.analyze`.

**Demo 3 acceptance: zero-code PR digest.** Business team writes `.oryxos/skills/daily-pr-digest.md` describing the task. Configure `mcp_servers.yaml` with `github-mcp` (using a community MCP server). Configure a Profile referencing this Skill plus the MCP server. After the Agent starts, it reads the `SKILL.md` description, calls `github-mcp` to fetch PRs, summarizes into a digest. The whole flow involves business-team zero-code work — just a markdown file plus config.

### US-5: Web Service (Capability 5)

**Goal** — expose all of OryxOS's capabilities through REST APIs. Business systems integrate over HTTP. This is the key capability distinguishing OryxOS from personal Assistant projects.

**Involved Maven modules** — `oryxos-web` (Capability 5), `oryxos-storage` (SQLite persistence layer; Session persistence upgrades from in-memory version; `tool_invocations` and `llm_calls` audit tables written), `oryxos-cli` (complete 12 Picocli commands), `oryxos-core` (`ConfigLoader`, `ContextLoader` Bootstrap loading completion).

**Expected task categories** — Web Service base class (`WebServer` startup with virtual thread config, `GlobalExceptionHandler`, OpenAPI documentation); six `ApiController` classes (Session, Agent, Profile, Memory, Tool, System, each Controller has its own endpoint group, can be implemented in parallel); 10 core REST endpoints class (4 session management, 1 Agent invocation, 3 Profile/Memory/Tool listing, 2 `health`/`info`); persistence upgrade class (Session upgrades from in-memory to SQLite, `SessionRepository`, recovery across restarts, plus `tool_invocations` and `llm_calls` audit table writes); configuration and context class (`ConfigLoader` config secret loading, `ContextLoader` Bootstrap file loading complete and integrated with `PromptBuilder`); CLI complete version (all 12 Picocli commands implemented); engineering class (Logback + SLF4J structured logging + error handling).

> Note that audit table writes happen in US-5 (constitution principle 6): `tool_invocations` and `llm_calls` are written to storage in the core phase, not just logged. This way, the audit-data foundation stands on day one. AI agents tend to skip this (thinking logs are enough); the task must be explicit.

**Key task granularity** — US-5 has the largest engineering cost. The six `ApiController`s can be implemented in parallel (no inter-dependency); each Controller has 1 to 2 endpoints. Session SQLite upgrade is mainly `SessionRepository` plus `messages_json` serialization, with care needed for Session state migration. Bootstrap loading (`ContextLoader`) integrated with `PromptBuilder` must ensure the previously working ReAct loop is not broken. After US-5, run `/speckit.analyze` one final time, and the entire main development completes.

**Demo 4 acceptance: Web Service synchronous call.** External system `POST /api/v1/sessions` to create a Session, `POST /api/v1/sessions/{id}/messages` to send a message, `GET` to fetch history, `DELETE` to archive. The full chain works.

**Demo 5 acceptance: Web Service multi-endpoint flow.** External system calls `GET /info` for health plus Provider list, `GET /profiles` for available Agents, `GET /tools` for available Tools, `POST /agents/{name}/invoke` for stateless Agent invocation, `GET /memory` for long-term memory. Five different endpoints collaborate on a single business workflow.

## Cross-user-story collaboration patterns

Five user stories in implementation, several cross-cutting collaboration points:

- Run `/speckit.analyze` after each user story to check constitution / spec / plan / tasks / code consistency. Catching drift early is the core anti-drift mechanism.
- When AI agents drift from constitution, proactively correct them. Watch for Claude Code-generated code that does not match constitution (such as using non-JDK 21 features, changing ReAct implementation, enabling Spring AI auto tool execution, splitting Tools into multiple modules, Providers using type scanning). Have the AI agent re-read the constitution and fix. These are exactly the spots where OryxOS gets written wrong.
- When cross-task context is lost, return to spec. After Spec-Kit splits code into multiple tasks, the AI agent may not remember what previous tasks did. Periodically have it re-read `spec.md` + `plan.md` + the most recent code.
- Use `git commit` to mark each user story as complete. Easy to roll back to a stable state.

## Incremental phase: manual prompt mode

After main development completes, OryxOS enters the incremental phase. The work nature is completely different from main development:

- Single task granularity is small (add a Channel, fix a bug, add a Plugin Tool).
- Few files involved (typically 1 to 3).
- No cross-module collaboration.
- Context is existing code, not from-zero design.

> In this kind of work, the Spec-Kit flow is too heavy. Running the full constitution → specify → plan → tasks → implement cycle costs more than the work itself. Manual prompts with Claude Code fit better: open Claude Code, describe what to do, Claude Code modifies directly within the existing code context, runs tests once done, no formal spec or plan artifacts needed before opening a PR.

### Incremental development workflow

The typical incremental workflow:

- A community contributor picks up an issue (the main repo tags them as `good-first-issue`, `feature-request`, `long-term-goal`).
- Locally fork and clone OryxOS.
- Open the project in Claude Code and describe the change to Claude.
- Claude modifies, adds tests, and gets things working on the existing code base. Open a PR against the main repo.
- The project team reviews and merges.

This flow does not mandate Spec-Kit; contributors work however they're comfortable. For strict large features, contributors may choose to run Spec-Kit, but it is not enforced.

### Connection to main-phase Spec-Kit artifacts

Main-phase outputs `constitution.md` and `spec.md` stay in the repo as reference during the incremental phase:

- `constitution.md` remains non-negotiable. Community-contributed code must honor it (JDK 21 + Spring Boot, self-implemented ReAct, Spring AI only halfway, Plugin Tool three modes, etc.).
- `spec.md` is the contract for the core capabilities. Community contributors modifying a core capability must not break the acceptance criteria in spec.
- `plan.md` is mostly frozen after the main phase. The technical solution document stays in the repo as community reference.

New user stories are handled as follows:

- Small features go directly to manual prompts and a PR.
- Large features (involving new Maven modules, constitution changes, cross-cutting changes across multiple core capabilities) are decided by the project team whether to run a fresh Spec-Kit specify → plan → tasks flow.

## Risks and notes

Several risks to be aware of during implementation:

- **AI agents drift from constitution.** AI agents may take shortcuts and generate code that does not match constitution. Countermeasure: after each implement, manually check. When drift is found, immediately have the AI agent re-read the constitution and fix. OryxOS's most-likely-wrong spots are: Spring AI auto execution not disabled, Providers using type scanning, Tools split into multiple modules, SkillLoader treated as a Tool, audit tables not written to storage. Focus the checks on these.
- **Cross-user-story context breaks.** The AI agent may forget specific decisions made in earlier user stories. Countermeasure: at the start of each user story, have the AI agent re-read `spec.md` + `plan.md` + recent code.
- **`/speckit.analyze` skipped.** Analyze is the cross-artifact consistency check command. Skipping it lets spec and code drift apart. Countermeasure: treat analyze as a hard checkpoint at the end of each user story, cannot be skipped.
- **MCP server integration pitfalls.** Java MCP Client ecosystem maturity lags behind Python. stdio transport may hit process startup failures, stdin/stdout encoding issues. Countermeasure: before US-4 implementation, test connectivity with a minimal MCP server.
- **Java engineering fundamentals are a prerequisite.** Lack of familiarity with Spring Boot + Maven + JPA will significantly slow things down. Countermeasure: ensure team members have a working grasp of the Spring Boot ecosystem before implementation.

## Summary

OryxOS's AI programming implementation splits into two phases.

**Main development uses Spec-Kit.** Existing requirement document plus technical solution are fed into Spec-Kit, transforming them into constitution + spec + plan + tasks artifacts. Preparation phase produces constitution, spec, and plan at once. Then five user stories are driven in dependency order: US-1 + US-2 form the foundation, US-3 and US-4 run in parallel, US-5 caps off after the first four complete. Each user story ends with a demonstrable demo, mapping to the five acceptance demos.

**Incremental phase switches to manual prompts with Claude Code.** Small-grained increments do not fit Spec-Kit's full flow. Community contributors use Claude Code to make changes directly on the existing code. Main-phase outputs of constitution + spec stay as long-term reference.

Spec-Kit and OryxOS are a strong fit: pure greenfield, medium scale (9 modules), clear requirements, AI agent collaboration, methodology value — each criterion checks out. The community's critique of Spec-Kit on brownfield projects does not apply to OryxOS.

> The core strategy: feed existing documents into Spec-Kit, do not rewrite them. OryxOS already invested in complete industry research plus requirement document plus technical solution. These are Spec-Kit's best inputs, much better quality than generating spec from zero. The key is to feed the latest version of the documents: 9 modules, not 11; constitution must include Spring AI only halfway and audit tables day one; otherwise Spec-Kit's generated plan will diverge based on the old structure.

Splits are by user story, not by time. The push order is US-1 → US-2 → (US-3 + US-4 in parallel) → US-5. The 4-week rhythm corresponds to the technical solution's Implementation Rhythm section.

## What to read next

- For what OryxOS does and the milestone plan, see **[Requirements](/docs/demand)**.
- For the technical architecture and module design, see **[Architecture](/docs/tech)**.
- For what OryxOS is and the broader positioning, see **[Overview](/docs/overview)**.