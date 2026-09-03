# OryxOS Homepage Design Spec

**Date**: 2026-09-03
**Status**: Draft — pending owner review
**Author**: Brainstorming session with project owner
**Scope**: Phase 1 — public-facing marketing homepage for OryxOS, visually aligned with `mq9/website`

---

## ⚠️ Constitution Deviation Notice

This design **deliberately deviates from CLAUDE.md §3.2 Principle 1 ("Single-binary deployment")**.

| Field | Value |
|---|---|
| Principle being deviated from | "JDK 21 + Spring Boot 3.x 单体应用 … 单二进制部署" (CLAUDE.md §3.2.1) |
| Deviation authorized by | Project owner, explicit verbal approval on 2026-09-03 |
| Deviation scope | The marketing **homepage** is delivered as a separate static site (VitePress → GitHub Pages) and is NOT packaged into the OryxOS fat JAR |
| What still ships as single binary | The runtime (ReAct loop, Provider, Memory, Tool, REST API) remains in one fat JAR per constitution |
| Rationale (owner-stated) | Owner chose to retain Vue/VitePress authoring experience and leverage VitePress ecosystem for future docs site, accepting the dual-deployment trade-off |
| Mitigation | Owner reviewed 3 alternatives (A pure HTML+CSS, B' VitePress-into-jar, B pure standalone) and explicitly selected B after being informed of the trade-off |
| Reversibility | Migration path to B' is documented in §10 (Future Migration) — no code is locked in |

Any future contributor who challenges this deviation should re-read this section and consult the owner before proposing rollback.

---

## 1. Purpose

Build the **public marketing homepage** for OryxOS — the first impression that enterprise architects and Java backend developers will see when evaluating OryxOS against alternatives.

The homepage is intentionally **visually aligned 1:1 with `mq9/website`** (a sibling open-source project by the same author), with these adaptations:

| Dimension | Adaptation |
|---|---|
| Brand name | `mq9` → `OryxOS` |
| Positioning | mq9: "Agent Registry + Async Messaging Broker" / OryxOS: "Enterprise-Controlled, Java-Native, Privately-Auditable Agent Runtime" |
| Visual assets | Reuse existing `docs/images/logo*.svg` and `architecture.svg` |
| Copy | Rewritten based on `docs/DemandAnalysis.md` §13 (acceptance demos) and the 5 core capabilities |
| CTA target | mq9 demo broker → OryxOS local `./mvnw spring-boot:run` (no public demo exists yet) |

**Non-goals** (deferred to later phases):

- Full documentation site (US-5 web service will eventually ship `/docs/...` REST docs; marketing homepage stays focused)
- Admin console / dashboard (not in core phase)
- Blog / changelog (post-launch)
- Multi-language i18n (deferred; CN/EN can be added later via VitePress i18n like mq9 does)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       GitHub: <owner>/OryxOS                         │
│                                                                     │
│  docs/                  docs/images/           website/             │
│  ├ IndustryResearch.md  ├ logo.svg             ├ package.json       │
│  ├ DemandAnalysis.md    ├ logo-mark.svg        ├ .vitepress/        │
│  ├ TechnicalSolution.md ├ logo-dark.svg        │  ├ config.mts      │
│  └ AiProgrammingGuide.md├ architecture.svg     │  └ theme/          │
│                         └ react-loop.svg       │     ├ index.ts    │
│                                                │     ├ custom.css  │
│                                                │     └ components/ │
│                                                │        └ Home.vue │
│                                                ├ index.md           │
│                                                └ public/            │
│                                                   ├ logo*.svg       │
│                                                   └ architecture.svg│
│                                                                     │
│  Two independent CI pipelines:                                      │
│  ┌────────────────────────┐  ┌─────────────────────────────────┐    │
│  │  deploy-website.yml    │  │  deploy-runtime.yml (existing)  │    │
│  │  → npm run docs:build  │  │  → ./mvnw package               │    │
│  │  → upload to GH Pages  │  │  → upload fat JAR               │    │
│  │  → oryxos.example.com  │  │  → api.oryxos.example.com       │    │
│  └────────────────────────┘  └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

**Two artifacts, two pipelines, two URLs.** This is the cost of the deviation.

---

## 3. Components

### 3.1 New files in OryxOS repository

| Path | Purpose | Size budget |
|---|---|---|
| `website/package.json` | VitePress dependency declaration | ~30 lines |
| `website/.vitepress/config.mts` | VitePress config (nav, force-light, head links) | ~80 lines |
| `website/.vitepress/theme/index.ts` | Register custom Layout + global Home component | ~10 lines |
| `website/.vitepress/theme/custom.css` | OryxOS brand tokens + section overrides | ~200 lines |
| `website/.vitepress/theme/components/Home.vue` | Homepage SFC (template + scoped CSS + copy arrays) | ~800 lines |
| `website/index.md` | English homepage entry | ~25 lines |
| `website/public/logo.svg` | ← symlink or copy from `docs/images/logo.svg` | 1 file |
| `website/public/logo-mark.svg` | ← symlink or copy from `docs/images/logo-mark.svg` | 1 file |
| `website/public/logo-dark.svg` | ← symlink or copy from `docs/images/logo-dark.svg` | 1 file |
| `website/public/architecture.svg` | ← symlink or copy from `docs/images/architecture.svg` | 1 file |
| `website/public/favicon.svg` | New — derived from `logo-mark.svg` | ~5 lines |
| `.github/workflows/deploy-website.yml` | Build + deploy GitHub Pages | ~40 lines |
| `website/CNAME` | Custom domain file (placeholder, see §7.3) | 1 line |

### 3.2 Files NOT touched

- `pom.xml` (root and all 9 modules) — **untouched**, no Maven changes
- `oryxos-web/**` — **untouched**, runtime stays clean
- `docs/*.md` — read-only sources for copy
- `docs/images/*` — read-only sources, copied/symlinked into `website/public/`

### 3.3 Asset symlink strategy

Use **git symlinks** (`git add website/public/logo.svg` with content pointing to `../../docs/images/logo.svg`) so a logo change in `docs/images/` propagates automatically. Fallback: copy if symlinks cause Windows permission issues.

---

## 4. Visual Structure (mirrors mq9 1:1)

8 sections, top-to-bottom:

| # | Section | mq9 content | OryxOS content |
|---|---|---|---|
| 1 | **Hero** | Badge "Agent Registry + Reliable Async Messaging" / Title "mq9" / Subtitle "A broker built for AI Agents" | Badge "Enterprise Agent OS · Java Native · Private & Auditable" / Title "OryxOS" / Subtitle "A unified runtime for AI Agents in Java" |
| 2 | **Problem** | "Two Foundational Problems" (discovery + offline delivery) | "Two Foundational Problems for Enterprise Agents" (governance + audit + reliability) |
| 3 | **Flow Diagram** | `<img src="/flow.svg">` (mq9 architecture) | `<img src="/architecture.svg">` (OryxOS architecture) |
| 4 | **Core Capabilities** (3 cards) | 🗂️ Registry / 📬 Mailbox / ⚡ Priority+Headers | 🧠 ReAct Loop / 🔌 Provider Abstraction / 💾 Memory Tiers |
| 5 | **Scenarios** (8 cards) | 8 mq9 use cases | 8 OryxOS use cases from `DemandAnalysis.md` §13 demos |
| 6 | **SDK/Integration** (3 cards) | NATS / mq9 SDK / LangChain | Spring AI / MCP Protocol / SKILL.md |
| 7 | **Protocol** (3 groups) | NATS subjects | 5 core capability APIs |
| 8 | **CTA** | `nats://demo.robustmq.com:4222` | `./mvnw spring-boot:run` + `curl http://localhost:8080/api/agent/chat` |

**Visual rules** (carried over from mq9, no deviation):

- Pure white background, black text, 5-step gray scale (`#f5f5f5`, `#e5e5e5`, `#999999`, `#444444`, `#000000`)
- **No brand color** — fully achromatic
- **No dark mode** (`appearance: 'force-light'`)
- Font stack: `Space Grotesk` (logo/H1) + `Inter` (body) + `JetBrains Mono` (code), all from Google Fonts CDN
- Emoji as icons (no icon library)
- No syntax highlighting (plain `<pre><code>`)
- Responsive breakpoints: 900px (3-col → 1-col), 768px (2-col → 1-col, padding shrink)
- One animation: Hero badge dot `pulse` (CSS keyframes)

---

## 5. Copy Mapping (draft)

> **Source of truth**: `docs/DemandAnalysis.md` §13 + `docs/IndustryResearch.md` + `docs/TechnicalSolution.md` §1-3
> **Status**: Draft copy. Final wording is iterated after the user reviews the rendered preview.

### 5.1 Hero

```
Badge:        Enterprise Agent OS · Java Native · Private & Auditable
Title:        OryxOS
Subtitle:     A unified runtime for AI Agents in Java
Description:  OryxOS is the Agent runtime enterprises control — built on Spring Boot 3.x
              and JDK 21, deployed as a single binary, fully auditable. Replace fragile
              Agent stacks with one runtime your platform team owns.
Primary CTA:  Get Started →
Secondary:    Protocol Spec  |  GitHub
Footnote:     Spring Boot 3.x · JDK 21 virtual threads · MCP Protocol · SKILL.md · SQLite · JPA
```

### 5.2 Problem

```
Heading:      Two Foundational Problems for Enterprise Agents
Lead:         Every Agent stack in production encounters the same two foundational problems.

Question 1:   How do you govern and audit what your Agents do?
             Compliance, traceability, and policy enforcement are non-negotiable.
Question 2:   How do you make Agents reliable under load?
             LLM calls fail, tools time out, sessions crash. Production needs retries,
             resumability, and observability — not demos.

Summary:      OryxOS solves exactly these two problems, so your platform team owns
              the runtime instead of stitching together fragile Agent stacks.

Today ✗:                          OryxOS ✓:
LangChain + custom glue code       One runtime, one binary, one team that owns it
No unified audit trail             Every tool call and LLM call persisted to SQLite
Tool calls and LLM calls fail      ReAct loop with retry, resume, MAX_ITERATIONS
                                  observability
Each team rebuilds governance      Provider abstraction, Tool Registry, Memory tiers
                                  built-in
```

### 5.3 Core Capabilities (3 cards)

| Icon | Title | Subtitle | Code block content |
|---|---|---|---|
| 🧠 | `ReAct Loop` | `Self-implemented cycle · MAX_ITERATIONS guard · resumable` | Pseudocode of the loop |
| 🔌 | `Provider Abstraction` | `Spring AI Alibaba · explicit provider→ChatModel map · no auto-tool execution` | Java snippet showing `ProviderService.chat(model, messages)` |
| 💾 | `Three-tier Memory` | `Session + Long-term · MEMORY.md · unified facade` | Java snippet showing `MemoryService.remember(...)` |

### 5.4 Scenarios (8 cards from DemandAnalysis §13)

| # | Title | Description (draft) |
|---|---|---|
| 01 | Sub-Agent result delivery | Sub-Agents write results to orchestrator's session. Orchestrator FETCHes when ready — no blocking, no shared state. |
| 02 | Multi-worker competing tool queue | Workers share a queue name — runtime guarantees each task goes to exactly one worker. Workers join or leave freely. |
| 03 | Tool capability discovery | Tools REGISTER capability descriptions. Agents DISCOVER by intent, then invoke directly. |
| 04 | Cloud-to-edge command delivery | Control plane publishes commands to edge mailbox. Messages persist during outage; on reconnect, Agent resumes from offset. |
| 05 | Human-in-the-loop approval | Agent sends to approvals queue. Human reviews, replies — same protocol for both human and Agent. |
| 06 | Async Request-Reply | Agent A creates a private reply session, includes reply_to. Agent B sends results there. A fetches when ready — no blocking. |
| 07 | Plugin Tool registration and health tracking | Plugin Tools REGISTER at startup, REPORT periodically, UNREGISTER at shutdown. Agents discover live tools. |
| 08 | Audit broadcasting | All tool calls and LLM calls broadcast to audit subscribers. Compliance team sees everything, even if Agents are offline. |

### 5.5 SDK/Integration (3 cards)

| Card | Icon | Description | Code/Tag |
|---|---|---|---|
| Native Spring AI | 🔌 | OryxOS uses Spring AI's Provider and `@Tool` schema — but disables auto-tool execution. You stay in control. | tags: `Spring AI`, `JDK 21`, `Virtual Threads` |
| MCP Protocol | 📦 | First-class MCP Java SDK client. Discover and invoke any MCP server tool via stdio. | `npm i @modelcontextprotocol/sdk` (showing MCP install — TODO refine) |
| SKILL.md | 🤖 | Drop a `SKILL.md` file into `.oryxos/skills/` and your Agent picks it up. Zero code plugin authoring. | tags: `SKILL.md`, `Plugin Tool`, `Zero-code` |

> **TODO** (placeholder): MCP install command and exact wording need refinement after consulting Spring AI Alibaba and MCP Java SDK docs.

### 5.6 Protocol (3 groups)

> **TODO**: Replace NATS subjects with OryxOS's actual public API surface. Current OryxOS spec does not yet define this clearly. **Open question — see §7.2.**

### 5.7 CTA

```bash
# Clone and run
git clone https://github.com/<owner>/OryxOS
cd OryxOS
./mvnw spring-boot:run

# In another terminal — send your first Agent message
curl -X POST http://localhost:8080/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"Hello, OryxOS"}'
```

Primary CTA: `Read the Docs →` (links to `/docs/` in VitePress, future path)
Secondary: `GitHub`

---

## 6. Deployment

### 6.1 Build & deploy pipeline

**`website/`** — new pipeline:

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website
on:
  push:
    branches: [main]
    paths: ['website/**', 'docs/images/**']
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with: { path: website/.vitepress/dist }
      - uses: actions/deploy-pages@v4
        id: deployment
      - run: |
          echo "::notice::Deployed to ${{ steps.deployment.outputs.page_url }}"
```

**Runtime** — existing pipeline (unchanged).

### 6.2 Local development

```bash
# Homepage (this design)
cd website
npm install
npm run docs:dev          # → http://localhost:5173

# Runtime (separate)
./mvnw spring-boot:run    # → http://localhost:8080
```

### 6.3 DNS / Domain (placeholder)

| Resource | Value | Action |
|---|---|---|
| Homepage URL | TBD — `oryxos.example.com` or `<owner>.github.io/OryxOS` | Owner to confirm before publishing |
| Runtime URL | TBD — separate, not in this spec | Out of scope |

**Action required**: Owner provides custom domain before first deploy, or we accept GitHub Pages default URL (`<owner>.github.io/OryxOS`).

---

## 7. Open Questions

These are decisions the **owner must make before implementation begins**. Defaults are shown; please confirm or override.

### 7.1 Symlinks on Windows

The repo's primary working directory is Windows (`E:\VibeCoding\OryxOS`). Git symlinks work on Windows in modern Git for Windows but can cause issues with some tooling.

- **Default**: Use **copies** for `website/public/logo*.svg` and `architecture.svg`. Add a `website/public/README.md` note: "If you update `docs/images/`, re-copy these files."
- **Alternative**: Git symlinks (smaller diff, single source of truth).

### 7.2 Protocol section content

mq9 has clear NATS subjects. OryxOS does **not** yet have a finalized public API spec — `TechnicalSolution.md` §10 lists REST endpoints (10 core) but they are part of US-5 which is not yet implemented.

- **Default**: Use a **placeholder** set of REST endpoints sketched from `TechnicalSolution.md` (e.g. `POST /api/agent/chat`, `GET /api/sessions/{id}`, etc.), labeled `[Planned — US-5]` in small gray text.
- **Alternative**: Omit the Protocol section entirely from v1 and add later.

### 7.3 Domain

See §6.3. **Default**: ship to `<owner>.github.io/OryxOS` first, add custom domain later.

### 7.4 Favicon

`docs/images/` has `logo-mark.svg` and `logo.svg` but no favicon.

- **Default**: Create `website/public/favicon.svg` from `logo-mark.svg` with a 16x16 viewBox adaptation.

---

## 8. Testing

| Test | Method | Pass criteria |
|---|---|---|
| Visual 1:1 with mq9 | Side-by-side screenshot comparison of `/` (OryxOS) vs mq9 homepage | Layout, fonts, colors, spacing match within visual judgment threshold |
| Responsive 900px | Browser DevTools set to 900px wide | 3-col grids become 1-col, padding shrinks |
| Responsive 768px | Same at 768px | Hero padding shrinks, all grids become 1-col |
| Build succeeds | `npm run docs:build` exits 0 | `website/.vitepress/dist/` populated with `index.html` |
| Deploy succeeds | Push to `main`, GH Pages URL responds 200 | `curl -I https://...` returns 200 |
| Lighthouse a11y | Run Lighthouse on homepage | Accessibility score ≥ 90 |
| Lighthouse perf | Same | Performance score ≥ 90 |
| No console errors | Open homepage in browser, check DevTools console | 0 errors, 0 warnings |
| No 404s on assets | DevTools Network tab | All `logo*.svg`, `architecture.svg`, fonts load |
| i18n (deferred) | N/A | Out of scope for v1 |

---

## 9. Implementation Steps (sequenced)

1. **Scaffold `website/`** — `package.json`, `.vitepress/config.mts`, `theme/index.ts`, `theme/custom.css`, `theme/components/Home.vue` (empty)
2. **Copy/symlink assets** — `website/public/logo*.svg`, `architecture.svg`, new `favicon.svg`
3. **Write `index.md`** — frontmatter + `<Home />` placeholder
4. **Port `Home.vue` structure from mq9** — copy the 8-section template, scoped CSS, computed arrays. Replace all copy per §5.
5. **Local dev verify** — `npm run docs:dev`, screenshot at 1440px, 900px, 768px, 375px
6. **Iterate on copy** — owner reviews, requests changes, loop
7. **Build** — `npm run docs:build`, verify `dist/index.html` exists
8. **Add GitHub Actions workflow** — `.github/workflows/deploy-website.yml`
9. **First deploy** — push, verify GH Pages URL responds 200
10. **Smoke test** — Lighthouse a11y + perf, console errors, asset 404s
11. **Commit spec + code** — git commit message: `feat(website): scaffold OryxOS homepage (B standalone)`
12. **Update CLAUDE.md** — add note in "相关文件位置" section pointing to `website/`

---

## 10. Future Migration (B → B')

If owner later wants to recover the single-binary deployment:

```bash
# Add frontend-maven-plugin to oryxos-web/pom.xml
# Configure to run `vitepress build` and copy dist/ into static/
# Remove .github/workflows/deploy-website.yml
# Update docs/TechnicalSolution.md §10 to clarify homepage location
```

The `website/` source tree stays unchanged. The Maven build becomes responsible for producing the homepage artifact and embedding it. No copy rewrite needed.

---

## 11. Out of Scope (Explicit)

- Full documentation site (REST API reference, user guide) — defer to US-5 or post-launch
- Admin console for runtime — not in core phase
- Blog / changelog / RSS
- i18n (CN/EN) — defer to post-launch
- Analytics integration (51.la equivalent) — defer until domain confirmed
- Giscus comments — defer to docs site, not needed on marketing homepage
- Search on website — defer

---

## 12. References

- Source of truth for homepage structure: `E:\github\mq9\website\.vitepress\theme\components\Home.vue` (762 lines)
- mq9 VitePress config: `E:\github\mq9\website\.vitepress\config.mts`
- OryxOS constitution: `CLAUDE.md` §3.2
- OryxOS positioning: `docs/IndustryResearch.md`, `docs/DemandAnalysis.md`
- OryxOS visual assets: `docs/images/logo*.svg`, `architecture.svg`, `react-loop.svg`

---

## Owner Sign-off Checklist

Before I begin implementation, please confirm:

- [ ] **§3.1 file list** is complete — any files I missed?
- [ ] **§5 copy draft** is acceptable direction — any sections you want rewritten before I implement?
- [ ] **§6.1 deploy pipeline** is acceptable
- [ ] **§7.1 symlinks vs copies** — pick one
- [ ] **§7.2 Protocol section** — pick one (placeholder vs omit)
- [ ] **§7.3 Domain** — pick one (custom vs GitHub default)
- [ ] **§9 sequence** is acceptable — any reordering?

Once you sign off (or tell me to proceed with all defaults), I invoke `superpowers:writing-plans` to produce the implementation plan.
