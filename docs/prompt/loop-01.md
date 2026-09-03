# OryxOS Loop Prompt · 01

> Source: `docs/prompt/01.md` (39 conversational turns).
> Purpose: same work, expressed as a single self-contained prompt for an autonomous loop agent (ReAct / Claude Code / Cursor agent mode). Strip conversational filler, resolve UI selections and corrections, order by dependency, attach verifiable acceptance per phase.

---

## Objective

Bootstrap the OryxOS project end-to-end from its 4 design documents. Deliver a Maven multi-module Spring Boot app (runtime) plus a VitePress + GitHub Pages website (docs + homepage). Both must build, run, and ship greenfield.

## Context (read first)

| Item | Value |
|---|---|
| Working root | `E:\VibeCoding\OryxOS` |
| Design docs (source of truth) | `docs/IndustryResearch.md`, `docs/DemandAnalysis.md`, `docs/TechnicalSolution.md`, `docs/AiProgrammingGuide.md` |
| Stack | JDK 21 + Spring Boot 3.x + Spring AI Alibaba (Provider only) + SQLite + JPA + Picocli |
| Maven modules (9, fixed) | `oryxos-boot`, `oryxos-core`, `oryxos-provider`, `oryxos-memory`, `oryxos-tool`, `oryxos-web`, `oryxos-channel-cli`, `oryxos-storage`, `oryxos-cli` |
| Constitution | `CLAUDE.md` — 7 non-negotiable principles (most critical: self-implement ReAct loop; Spring AI for protocol/schema only — never auto-tool execution; audit tables `tool_invocations` + `llm_calls` day-one; ProviderService uses explicit name→ChatModel map, never type scan; Tool is one module, not three; SKILL.md is prompt input not Tool) |
| Git remote | `https://github.com/liujp2015/OryxOS.git` |
| Git proxy | `http://127.0.0.1:7890` (`git config http.proxy` once) |
| Reference site (homepage visual baseline) | `E:\github\mq9\website` — copy visual design 1:1 (achromatic, 8 sections, single pulse animation) |
| Build tooling | Maven `mvn` (or `mvnw` once generated); Node 22+ for website |

---

## Phases (execute in order; do not skip ahead)

### Phase 1 — Project meta files

**Files**: `CLAUDE.md`, `README.md` (both at repo root).

- Read all 4 design docs in `docs/`.
- Write `CLAUDE.md` with the 7 constitution principles (see `docs/AiProgrammingGuide.md` §3.2). Deviation notice for the website (single-binary is suspended for `website/` only, per owner authorization).
- Write `README.md` modeled on standard open-source layout, with logo at the top (`docs/images/logo.svg`).
- Re-read `CLAUDE.md` before proceeding. **Constraint**: do not move the 4 design docs from `docs/`.

**Done when**: both files exist at repo root, 4 design docs still under `docs/`.

### Phase 2 — Diagrams + Maven skeleton

**Files**: `docs/images/architecture.svg`, `docs/images/react-loop.svg`, `pom.xml`, `mvnw` + `mvnw.cmd` + `.mvn/`, 9 empty module dirs.

- Generate `architecture.svg` and `react-loop.svg` from the tech solution + AI guide. Reference them from the docs that describe them.
- Generate `pom.xml` parent POM packaging `pom`, with the 9 modules declared (do `or `to `oryxos-*`).
- Create the 9 module dirs, each containing at least a `pom.xml` that extends parent and declares its expected deps). `e.g. oryxos-core` depends on nothing, `oryxos-boot` depends on all.
- Run `mvn -q -DskipTests validate` to confirm POM graph is sound. **Hard gate**: must compile to `target/` per module; do not move past this phase with build errors.

**Done when**: `mvn validate` succeeds; 9 `target/` dirs produced; `architecture.svg` + `react-loop.svg` committed.

### Phase 3 — Runtime entry points

**Files**: `oryxos-boot/src/main/java/.../OryxOsApplication.java`, `oryxos-boot/src/main/resources/application.yaml`, `oryxos-cli/src/main/java/.../OryxOsCli.java`, `oryxos-channel-cli/src/main/java/.../CliChannel.java`.

- `OryxOsApplication` is a `@SpringBootApplication`. Boot must be runnable via `java -jar` after `mvn package`.
- Add `application.yaml` with `spring.application.name=oryxos`, server port `8080`, and the SQLite datasource pointing at `${user.home}/.oryxos/oryxos.db`.
- `OryxOsCli` is the Picocli entry. `java -jar oryxos-boot.jar --version` must print the version string. Then `java -jar oryxos-boot.jar` (no args) starts the Spring context.
- `CliChannel` lives in `oryxos-channel-cli` and exposes the same `--version` flag (delegated to boot).

**Done when**:
- `java -jar target/oryxos-boot-*.jar --version` prints `OryxOS <version>` and exits 0.
- `java -jar target/oryxos-boot-*.jar` starts Spring on :8080, `GET /api/v1/health` returns 200.

### Phase 4 — Five core capabilities

