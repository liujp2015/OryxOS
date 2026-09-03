---
title: Overview
description: What is OryxOS and why Java
---

OryxOS is an enterprise Agent OS written in Java. It is a unified runtime where multiple business Agents share channel access, model routing, memory, tool execution, and audit — running on your own infrastructure as a single Spring Boot binary.

This page covers what an Agent OS is, why enterprises need a privately controlled one, why the Java ecosystem had a gap that nothing was filling, and how OryxOS positions itself within the broader landscape.

## What "Agent OS" actually means in deployment

A deployed Agent OS instance looks like this:

- The user installs one Agent OS instance (a single service) on their own machine, server, or Kubernetes cluster.
- The Agent OS ships with a web admin console or CLI tools.
- The user creates Agents through the web UI or CLI (uploading or placing code in a directory), registers Tools and Skills, configures channels.
- Once Agents are running, end users talk to them through IM or web.
- The Agent OS supports automated Agent execution.

What the business side cares about is simple:

- Write a Tool that does a specific thing (in any language).
- Then configure an Agent on the Agent OS to use that Tool.

The business side never writes Agent backend code. Agents are configured, not coded. Business teams do not need to know where messages come from, how LLMs are called, how user identity is managed, how audit is captured, or how context continues — these are all the Agent OS's responsibility.

## What is an Agent OS

An **Agent OS** is the substrate that runs and manages AI Agents. It installs on a user's or enterprise's own machine and provides:

- **Agent lifecycle management** — register, start, monitor, retire multiple Agents, each with its own prompt, model, tools, channels, and memory. Agents are configured, not coded.
- **Unified inbound channels** — IM platforms (WeCom, Feishu, DingTalk, Slack, Telegram, Discord), email, web, HTTP API. Every Agent shares the same channel layer.
- **Unified outbound integrations** — LLM Providers, tools (via MCP or plugins), enterprise IT systems, knowledge bases. Every Agent shares the same integration layer.
- **Unified memory** — long-term memory that survives sessions, reusable Skill templates, knowledge that compounds across Agents.
- **Tool calling and sandboxed execution** — Agents call Tools through LLM Function Calling, with Tools executing inside a sandbox that enforces security boundaries.

A useful way to separate concerns: an **agent runtime** executes a single Agent (LLM calls, tool execution, context management, loop control). An **Agent OS** sits above the runtime and manages a fleet of Agents — their lifecycles, their shared infrastructure, their multi-tenant isolation, their audit.

> Runtime makes one Agent run. Agent OS makes a fleet of Agents governable inside an enterprise.

## Why enterprises need a private Agent substrate

Demand for AI Agents is real. Surveys of technical leaders in 2026 show the majority have already deployed multi-step Agent workflows and plan to expand in 2026, with most reporting measurable economic returns.

The hard part is not building a demo Agent. The hard part is running Agents in production inside a regulated enterprise, where several engineering realities collide:

- Integration with existing systems is the single largest blocker, not model capability.
- Data access quality and implementation cost are the next two.
- Change management at the organizational level matters.
- Most organizations report AI Agent security incidents in the past year, and a small minority have full IT and security approval before Agents go into production.
- Tool calling in production has a non-trivial failure rate, and most failures are silent.

For heavily regulated industries — banking, government, telecom, energy, healthcare — the constraints are even tighter:

- Core business data cannot leave the enterprise.
- Every system must be fully auditable.
- New components must pass existing security and compliance reviews.
- Technology stacks must align with what the enterprise already runs.

Under these constraints, the available options narrow sharply. SaaS products move data outside the enterprise perimeter. Cloud-vendor Agent platforms lock the enterprise into a specific ecosystem. Open-source Agents with a history of CVEs and credential-harvesting supply-chain incidents cannot pass standard security review. The enterprise needs a substrate that is privately deployed, fully auditable, aligned with existing IT governance, and consistent with the existing technology stack.

> This need is fixed, rigid, and unmet by current options. Whether or not the term "Agent OS" remains fashionable, regulated enterprises will continue to need a substrate they fully control.

## What an open-source Agent OS landscape looks like

Before discussing OryxOS, it helps to map the existing landscape.

Two open-source projects currently dominate the Agent OS category. They represent different trade-offs but together define the shape of the category.

**OpenClaw** is a Node.js implementation under MIT license, released in late 2025. It targets consumers and developers: more than twenty channel integrations, tens of thousands of community Skills, strong playability, and rapid GitHub adoption. Its strengths are community vitality and capability breadth. Its weakness is enterprise-grade security and governance: CVEs, malicious Skills, and credential-harvesting issues have recurred, and enterprise deployments need a secondary hardening layer before they can reach production.