Order = dependency order from `AiProgrammingGuide.md` §1.3. Not priority order.

| US | Capability | Modules touched | Verification demo |
|---|---|---|---|
| US-1 | LLM Provider | `oryxos-provider`, `oryxos-core` | Provider unit-tested with 2 real providers |
| US-2 | ReAct loop | `oryxos-core`, `oryxos-tool` (HTTP tool), `oryxos-channel-cli`, `oryxos-cli` | "查天气穿衣" via `oryxos chat` |
| US-3 | Memory | `oryxos-memory`, `oryxos-core` | "跨对话记偏好" — second session references saved preference |
| US-4 | Plugin Tool | `oryxos-tool` (file/shell/http), `oryxos-core` (SKILL.md via ContextLoader) | "零代码 PR digest" |
| US-5 | Web Service | `oryxos-web`, `oryxos-storage`, `oryxos-cli` | 10 REST endpoints respond; sessions persist to SQLite |

After each US, run `/speckit.analyze` (or equivalent manual cross-check of `spec.md` vs implementation).

**Constitution reminders during US-2**:
- ReAct loop self-implemented; `ToolExecutor` controls dispatch.
- Spring AI's auto-tool-execution is **disabled**. Confirm no `chatClient.call(prompt)` returns tool calls that get executed automatically.
- `ProviderService` uses explicit `Map<String, ChatModel>`, never bean-type scan.

**Constitution reminders during US-3 and US-5**:
- `tool_invocations` and `llm_calls` are written to SQLite the same day they execute (not just logged).
- Long-term memory is `MEMORY.md` file + `save_memory` / `recall_memory` tools. No vector DB in core phase.

### Phase 5 — Logo

**Files**: `docs/images/logo.svg`, `docs/images/logo-dark.svg`, `docs/images/logo-mark.svg`.

- Draw an oryx antelope mark (two horns + head + orbit) in SVG.
- Both color and dark variants. README embeds the color one with `<picture>` switching to dark on `prefers-color-scheme: dark`.

**Done when**: README renders with logo at the top on both color schemes.

### Phase 6 — Homepage (visual baseline = `E:\github\mq9\website`)

**Files**: `website/package.json`, `website/.vitepress/{config.mts,theme/index.ts,theme/custom.css,theme/components/Home.vue}`, `website/index.md`, `website/public/logo*.svg`, `website/public/favicon.svg`, `website/public/architecture.svg`, `.github/workflows/deploy-website.yml`.

- Copy `E:\github\mq9\website` visually 1:1: pure achromatic, 8 sections, single animation (Hero badge dot pulse), responsive at 900px and 768px.
- Replace copy with OryxOS content: Hero / Flow Diagram / Problem / Core Capabilities / Scenarios (8 cards) / SDK Integration (3 cards) / Protocol / CTA.
- Override VitePress defaults in `custom.css`: hide `VPHero`, `VPFeature`, `VPNavBarAppearance`, `VPSwitchAppearance`. Force `appearance: 'force-light'`.
- Embed Google Fonts (Space Grotesk / Inter / JetBrains Mono).
- After Phase 6, before Phase 7: confirm `npm run docs:dev` shows the page on http://127.0.0.1:5173/.

**Done when**: dev server renders all 8 sections without layout breakage.

### Phase 7 — Website docs + i18n

**Files**: `website/docs/{index,overview,demand,tech,ai-guide}.md`, `website/zh/index.md`, `website/zh/docs/{index,overview,demand,tech,ai-guide}.md`, `website/.vitepress/config.mts`.

- Derive each EN page from the corresponding design doc:
  - `overview.md` ← `IndustryResearch.md` (positioning + four 4-anchor words).
  - `demand.md` ← `DemandAnalysis.md` (5 core capabilities, milestones).
  - `tech.md` ← `TechnicalSolution.md` (7 decisions, 9 modules).
  - `ai-guide.md` ← `AiProgrammingGuide.md` (5 user stories, Spec-Kit workflow).
- Mirror in `zh/docs/`. Keep technical terms in English: `Agent OS`, `ReAct`, `Spring Boot`, `JDK 21`, `MCP`, `MEMORY.md`, `SKILL.md`, `LLM`, `Provider`, `Profile`, `Tool`, `Channel`, `Session`, `Sandbox`, all `oryxos-*` module names, all command names, all class names.
- Configure `locales` in `config.mts`: `root` (English) + `zh` (Simplified Chinese). Per-locale nav + sidebar. Locale switcher auto-renders in nav.
- Set `base: '/OryxOS/'` in `config.mts` (project site lives at the subpath; missing this causes 404 on every asset).

**Done when**: `npm run docs:build` succeeds; `/`, `/docs/`, `/zh/`, `/zh/docs/`, `/zh/docs/tech` all serve 200 locally and asset URLs contain `/OryxOS/`.

### Phase 8 — Logo on website

**Files**: `website/.vitepress/{config.mts,theme/components/Home.vue}`.