**Hermes Agent** is a Python implementation under MIT license, released in early 2026. It targets engineering robustness: three-layer memory, self-evolving Skill mechanisms, security scanning, multi-user isolation. It has invested more visibly in enterprise direction, has commercialization samples and cloud-vendor backing, and has reached substantial daily-inference volume.

Together, these two projects sketch the current open-source Agent OS landscape: one consumer/playable, one engineering/robust. Both start from individual and small-team positioning, and both deliver "an installed Agent runtime substrate on the user's own machine".

This is the starting point for understanding OryxOS's positioning: not what they have built individually, but what they have collectively left empty.

The gaps in the open-source Agent OS landscape, taken together, are real:

- **Complete enterprise-grade governance is missing.** True multi-tenant RBAC, SSO integration, audit architecture, and compliance evidence are absent. Hardening solutions exist as patches, not as day-one design.
- **Deep enterprise IT system integration is missing.** IM channels get community-extension support, but deep integration with ERP, CRM, CMDB, and monitoring systems is left to each enterprise.
- **The Java ecosystem has no representation.** OpenClaw is Node.js; Hermes is Python. Nothing in the Java ecosystem takes "Agent OS" as its positioning.

The third gap is what motivates OryxOS, and it deserves a dedicated section because it matters most for enterprise markets.

## The Java ecosystem had a gap

The Java ecosystem has solid AI engineering tooling, but no Agent OS:

- **Spring AI** (the official Spring project) is a Java AI application framework. It provides LLM call abstractions, prompt templating, RAG tools, and Tool Calling capabilities.
- **Spring AI Alibaba** is the Alibaba-driven Spring AI extension. Within a year it shipped connectors for more than a dozen mainstream LLMs (Qwen, Wenxin, DeepSeek, Kimi, Zhipu, Hunyuan, Doubao, and others), and production deployments have appeared.
- **LangChain4j** is the Java port of LangChain, a comparable framework.
- **ONNX Runtime Java** and **DJL** handle on-device inference.

These are all libraries or frameworks. Their artifacts are code. Developers are responsible for the runtime environment.

In other ecosystems, Agent OS projects exist and have validated their designs. In the Java ecosystem, there is no project that takes "Agent OS" as its positioning. There are frameworks, but no substrate.

### Why this gap is worth filling

A healthy technology ecosystem should have an implementation at every critical layer. When it doesn't, that layer becomes a seam, and seams are filled with brittle glue.

The Java/Spring stack is exceptionally complete at the enterprise backend layer: Spring Boot for web, Spring Cloud for microservices, Nacos for config and discovery, Sentinel for rate limiting and circuit breaking, SkyWalking for tracing, Arthas for online diagnostics, Prometheus + Grafana for monitoring and observability. Most enterprise ERP, CRM, CMDB, SSO, and monitoring systems are either Java services or expose Java SDKs.

The Agent OS layer is empty. A Java enterprise that wants a privately controlled Agent substrate today must reach for an OpenClaw or Hermes deployment and write Java glue on every seam where the Agent OS meets existing systems. That seam is the most painful integration point for Java-stack users of OpenClaw and Hermes.

Filling the gap means giving the Java ecosystem a native Agent OS implementation that snaps into the existing Java infrastructure. The same logic that motivated Spring AI to fill "the Java LLM calling layer" motivates OryxOS to fill "the Java Agent OS layer".

### Why Java is well-positioned for this

Several technical realities make Java the right language for an enterprise Agent OS:

- **Spring Boot is the de facto enterprise backend standard.** A Java Agent OS is just a Spring Boot application. Operations teams do not need new tooling; it slots into their current setup.
- **Spring AI Alibaba ships mainstream LLM connectors out of the box.** More than a dozen providers are already wired. The Java Agent OS Provider layer stands on the shoulders of an active ecosystem.
- **The JVM operations toolchain is mature.** Nacos, Sentinel, SkyWalking, Arthas, JFR, Prometheus + Grafana integrate with the Java Agent OS seamlessly. Enterprises do not need to build a parallel ops stack.
- **Integration with existing Java systems has the lowest cost.** Tools call directly into enterprise Java services. No cross-language glue code.
- **Regulated industries already run on Java.** Private deployment, full audit, and compliance review work through the existing Java audit pipeline.
- **GraalVM Native Image closes the historical Java startup and memory gap.** JDK 21 + Spring Boot 3.x + GraalVM deliver startup and memory profiles comparable to Node.js and Python, making single-binary deployment viable.

## How OryxOS positions itself

OryxOS uses the "Agent OS" framework to organize its design. The framework is useful: it draws clean boundaries, and the operating-system analogy aids thinking. But OryxOS does not anchor itself on the term "Agent OS". It anchors on the underlying need: regulated enterprises need a substrate they fully control, privately deployed, fully auditable, aligned with Java, with data staying inside the enterprise.

The distinction matters. Anchoring on a term means the project loses its footing when terminology shifts. Anchoring on a need means the project survives terminology churn because the need does not.

> OryxOS puts down roots in things that do not change.

### The four-word positioning

OryxOS targets four words:

- **Unified** — multiple business Agents in an enterprise share one substrate. Channels, models, memory, multi-tenant isolation, and audit are common capabilities underneath. New Agents are added by configuring a Profile YAML, not by rebuilding infrastructure.
- **Private** — data and deployment live entirely on the enterprise's own infrastructure, on its own Kubernetes, VMs, or bare metal. Models may be external APIs, or local Ollama or vLLM. OryxOS itself collects nothing.
- **Easy-to-integrate** — based on standard Spring Boot engineering. Snaps into existing ERP, CRM, CMDB, SSO, and monitoring. Reuses the existing Java operations toolchain (Nacos, Sentinel, SkyWalking, Arthas). Tools can be written in any language via MCP, or directly as Spring Beans.
- **Observable** — standard Prometheus metrics, structured JSON logs, health check endpoints, and a web dashboard. Adapts to existing monitoring and alerting.

## How OryxOS relates to adjacent concepts

The line between an Agent OS and adjacent concepts is easy to blur. The most common confusions are with orchestration platforms, frameworks, and vendor SaaS suites. Here is the comparison:

| Category | Artifact | Who uses it | Deployment | Relationship to Agent OS |
|---|---|---|---|---|
| Orchestration platform (Dify, Coze) | A workflow | Business users, developers | Mostly SaaS or self-hosted platform | Can run on top of an Agent OS, using it as backend |
| Framework (LangChain, Spring AI, LangChain4j) | Code | Developers | Self-built runtime | Can be a building block inside an Agent OS |
| Vendor suite (Glean, Bedrock AgentCore, Agentforce) | Complete application | Enterprise buyers | SaaS, locked to a cloud | Different quadrant, not privately deployable |
| Agent OS (OryxOS) | Configured, long-running Agents | Business teams, IT | Installed on own infrastructure, single binary | Itself |

Three takeaways from this comparison:

- **Orchestration platforms and Agent OS are at different layers.** An orchestration platform runs on top of an Agent OS. OryxOS deliberately does not build visual workflow orchestration; it occupies the layer below.
- **Frameworks and Agent OS are complementary, not competing.** Frameworks give developers libraries to call LLMs in code. Agent OS gives the business a running runtime. OryxOS internally reuses Spring AI / Spring AI Alibaba for LLM calls.
- **Vendor SaaS is a different quadrant.** Agent OS is open source, privately deployed, and cloud-agnostic.

OryxOS sits firmly in the runtime layer: configured, long-running Agents, installed on the enterprise's own machine, with everything needed to run them in production.

## What OryxOS does not do

The boundary is just as important as the positioning. OryxOS does not build:

- Visual workflow orchestration. If business users need a drag-and-drop workflow, use Dify on top of OryxOS.
- Complex task decomposition or explicit multi-Agent collaboration.
- Tool calling parallelism, SSE streaming, full Tool Policy, vector retrieval, or Docker sandbox. They belong in the extension phase.

OryxOS is a runtime, not an orchestrator. The boundary lets it focus on doing one thing well: being a stable substrate that Agents can run on inside the enterprise.

## How OryxOS relates to existing open-source Agent OS projects

OryxOS borrows design patterns that open-source Agent OS projects have already validated: Agent configuration and lifecycle, channel abstraction, three-layer memory, the Skill system (`SKILL.md` compatible with the agentskills.io open standard), Tool calling via MCP, and single-binary deployment. OryxOS re-implements these in the Java ecosystem and adds the governance capabilities that enterprise Agent OS requires: multi-tenant isolation, SSO, RBAC, audit, compliance, web dashboard, and deep enterprise integration.

The relationship to OpenClaw and Hermes is "same category, different positioning". All three are Agent OS. OpenClaw targets individuals and small teams. Hermes targets small teams with stronger engineering focus. OryxOS targets regulated enterprises directly. The Skill system is compatible through `SKILL.md`, so community Skills can in principle be imported into OryxOS after enterprise review. There is no need to argue which one replaces which. Open-source projects in the same category coexisting is normal; OryxOS just takes the "enterprise-grade controllable + Java native" orientation to its full expression.

The relationship to Dify-style orchestration platforms is complementary. Dify does visual workflow orchestration. OryxOS does runtime substrate. Enterprises can use both: Dify for rapid business-user applications, OryxOS for core Assistants. They can even be combined, with Dify as the application layer and OryxOS as the substrate layer.