- Reference `docs/images/logo-mark.svg` as the canonical source (already mirrored to `website/public/logo-mark.svg`).
- Display it in the Home.vue hero above the badge (80px square, centered).
- Add `themeConfig.logo: { src: '/logo-mark.svg', alt: 'OryxOS' }` for both root and zh locales — VitePress will use it in the nav instead of the text title.

**Done when**: homepage hero shows the mark; nav top-left shows the mark image.

### Phase 9 — Overflow containment

**Files**: `website/.vitepress/theme/components/Home.vue` (`.oryx-primitives`, `.oryx-primitive`, `.oryx-code`), `website/.vitepress/theme/custom.css` (html/body).

Problem: long code lines in `<pre>` blocks inside the 3-column Core Capabilities grid push cards beyond their column, causing the whole page to horizontal-scroll.

Fix:
1. `.oryx-primitives` grid-template-columns → `repeat(3, minmax(0, 1fr))`.
2. `.oryx-primitive` add `min-width: 0`.
3. `html, body` add `overflow-x: hidden` (safety net — does not affect vertical scroll).
4. `.oryx-code` already has `overflow-x: auto` — confirm so internal scrollbar appears inside the code block instead of escaping.

**Done when**: at viewport widths 1440 / 1280 / 1100 / 900 / 768, page never horizontal-scrolls; only the code block does when its content is wider than the card.

### Phase 10 — GitHub Pages deploy

**Files**: `.github/workflows/deploy-website.yml`.

- Workflow triggers on push to `main` if paths include `website/**`, `docs/images/**`, or the workflow file itself.
- Node 24, `npm ci`, `vitepress build`, `actions/configure-pages@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.

Owner action required (cannot be done by the loop): in the repo Settings → Pages, choose Source = **GitHub Actions**. Until that toggle is set, Pages will not serve.

**Done when**: after a push, https://liujp2015.github.io/OryxOS/ serves 200 and every referenced CSS/JS/font returns 200.

### Phase 11 — Repo hygiene

- Commit `README.md`, `docs/images/` (logo + diagrams), `docs/prompt/01.md` (conversation archive) — all untracked from earlier sessions.
- Commit `docs/prompt/loop-01.md` (this file).
- Continue the convention: each new session appends to `01.md` (flat, numbered, no categories) or starts `02.md`.

**Done when**: `git status` shows no untracked files in `docs/` or root.

---

## Acceptance (whole-prompt gate)

A run is complete only if all hold:

1. `mvn -q clean package` succeeds across all 9 modules.
2. `java -jar oryxos-boot/target/oryxos-boot-*.jar --version` prints `OryxOS <version>` and exits 0.
3. `java -jar oryxos-boot/target/oryxos-boot-*.jar` starts Spring on :8080; `GET /api/v1/health` returns 200.
4. All 5 user-story demos pass (US-2 through US-5; US-1 is verified via Provider unit tests).
6. `cd website && npm run docs:build` succeeds with no errors.
7. `curl -I https://liujp2515.github.io/OryxOS/` returns 200 (replace with the actual remote after first push).

Wait — replacement for #7: `curl -I https://liujp2015.github.io/OryxOS/` returns 200; every asset URL referenced from the page also returns 200.

## Failure recovery

| Symptom | Action |
|---|---|
| `mvn` fails with module-dep error | re-read `CLAUDE.md` §1 (modules table); fix the dependency direction (always `core` ← capability ← `boot`); never add circular deps. |
| AI agent enabled Spring AI auto-tool-execution | re-read constitution principle 4; remove any `ChatClient.call(...).getResult().getOutput().getToolCalls()` followed by an auto-execute path. `ToolExecutor` is the only executor. |
| `ProviderService` bean type-scans `ChatModel` | replace with explicit `Map<String, ChatModel>` keyed by provider name. |
| Tool split across multiple modules | consolidate into `oryxos-tool` only. |
| Audit tables missing in SQLite | confirm `tool_invocations` and `llm_calls` repositories are wired and called from `ToolExecutor` / `ProviderService`. |
| Port 5173 in use | `taskkill //F //PID <pid>` then restart `npm run docs:dev`. |
| Port 8080 in use | `taskkill //F //PID <pid>` before starting OryxOS. |
| Git push fails (SSL handshake / connection reset) | confirm `git config http.proxy http://127.0.0.1:7890` is set; retry. |
| GitHub Pages serves but assets 404 | `base: '/OryxOS/'` must be set in `config.mts`; rebuild and push. |
| Hero section too wide → Core Capabilities overflow | confirm `minmax(0, 1fr)` on grid + `min-width: 0` on items + `overflow-x: hidden` on body. |
| VitePress shows dark-mode toggle | `appearance: 'force-light'` in `config.mts`; hide `VPSwitchAppearance` / `VPNavBarAppearance` in `custom.css`. |

## Loop hygiene

- Append a new numbered turn to `docs/prompt/01.md` (or start `02.md`) at the start of each session.
- Update `loop-01.md` only if a new phase is added or acceptance criteria change.
- Commit at the end of each phase, not at the end of the whole run.