The relationship to Spring AI, Spring AI Alibaba, and LangChain4j is reuse. OryxOS's Provider abstraction is built directly on top of Spring AI Alibaba's mainstream LLM connectors. There is no reinvention.

## Where OryxOS stands on safety

The community Agent OS landscape has real security scars: CVEs, malicious Skills in community marketplaces, credential-harvesting patterns in third-party Skill supply chains, default-loose permission models. These are not accidental bugs; they are structural. An open low-barrier third-party Skill ecosystem plus default-loose permissions and weak isolation produces these problems.

OryxOS targets regulated enterprises, so security is a day-one design requirement, not an afterthought patch. Several specific choices diverge from the open-market pattern:

- **Skill and Tool sources are controlled.** OryxOS does not host an open marketplace where anyone uploads and any Agent pulls. Enterprise Skills and Tools go through registration, review, signing, and version management, with traceable sources.
- **Minimum permissions, not default-open.** Every Agent and Tool receives an explicit minimal permission grant. File system, network, and shell access default to tight, opened only as needed.
- **Sandbox isolation is mandatory, not optional.** Tools execute inside isolated environments with clear resource and capability boundaries. Multi-tenant isolation is complete.
- **Credentials do not land in plaintext.** API keys, tokens, and enterprise credentials are not stored in cleartext. They integrate with enterprise key management (KMS, Vault, etc.), and credential usage is fully auditable.
- **Prompt injection and data exfiltration are actively defended.** Memory writes and tool inputs pass through security scanning that detects injection and exfiltration patterns.
- **Full-chain audit is a substrate capability, not an add-on.** Every action — who, when, which Agent, which Tool, which data, what result — is captured in structured form, ready to feed into enterprise audit and SIEM systems.
- **Security review flows through existing enterprise processes.** OryxOS is Java/Spring-based and runs on enterprise infrastructure, so it slots into existing code audit, security scanning, and compliance review. Security grows from the architecture, rather than being layered on as an external shell.

## Where the road leads from here

The current OryxOS delivery focuses on a single-node private deployment. One OryxOS instance, installed on the enterprise's own server or container, runs a group of Agents serving a department or scenario. This is a deliberate choice: most enterprise Agent substrate rollouts start with "get it running stably in one scenario first", and single-node is the simplest, easiest to integrate, easiest to fold into existing operations and audit, and most aligned with "installs like a Spring Boot app".

The architecture, however, leaves room for what comes next. When an enterprise moves from "one department pilot" to "serving the whole company", single-node will hit three limits:

- **Volume.** A single instance has upper bounds on concurrency and throughput.
- **Failure.** If the single point goes down, the entire Agent service stops.
- **Scaled governance.** With dozens of departments, hundreds of Agents, and many tenants sharing, single-node resources and isolation are insufficient.

Distributed deployment is the planned evolution direction to address all three. The architectural principle that makes this clean is **stateless instances, externalized state**: Session, Memory, audit logs, and Agent configuration all move out of the instance into external storage layers. The OryxOS instance becomes stateless and horizontally scalable. Any instance can be lost or scaled without losing state.

The Java ecosystem's mature distributed infrastructure — Nacos for service discovery and configuration, Sentinel for rate limiting and circuit breaking, Spring Cloud Gateway, SkyWalking for distributed tracing, Prometheus + Grafana for monitoring — is already part of the standard enterprise stack. OryxOS can stand on this layer directly. Distributed, high availability, and service governance have always been Java/Spring's strongest points; this is exactly where Node.js OpenClaw and Python Hermes have to invest more engineering effort, while Java can do it naturally.

> The current focus is single-node done well. Distributed is reserved architectural space. The goal is to make sure the single-node design does not block the future path, not to front-load all complexity now.

A more distant and more interesting direction is distributed Agent collaboration: multiple Agents across nodes, departments, and even partner organizations discovering each other, delegating tasks reliably, sharing necessary context, and collaborating on cross-cutting business processes. The "nodes" here are Agents, not servers. This is genuinely early-stage in the industry — most multi-Agent exploration stays within a single process. But it is the natural direction this line of work evolves toward, and worth seeing clearly now.

## What comes next

The rest of this documentation covers what OryxOS does in detail, how it is architected, and how it is being built.

- For the feature set, milestone plan, and acceptance criteria, see **[Requirements](/docs/demand)**.
- For the technical architecture, Maven modules, and key design decisions, see **[Architecture](/docs/tech)**.
- For the AI-assisted development workflow and the user-story breakdown, see **[AI Dev Guide](/docs/ai-guide)**.