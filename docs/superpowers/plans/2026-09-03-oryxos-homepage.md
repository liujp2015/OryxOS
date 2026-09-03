# OryxOS Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the OryxOS public marketing homepage as a standalone VitePress site, visually aligned 1:1 with `mq9/website`, deployed independently to GitHub Pages.

**Architecture:** VitePress (Vue SSG) generates static HTML/CSS/JS into `website/.vitepress/dist/`. A dedicated GitHub Actions workflow deploys this to GitHub Pages. The homepage source (`website/`) is decoupled from the runtime (Spring Boot fat JAR) — this is an **owner-authorized deviation from CLAUDE.md §3.2.1** (single-binary deployment principle). Visual assets are **copied** (not symlinked) from `docs/images/` due to Windows compatibility.

**Tech Stack:** Node.js 24, VitePress 1.6.x, Vue 3, plain CSS (no Tailwind/Bootstrap), Google Fonts CDN (Space Grotesk + Inter + JetBrains Mono), GitHub Pages, GitHub Actions

**Spec reference:** `docs/superpowers/specs/2026-09-03-oryxos-homepage-design.md` (owner-approved 2026-09-03 with all defaults)

---

## Global Constraints

The following rules apply to **every** task in this plan. Treat as non-negotiable.

### Constitutional

- **C1.** This plan ships **two artifacts** (homepage on GitHub Pages + runtime fat JAR). Do NOT "fix" this back to single-binary without explicit owner approval — see spec §"Constitution Deviation Notice".
- **C2.** `website/` must build with **zero Maven/JDK references**; `oryxos-*` modules must build with **zero Node.js references**. The two subsystems must remain buildable in isolation.

### Visual

- **V1.** Palette is **pure achromatic**: `#ffffff` background + `#000000` text + 5-step gray (`#f5f5f5`, `#e5e5e5`, `#999999`, `#666666`, `#444444`). No brand color. No gradients. No glassmorphism.
- **V2.** Force light mode: `appearance: 'force-light'` in VitePress config; hide dark-mode toggle via `custom.css`.
- **V3.** Fonts only via Google Fonts CDN: **Space Grotesk** (logo/H1, weight 700), **Inter** (body fallback), **JetBrains Mono** (code). Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`.
- **V4.** Icons are **Unicode emoji only** (🧠 🔌 💾 🗂️ 📬 ⚡ 📦 🤖 ✓ ✗). No icon library.
- **V5.** **No syntax highlighting**. Code blocks are plain `<pre><code>` with monospace font. No Shiki / Prism / highlight.js.
- **V6.** **One animation only**: Hero badge dot `pulse` (CSS keyframes `pulse 2s infinite`). No other animations.
- **V7.** Responsive breakpoints: `@media (max-width: 900px)` for 3-col→1-col, `@media (max-width: 768px)` for 2-col→1-col + padding shrink.

### Structural

- **S1.** All file paths in code use forward slashes.
- **S2.** Line endings: LF. (Set `.gitattributes` if/when git is initialized.)
- **S3.** `website/public/*.svg` are **copies** of `docs/images/*.svg`, NOT symlinks (Windows compatibility — see spec §7.1 default).
- **S4.** VitePress built-in `VPHero` is hidden via `custom.css` (`.VPHero { display: none; }`). The `<Home />` Vue component renders all content.
- **S5.** `cleanUrls: true` in VitePress config (no `.html` suffix on URLs).

### Process

- **P1.** OryxOS repo is **not yet a git repo** (`CLAUDE.md` confirms). The plan assumes owner will run `git init` at Task 1. Until then, "commit" steps in tasks are deferred to the end of each task (code lives on disk only).
- **P2.** **TDD is not strictly applicable** to a static VitePress site. Each task ends with explicit verification steps: build success (`npm run docs:build` exits 0), dev-server smoke test, file-existence check, or visual screenshot — whichever is appropriate for the task.
- **P3.** **Visual fidelity** is verified by side-by-side screenshot comparison with `https://mq9.robustmq.com` at 1440px / 900px / 768px / 375px viewports. Use browser DevTools or a screenshot tool.
- **P4.** **Frequent commits**: each task ends with a `git add` + `git commit` step. If git not yet initialized, this step is a no-op (code on disk only) and noted.

### Out of Scope (do NOT implement in this plan)

- Full documentation site (`/docs/...` REST API reference) — defer to US-5
- Admin console / runtime dashboard
- Blog / changelog / RSS
- i18n (CN/EN) — defer to post-launch
- Analytics integration (e.g. 51.la)
- Giscus comments on homepage
- Search on website
- Custom domain DNS configuration (deferred to owner)
- `.oryxos/` workspace files (`AGENTS.md`, `SOUL.md`, etc.) — separate concern

---

## File Structure (locked in by spec §3.1)

```
oryxos/                                       (repo root)
├── docs/
│   ├── images/                                (source of truth for assets, READ-ONLY)
│   │   ├── logo.svg                           ─┐
│   │   ├── logo-mark.svg                       ├── COPIED into website/public/
│   │   ├── logo-dark.svg                       ─┘
│   │   └── architecture.svg                   ── copied → website/public/architecture.svg
│   └── superpowers/
│       ├── specs/2026-09-03-oryxos-homepage-design.md   (already exists)
│       └── plans/2026-09-03-oryxos-homepage.md          (this file)
│
├── website/                                   (NEW — VitePress project root)
│   ├── package.json                           (Task 1)
│   ├── .gitignore                             (Task 1)
│   ├── index.md                               (Task 6)
│   ├── CNAME                                  (Task 7, placeholder)
│   ├── public/                                (Task 2)
│   │   ├── logo.svg                           ← copy from docs/images/
│   │   ├── logo-mark.svg                       ← copy from docs/images/
│   │   ├── logo-dark.svg                       ← copy from docs/images/
│   │   ├── architecture.svg                   ← copy from docs/images/
│   │   └── favicon.svg                        (Task 2, derived)
│   └── .vitepress/
│       ├── config.mts                         (Task 3)
│       └── theme/
│           ├── index.ts                       (Task 3)
│           ├── custom.css                     (Task 3)
│           └── components/
│               └── Home.vue                   (Tasks 4 + 5)
│
└── .github/
    └── workflows/
        └── deploy-website.yml                 (Task 7)
```

**Total new files**: 13 (matches spec §3.1). **Files modified outside `website/`**: 1 (CLAUDE.md, Task 8).

---

## Task 1: Bootstrap VitePress project

**Files:**
- Create: `website/package.json`
- Create: `website/.gitignore`
- Create: `website/index.md` (placeholder — overwritten in Task 6)

**Goal:** `website/` becomes a buildable VitePress project. `npm run docs:dev` boots without error.

- [ ] **Step 1.1: Create `website/package.json`**

Write the following content to `website/package.json`:

```json
{
  "name": "oryxos-website",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "docs:dev": "vitepress dev",
    "docs:build": "vitepress build",
    "docs:preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.6.4"
  }
}
```

- [ ] **Step 1.2: Create `website/.gitignore`**

```
node_modules/
.vitepress/cache/
.vitepress/dist/
.DS_Store
*.log
```

- [ ] **Step 1.3: Create placeholder `website/index.md`**

```markdown
---
layout: home
title: OryxOS
---

# Bootstrap placeholder

This file will be replaced in Task 6.
```

- [ ] **Step 1.4: Install dependencies**

Run from repo root:

```bash
cd website && npm install
```

Expected output ends with `added N packages` and exit code 0.

- [ ] **Step 1.5: Verify VitePress is callable**

Run from `website/`:

```bash
npx vitepress --version
```

Expected output: `1.6.x` (or matching `^1.6.4` semver). Exit code 0.

- [ ] **Step 1.6: Verify dev server boots**

Run from `website/` in background:

```bash
npm run docs:dev -- --port 5173 &
sleep 8
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```

Expected output: `200`. Then kill the dev server: `pkill -f "vitepress dev"` (or Ctrl+C if foreground).

- [ ] **Step 1.7: Commit (deferred if git not initialized)**

```bash
git add website/package.json website/.gitignore website/index.md
git commit -m "feat(website): bootstrap VitePress project"
```

If OryxOS is not yet a git repo, skip this step and note in commit log; owner will batch-commit later.

---

## Task 2: Copy static assets + derive favicon

**Files:**
- Create: `website/public/logo.svg` (copy of `docs/images/logo.svg`)
- Create: `website/public/logo-mark.svg` (copy of `docs/images/logo-mark.svg`)
- Create: `website/public/logo-dark.svg` (copy of `docs/images/logo-dark.svg`)
- Create: `website/public/architecture.svg` (copy of `docs/images/architecture.svg`)
- Create: `website/public/favicon.svg` (NEW, derived from `logo-mark.svg`)

**Goal:** All 5 asset files exist in `website/public/` and render in browser without 404.

- [ ] **Step 2.1: Create `website/public/` directory**

```bash
mkdir -p website/public
```

- [ ] **Step 2.2: Copy the 4 source SVG assets**

```bash
cp docs/images/logo.svg         website/public/logo.svg
cp docs/images/logo-mark.svg    website/public/logo-mark.svg
cp docs/images/logo-dark.svg    website/public/logo-dark.svg
cp docs/images/architecture.svg website/public/architecture.svg
```

- [ ] **Step 2.3: Verify copies exist and have non-zero size**

```bash
ls -la website/public/*.svg
```

Expected: 5 files listed (4 just copied + favicon.svg from next step), each with size > 100 bytes.

- [ ] **Step 2.4: Read `logo-mark.svg` to derive favicon**

```bash
cat docs/images/logo-mark.svg
```

Take note of:
- Root `<svg>` tag's `viewBox` attribute (e.g. `viewBox="0 0 100 100"`)
- `<path>` / inner elements (the actual mark shape)

- [ ] **Step 2.5: Create `website/public/favicon.svg`**

Write a self-contained favicon SVG using the same `viewBox` and inner shape as `logo-mark.svg`, with these adjustments:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="<PASTE viewBox FROM logo-mark.svg>" fill="none">
  <!-- Paste the inner <path>/<g>/<rect>/etc. elements from logo-mark.svg here -->
</svg>
```

Notes:
- Keep `fill="none"` only if the source uses `fill="none"` and sets fills on inner elements
- Do not add `<title>` or `<desc>` (favicons should be lean)
- Do not add `width`/`height` attributes (let the browser scale)

- [ ] **Step 2.6: Verify favicon renders**

Open `website/public/favicon.svg` in browser at `file:///E:/VibeCoding/OryxOS/website/public/favicon.svg`. Confirm:
- The mark shape is visible
- No "broken image" icon
- File size < 5 KB (favicons should be tiny)

- [ ] **Step 2.7: Commit**

```bash
git add website/public/
git commit -m "feat(website): copy logo + architecture assets, derive favicon"
```

---

## Task 3: VitePress config + theme scaffolding

**Files:**
- Create: `website/.vitepress/config.mts`
- Create: `website/.vitepress/theme/index.ts`
- Create: `website/.vitepress/theme/custom.css`

**Goal:** VitePress boots with OryxOS branding, force-light mode, Google Fonts preconnect, VPHero hidden. Homepage `index.md` still uses placeholder from Task 1.

- [ ] **Step 3.1: Create `website/.vitepress/config.mts`**

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OryxOS',
  description: 'Enterprise-Controlled, Java-Native, Privately-Auditable Agent Runtime.',
  lang: 'en-US',
  cleanUrls: true,
  appearance: 'force-light',

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap'
    }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { property: 'og:title', content: 'OryxOS — Enterprise Agent Runtime' }],
    ['meta', { property: 'og:description', content: 'A unified runtime for AI Agents in Java. Spring Boot 3.x, single binary, fully auditable.' }],
    ['meta', { property: 'og:type', content: 'website' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'GitHub', link: 'https://github.com/<OWNER>/OryxOS' },
    ],
    sidebar: [],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/<OWNER>/OryxOS' },
    ],
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright © 2026 OryxOS Authors',
    },
  },
})
```

Replace `<OWNER>` with the actual GitHub org/user (e.g. `robustmq` if owner publishes under the same org as mq9 — owner to confirm). **If unknown**, leave as `<OWNER>` and Task 8 will pause for owner input.

- [ ] **Step 3.2: Create `website/.vitepress/theme/index.ts`**

```ts
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Home from './components/Home.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Home', Home)
  },
}
```

- [ ] **Step 3.3: Create `website/.vitepress/theme/custom.css`**

```css
/* OryxOS brand tokens — pure achromatic per spec V1 */
:root {
  --oryx-bg: #ffffff;
  --oryx-text-1: #000000;
  --oryx-text-2: #444444;
  --oryx-text-3: #666666;
  --oryx-text-4: #999999;
  --oryx-border: #e5e5e5;
  --oryx-bg-soft: #f5f5f5;
  --oryx-bg-card: #fafafa;

  --oryx-font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  --oryx-font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --oryx-font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
}

/* Force light — hide dark-mode switcher per spec V2 */
.VPNavBarAppearance,
.VPSwitchAppearance,
.VPSidebarItem.collapsible .caret {
  display: none !important;
}

/* Hide VitePress built-in VPHero — Home.vue renders its own per spec S4 */
.VPHero,
.VPFeature {
  display: none !important;
}

/* Base typography */
body {
  font-family: var(--oryx-font-body);
  color: var(--oryx-text-1);
  background: var(--oryx-bg);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--oryx-font-display);
  font-weight: 700;
  color: var(--oryx-text-1);
  letter-spacing: -0.02em;
}

code, pre {
  font-family: var(--oryx-font-mono);
}
```

- [ ] **Step 3.4: Verify dev server boots with config**

```bash
cd website
npm run docs:dev -- --port 5173 &
sleep 8
curl -s http://localhost:5173/ | grep -E "(OryxOS|VPHero|404)" || echo "no matches found"
pkill -f "vitepress dev"
```

Expected output:
- Page returns HTML containing `OryxOS` (from config title)
- No `404` markers
- The `VPHero` CSS rule hides the built-in hero (verified visually in Task 4)

- [ ] **Step 3.5: Verify Google Fonts load**

Open `http://localhost:5173/` in browser, open DevTools → Network → filter by `font`. Expected: requests to `fonts.googleapis.com` and `fonts.gstatic.com` return 200, with `Space Grotesk`, `Inter`, `JetBrains Mono` files visible.

- [ ] **Step 3.6: Commit**

```bash
git add website/.vitepress/
git commit -m "feat(website): add VitePress config, theme, and brand tokens"
```

---

## Task 4: Home.vue structure (template + scoped CSS)

**Files:**
- Create: `website/.vitepress/theme/components/Home.vue`

**Goal:** All 8 sections render in dev server with placeholder copy. Visual structure matches mq9 1:1. Real copy filled in Task 5.

**Sections** (per spec §4, in document order):
1. Hero
2. Problem
3. Flow Diagram
4. Core Capabilities (3 cards)
5. Scenarios (8 cards)
6. SDK/Integration (3 cards)
7. Protocol (3 groups)
8. CTA

- [ ] **Step 4.1: Create `website/.vitepress/theme/components/Home.vue` with template structure**

Write the full file (see code block below). The template is the section structure; `<style scoped>` is the scoped CSS. Copy (in `computed` arrays) is intentionally **placeholder text** (`TODO copy`) — replaced in Task 5.

```vue
<script setup lang="ts">
import { computed } from 'vue'

// Section copy — placeholder. Real copy in Task 5 per spec §5.
const capabilities = computed(() => [
  { id: 'react', icon: '🧠', title: 'TODO', subtitle: 'TODO', code: '// TODO' },
  { id: 'provider', icon: '🔌', title: 'TODO', subtitle: 'TODO', code: '// TODO' },
  { id: 'memory', icon: '💾', title: 'TODO', subtitle: 'TODO', code: '// TODO' },
])

const scenarios = computed(() => [
  { num: '01', title: 'TODO', desc: 'TODO' },
  { num: '02', title: 'TODO', desc: 'TODO' },
  { num: '03', title: 'TODO', desc: 'TODO' },
  { num: '04', title: 'TODO', desc: 'TODO' },
  { num: '05', title: 'TODO', desc: 'TODO' },
  { num: '06', title: 'TODO', desc: 'TODO' },
  { num: '07', title: 'TODO', desc: 'TODO' },
  { num: '08', title: 'TODO', desc: 'TODO' },
])

const sdkCards = computed(() => [
  { id: 'spring', icon: '🔌', title: 'TODO', desc: 'TODO', tags: ['TODO'] },
  { id: 'mcp', icon: '📦', title: 'TODO', desc: 'TODO', tags: ['TODO'] },
  { id: 'skill', icon: '🤖', title: 'TODO', desc: 'TODO', tags: ['TODO'] },
])

const protocolGroups = computed(() => [
  { title: 'TODO', rows: [{ subject: 'TODO', desc: 'TODO' }, { subject: 'TODO', desc: 'TODO' }] },
  { title: 'TODO', rows: [{ subject: 'TODO', desc: 'TODO' }, { subject: 'TODO', desc: 'TODO' }] },
  { title: 'TODO', rows: [{ subject: 'TODO', desc: 'TODO' }, { subject: 'TODO', desc: 'TODO' }] },
])
</script>

<template>
  <!-- ============== HERO ============== -->
  <section class="oryx-hero">
    <div class="oryx-hero-inner">
      <div class="oryx-badge">
        <span class="oryx-badge-dot"></span>
        TODO badge
      </div>
      <h1 class="oryx-title">
        <span class="oryx-title-name">TODO</span>
      </h1>
      <p class="oryx-title-sub">TODO</p>
      <p class="oryx-hero-desc">TODO</p>
      <div class="oryx-hero-actions">
        <a class="oryx-btn-primary" href="/docs/">Get Started →</a>
        <a class="oryx-btn-ghost" href="/docs/protocol">Protocol Spec</a>
        <a class="oryx-btn-ghost" href="https://github.com/<OWNER>/OryxOS" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div class="oryx-hero-note">TODO</div>
    </div>
  </section>

  <!-- ============== PROBLEM ============== -->
  <section class="oryx-section">
    <div class="oryx-section-inner">
      <div class="oryx-section-head">
        <div class="oryx-tag">TODO</div>
        <h2 class="oryx-section-title">TODO</h2>
        <p class="oryx-section-lead">TODO</p>
      </div>
      <div class="oryx-problem">
        <div class="oryx-problem-text">
          <div class="oryx-question">
            <h3>TODO</h3>
            <p>TODO</p>
          </div>
          <div class="oryx-question">
            <h3>TODO</h3>
            <p>TODO</p>
          </div>
          <p class="oryx-summary">TODO</p>
        </div>
        <div class="oryx-compare">
          <div class="oryx-compare-col">
            <div class="oryx-compare-label">Today ✗</div>
            <div class="oryx-compare-item oryx-compare-bad">TODO</div>
            <div class="oryx-compare-item oryx-compare-bad">TODO</div>
            <div class="oryx-compare-item oryx-compare-bad">TODO</div>
            <div class="oryx-compare-item oryx-compare-bad">TODO</div>
          </div>
          <div class="oryx-compare-col">
            <div class="oryx-compare-label">OryxOS ✓</div>
            <div class="oryx-compare-item oryx-compare-good">TODO</div>
            <div class="oryx-compare-item oryx-compare-good">TODO</div>
            <div class="oryx-compare-item oryx-compare-good">TODO</div>
            <div class="oryx-compare-item oryx-compare-good">TODO</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== FLOW DIAGRAM ============== -->
  <section class="oryx-flow-section">
    <div class="oryx-section-inner">
      <img src="/architecture.svg" alt="OryxOS architecture" class="oryx-flow-img" />
    </div>
  </section>

  <!-- ============== CORE CAPABILITIES ============== -->
  <section class="oryx-section oryx-primitives-section">
    <div class="oryx-section-inner">
      <div class="oryx-section-head">
        <div class="oryx-tag">Core Capabilities</div>
        <h2 class="oryx-section-title">TODO</h2>
      </div>
      <div class="oryx-primitives">
        <div v-for="p in capabilities" :key="p.id" class="oryx-primitive">
          <div class="oryx-primitive-header">
            <span class="oryx-primitive-icon">{{ p.icon }}</span>
            <div>
              <h3 class="oryx-primitive-title">{{ p.title }}</h3>
              <p class="oryx-primitive-subtitle">{{ p.subtitle }}</p>
            </div>
          </div>
          <pre class="oryx-code"><code>{{ p.code }}</code></pre>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== SCENARIOS ============== -->
  <section class="oryx-section">
    <div class="oryx-section-inner">
      <div class="oryx-section-head">
        <div class="oryx-tag">Real Scenarios</div>
        <h2 class="oryx-section-title">TODO</h2>
      </div>
      <div class="oryx-scenarios">
        <div v-for="s in scenarios" :key="s.num" class="oryx-scenario">
          <div class="oryx-scenario-num">{{ s.num }}</div>
          <h3 class="oryx-scenario-title">{{ s.title }}</h3>
          <p class="oryx-scenario-desc">{{ s.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== SDK / INTEGRATION ============== -->
  <section class="oryx-section oryx-sdk-section">
    <div class="oryx-section-inner">
      <div class="oryx-section-head">
        <div class="oryx-tag">Integration</div>
        <h2 class="oryx-section-title">TODO</h2>
      </div>
      <div class="oryx-sdk-cards">
        <div v-for="c in sdkCards" :key="c.id" class="oryx-sdk-card" :class="{ 'oryx-sdk-card-featured': c.id === 'mcp' }">
          <div class="oryx-sdk-card-header">
            <span class="oryx-sdk-card-icon">{{ c.icon }}</span>
            <h3 class="oryx-sdk-card-title">{{ c.title }}</h3>
          </div>
          <p class="oryx-sdk-card-desc">{{ c.desc }}</p>
          <div class="oryx-sdk-tags">
            <span v-for="t in c.tags" :key="t" class="oryx-tag-chip">{{ t }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== PROTOCOL ============== -->
  <section class="oryx-section">
    <div class="oryx-section-inner">
      <div class="oryx-section-head">
        <div class="oryx-tag">Protocol</div>
        <h2 class="oryx-section-title">TODO</h2>
        <p class="oryx-section-lead">TODO</p>
      </div>
      <div class="oryx-proto-grid">
        <div v-for="(g, gi) in protocolGroups" :key="gi" class="oryx-proto-group">
          <h3 class="oryx-proto-group-title">{{ g.title }}</h3>
          <div v-for="(r, ri) in g.rows" :key="ri" class="oryx-proto-row">
            <code class="oryx-proto-subject">{{ r.subject }}</code>
            <span class="oryx-proto-arrow">→</span>
            <span class="oryx-proto-desc">{{ r.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============== CTA ============== -->
  <section class="oryx-section oryx-cta-section">
    <div class="oryx-section-inner">
      <div class="oryx-cta">
        <h2 class="oryx-cta-title">TODO</h2>
        <p class="oryx-cta-desc">TODO</p>
        <pre class="oryx-code oryx-cta-code"><code>// TODO</code></pre>
        <div class="oryx-cta-links">
          <a class="oryx-btn-primary" href="/docs/">Read the Docs →</a>
          <a class="oryx-btn-ghost" href="https://github.com/<OWNER>/OryxOS" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* === HERO === */
.oryx-hero {
  padding: 120px 24px 80px;
  background: var(--oryx-bg);
  text-align: center;
}
.oryx-hero-inner {
  max-width: 960px;
  margin: 0 auto;
}
.oryx-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid var(--oryx-border);
  border-radius: 999px;
  font-size: 13px;
  color: var(--oryx-text-2);
  margin-bottom: 32px;
}
.oryx-badge-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--oryx-text-1);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(1.4); }
}
.oryx-title {
  margin: 0;
}
.oryx-title-name {
  font-size: clamp(72px, 14vw, 120px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}
.oryx-title-sub {
  margin: 24px 0 16px;
  font-size: clamp(20px, 3vw, 28px);
  color: var(--oryx-text-2);
  font-weight: 500;
}
.oryx-hero-desc {
  max-width: 720px;
  margin: 0 auto 40px;
  font-size: 16px;
  color: var(--oryx-text-3);
  line-height: 1.7;
}
.oryx-hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.oryx-btn-primary {
  display: inline-block;
  padding: 12px 24px;
  background: var(--oryx-text-1);
  color: var(--oryx-bg);
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  font-size: 15px;
  transition: opacity 0.15s;
}
.oryx-btn-primary:hover {
  opacity: 0.85;
}
.oryx-btn-ghost {
  display: inline-block;
  padding: 12px 24px;
  background: var(--oryx-bg);
  color: var(--oryx-text-1);
  border: 1px solid var(--oryx-border);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  font-size: 15px;
  transition: border-color 0.15s;
}
.oryx-btn-ghost:hover {
  border-color: var(--oryx-text-1);
}
.oryx-hero-note {
  font-size: 12px;
  color: var(--oryx-text-4);
  margin-top: 16px;
}

/* === SECTIONS (generic) === */
.oryx-section {
  padding: 80px 24px;
}
.oryx-section-inner {
  max-width: 1120px;
  margin: 0 auto;
}
.oryx-section-head {
  text-align: center;
  margin-bottom: 56px;
}
.oryx-tag {
  display: inline-block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--oryx-text-3);
  margin-bottom: 12px;
  font-weight: 500;
}
.oryx-section-title {
  font-size: clamp(22px, 4vw, 32px);
  margin: 0 0 16px;
  font-weight: 700;
}
.oryx-section-lead {
  max-width: 720px;
  margin: 0 auto;
  color: var(--oryx-text-3);
  font-size: 16px;
  line-height: 1.7;
}

/* === PROBLEM === */
.oryx-problem {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}
.oryx-question {
  margin-bottom: 24px;
}
.oryx-question h3 {
  font-size: 18px;
  margin: 0 0 8px;
  font-weight: 600;
}
.oryx-question p {
  color: var(--oryx-text-3);
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
}
.oryx-summary {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--oryx-border);
  font-weight: 500;
  color: var(--oryx-text-1);
}
.oryx-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.oryx-compare-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.oryx-compare-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.oryx-compare-item {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}
.oryx-compare-bad {
  background: var(--oryx-bg-soft);
  color: var(--oryx-text-2);
  border-left: 3px solid var(--oryx-text-4);
}
.oryx-compare-good {
  background: var(--oryx-bg-soft);
  color: var(--oryx-text-1);
  border-left: 3px solid var(--oryx-text-1);
  font-weight: 500;
}

/* === FLOW DIAGRAM === */
.oryx-flow-section {
  padding: 0 24px 80px;
}
.oryx-flow-img {
  width: 100%;
  max-width: 1120px;
  display: block;
  margin: 0 auto;
  border: 1px solid var(--oryx-border);
  border-radius: 12px;
}

/* === CORE CAPABILITIES === */
.oryx-primitives-section {
  background: var(--oryx-bg-soft);
}
.oryx-primitives {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.oryx-primitive {
  background: var(--oryx-bg);
  border: 1px solid var(--oryx-border);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.oryx-primitive:hover {
  border-color: var(--oryx-text-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.oryx-primitive-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.oryx-primitive-icon {
  font-size: 24px;
  line-height: 1;
}
.oryx-primitive-title {
  font-size: 17px;
  margin: 0 0 4px;
  font-weight: 700;
}
.oryx-primitive-subtitle {
  font-size: 13px;
  color: var(--oryx-text-3);
  margin: 0;
  line-height: 1.5;
}
.oryx-code {
  background: var(--oryx-bg-card);
  border: 1px solid var(--oryx-border);
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0;
  color: var(--oryx-text-1);
}

/* === SCENARIOS === */
.oryx-scenarios {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}
.oryx-scenario {
  position: relative;
  padding-top: 16px;
}
.oryx-scenario-num {
  font-size: 28px;
  font-weight: 900;
  color: var(--oryx-border);
  line-height: 1;
  margin-bottom: 12px;
}
.oryx-scenario-title {
  font-size: 17px;
  margin: 0 0 8px;
  font-weight: 700;
}
.oryx-scenario-desc {
  font-size: 14px;
  color: var(--oryx-text-3);
  margin: 0;
  line-height: 1.7;
}

/* === SDK === */
.oryx-sdk-section {
  background: var(--oryx-bg-soft);
}
.oryx-sdk-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.oryx-sdk-card {
  background: var(--oryx-bg);
  border: 1px solid var(--oryx-border);
  border-radius: 12px;
  padding: 24px;
}
.oryx-sdk-card-featured {
  border-color: var(--oryx-text-1);
}
.oryx-sdk-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.oryx-sdk-card-icon {
  font-size: 24px;
}
.oryx-sdk-card-title {
  font-size: 17px;
  margin: 0;
  font-weight: 700;
}
.oryx-sdk-card-desc {
  font-size: 14px;
  color: var(--oryx-text-3);
  margin: 0 0 16px;
  line-height: 1.7;
}
.oryx-sdk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.oryx-tag-chip {
  display: inline-block;
  padding: 4px 10px;
  background: var(--oryx-bg-soft);
  border: 1px solid var(--oryx-border);
  border-radius: 999px;
  font-size: 12px;
  color: var(--oryx-text-2);
}

/* === PROTOCOL === */
.oryx-proto-grid {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.oryx-proto-group-title {
  font-size: 18px;
  margin: 0 0 16px;
  font-weight: 700;
}
.oryx-proto-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--oryx-bg-soft);
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.oryx-proto-subject {
  font-family: var(--oryx-font-mono);
  background: var(--oryx-bg-card);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--oryx-text-1);
  font-weight: 500;
}
.oryx-proto-arrow {
  color: var(--oryx-text-4);
  font-family: var(--oryx-font-mono);
}
.oryx-proto-desc {
  color: var(--oryx-text-2);
  flex: 1;
}

/* === CTA === */
.oryx-cta-section {
  background: var(--oryx-bg-soft);
}
.oryx-cta {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}
.oryx-cta-title {
  font-size: 28px;
  margin: 0 0 12px;
  font-weight: 700;
}
.oryx-cta-desc {
  color: var(--oryx-text-3);
  margin: 0 0 32px;
  font-size: 16px;
}
.oryx-cta-code {
  text-align: left;
  margin-bottom: 32px;
}
.oryx-cta-links {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* === RESPONSIVE per spec V7 === */
@media (max-width: 900px) {
  .oryx-sdk-cards {
    grid-template-columns: 1fr;
  }
  .oryx-primitives {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .oryx-hero {
    padding: 72px 20px 60px;
  }
  .oryx-section {
    padding: 48px 20px;
  }
  .oryx-problem {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .oryx-scenarios {
    grid-template-columns: 1fr;
  }
  .oryx-compare {
    grid-template-columns: 1fr;
  }
  .oryx-flow-section {
    padding: 0 20px 60px;
  }
}
</style>
```

- [ ] **Step 4.2: Verify dev server renders Home.vue**

```bash
cd website
npm run docs:dev -- --port 5173 &
sleep 8
curl -s http://localhost:5173/ | grep -E "(oryx-hero|oryx-section|oryx-primitive|oryx-scenario)" | head -5
pkill -f "vitepress dev"
```

Expected output: HTML containing class names like `oryx-hero`, `oryx-section`, `oryx-primitive`, etc. If empty, check browser console for Vue errors.

- [ ] **Step 4.3: Visual smoke test at 1440px**

Open `http://localhost:5173/` in browser. Set DevTools to 1440px wide. Confirm visually:
- Hero section centered, large title visible
- 8 sections render top-to-bottom in order
- 3 capability cards in a row
- 8 scenario cards in a 2-column grid
- 3 SDK cards in a row, middle one has black border (featured)
- 3 protocol groups, each with multiple rows
- CTA at bottom

Take screenshot, save to `docs/superpowers/plans/screenshots/task-4-1440.png` (create directory if needed).

- [ ] **Step 4.4: Visual smoke test at 768px**

Same as Step 4.3 but at 768px wide. Confirm:
- Hero padding shrinks
- All multi-column grids become single column
- No horizontal scroll

Save screenshot to `docs/superpowers/plans/screenshots/task-4-768.png`.

- [ ] **Step 4.5: Commit**

```bash
git add website/.vitepress/theme/components/Home.vue docs/superpowers/plans/screenshots/
git commit -m "feat(website): scaffold Home.vue with 8 sections (placeholder copy)"
```

---

## Task 5: Fill in Home.vue copy per spec §5

**Files:**
- Modify: `website/.vitepress/theme/components/Home.vue` (replace placeholder copy in `<script setup>` and template)

**Goal:** All copy reads as OryxOS-specific messaging, not mq9. Matches spec §5 exactly.

- [ ] **Step 5.1: Replace Hero section copy**

In `Home.vue`, find the HERO `<section>` block and replace `TODO` placeholders. Final copy (per spec §5.1):

```html
<!-- HERO -->
<section class="oryx-hero">
  <div class="oryx-hero-inner">
    <div class="oryx-badge">
      <span class="oryx-badge-dot"></span>
      Enterprise Agent OS · Java Native · Private &amp; Auditable
    </div>
    <h1 class="oryx-title">
      <span class="oryx-title-name">OryxOS</span>
    </h1>
    <p class="oryx-title-sub">A unified runtime for AI Agents in Java</p>
    <p class="oryx-hero-desc">
      OryxOS is the Agent runtime enterprises control — built on Spring Boot 3.x
      and JDK 21, deployed as a single binary, fully auditable. Replace fragile
      Agent stacks with one runtime your platform team owns.
    </p>
    <div class="oryx-hero-actions">
      <a class="oryx-btn-primary" href="/docs/">Get Started →</a>
      <a class="oryx-btn-ghost" href="/docs/protocol">Protocol Spec</a>
      <a class="oryx-btn-ghost" href="https://github.com/<OWNER>/OryxOS" target="_blank" rel="noopener">GitHub</a>
    </div>
    <div class="oryx-hero-note">
      Spring Boot 3.x · JDK 21 virtual threads · MCP Protocol · SKILL.md · SQLite · JPA
    </div>
  </div>
</section>
```

- [ ] **Step 5.2: Replace Problem section copy**

Find the PROBLEM `<section>` block. Final copy (per spec §5.2):

```html
<!-- PROBLEM -->
<section class="oryx-section">
  <div class="oryx-section-inner">
    <div class="oryx-section-head">
      <div class="oryx-tag">Enterprise Reality</div>
      <h2 class="oryx-section-title">Two Foundational Problems for Enterprise Agents</h2>
      <p class="oryx-section-lead">
        Every Agent stack in production encounters the same two foundational problems.
      </p>
    </div>
    <div class="oryx-problem">
      <div class="oryx-problem-text">
        <div class="oryx-question">
          <h3>How do you govern and audit what your Agents do?</h3>
          <p>Compliance, traceability, and policy enforcement are non-negotiable.</p>
        </div>
        <div class="oryx-question">
          <h3>How do you make Agents reliable under load?</h3>
          <p>LLM calls fail, tools time out, sessions crash. Production needs retries, resumability, and observability — not demos.</p>
        </div>
        <p class="oryx-summary">
          OryxOS solves exactly these two problems, so your platform team owns the runtime instead of stitching together fragile Agent stacks.
        </p>
      </div>
      <div class="oryx-compare">
        <div class="oryx-compare-col">
          <div class="oryx-compare-label">Today ✗</div>
          <div class="oryx-compare-item oryx-compare-bad">LangChain + custom glue code</div>
          <div class="oryx-compare-item oryx-compare-bad">No unified audit trail</div>
          <div class="oryx-compare-item oryx-compare-bad">Tool calls and LLM calls fail silently</div>
          <div class="oryx-compare-item oryx-compare-bad">Each team rebuilds governance</div>
        </div>
        <div class="oryx-compare-col">
          <div class="oryx-compare-label">OryxOS ✓</div>
          <div class="oryx-compare-item oryx-compare-good">One runtime, one binary, one team that owns it</div>
          <div class="oryx-compare-item oryx-compare-good">Every tool call and LLM call persisted to SQLite</div>
          <div class="oryx-compare-item oryx-compare-good">ReAct loop with retry, resume, MAX_ITERATIONS</div>
          <div class="oryx-compare-item oryx-compare-good">Provider abstraction, Tool Registry, Memory tiers built-in</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 5.3: Replace Core Capabilities copy in `<script setup>`**

In `Home.vue`, replace the `capabilities` computed:

```ts
const capabilities = computed(() => [
  {
    id: 'react',
    icon: '🧠',
    title: 'ReAct Loop',
    subtitle: 'Self-implemented cycle · MAX_ITERATIONS guard · resumable',
    code: `// ReAct loop — fully under your control
while (iterations < MAX_ITERATIONS) {
  Thought   = llm.think(messages, tools)
  Action    = parseToolCall(Thought)
  if (!Action) return Thought           // final answer
  Observation = tool.execute(Action)
  messages.append(Thought, Observation)
  iterations++
}`,
  },
  {
    id: 'provider',
    icon: '🔌',
    title: 'Provider Abstraction',
    subtitle: 'Spring AI Alibaba · explicit name→ChatModel map · no auto-tool execution',
    code: `// Provider registry — explicit, not type-scanned
@Service
class ProviderService {
  private Map<String, ChatModel> models = Map.of(
    "qwen-max",    qwenMaxModel,
    "deepseek-v3", deepseekModel
  );
  ChatResponse chat(String providerName, List<Message> msgs) {
    return models.get(providerName).call(msgs);
  }
}`,
  },
  {
    id: 'memory',
    icon: '💾',
    title: 'Three-tier Memory',
    subtitle: 'Session + Long-term · MEMORY.md file · unified facade',
    code: `// One facade for all memory tiers
@Service
class MemoryService {
  void remember(Session s, String key, String value) {
    sessionMemory.put(s, key, value);    // tier 1: in-session
    longTermMemory.put(s.userId, key, value);  // tier 2: across sessions
    memoryMdFile.append(s, key, value);  // tier 3: human-readable
  }
}`,
  },
])
```

- [ ] **Step 5.4: Replace Scenarios copy in `<script setup>`**

Replace the `scenarios` computed (8 entries per spec §5.4):

```ts
const scenarios = computed(() => [
  { num: '01', title: 'Sub-Agent result delivery', desc: 'Sub-Agents write results to orchestrator\'s session. Orchestrator FETCHes when ready — no blocking, no shared state.' },
  { num: '02', title: 'Multi-worker competing tool queue', desc: 'Workers share a queue name — runtime guarantees each task goes to exactly one worker. Workers join or leave freely.' },
  { num: '03', title: 'Tool capability discovery', desc: 'Tools REGISTER capability descriptions. Agents DISCOVER by intent, then invoke directly.' },
  { num: '04', title: 'Cloud-to-edge command delivery', desc: 'Control plane publishes commands to edge mailbox. Messages persist during outage; on reconnect, Agent resumes from offset.' },
  { num: '05', title: 'Human-in-the-loop approval', desc: 'Agent sends to approvals queue. Human reviews, replies — same protocol for both human and Agent.' },
  { num: '06', title: 'Async Request-Reply', desc: 'Agent A creates a private reply session, includes reply_to. Agent B sends results there. A fetches when ready — no blocking.' },
  { num: '07', title: 'Plugin Tool registration and health tracking', desc: 'Plugin Tools REGISTER at startup, REPORT periodically, UNREGISTER at shutdown. Agents discover live tools.' },
  { num: '08', title: 'Audit broadcasting', desc: 'All tool calls and LLM calls broadcast to audit subscribers. Compliance team sees everything, even if Agents are offline.' },
])
```

- [ ] **Step 5.5: Replace SDK/Integration copy in `<script setup>`**

Replace the `sdkCards` computed (per spec §5.5):

```ts
const sdkCards = computed(() => [
  {
    id: 'spring',
    icon: '🔌',
    title: 'Native Spring AI',
    desc: 'OryxOS uses Spring AI\'s Provider and @Tool schema — but disables auto-tool execution. You stay in control of the ReAct loop.',
    tags: ['Spring AI', 'JDK 21', 'Virtual Threads'],
  },
  {
    id: 'mcp',
    icon: '📦',
    title: 'MCP Protocol',
    desc: 'First-class MCP Java SDK client. Discover and invoke any MCP server tool via stdio transport. Drop in any community MCP server.',
    tags: ['MCP', 'stdio', 'Plugin'],
  },
  {
    id: 'skill',
    icon: '🤖',
    title: 'SKILL.md',
    desc: 'Drop a SKILL.md file into .oryxos/skills/ and your Agent picks it up. Zero code plugin authoring — the simplest way to extend.',
    tags: ['SKILL.md', 'Zero-code', 'Plugin Tool'],
  },
])
```

- [ ] **Step 5.6: Replace Protocol section copy**

In the template PROTOCOL `<section>` block, replace `TODO` placeholders. Per spec §7.2 default, mark all entries with `[Planned — US-5]`:

```html
<!-- PROTOCOL -->
<section class="oryx-section">
  <div class="oryx-section-inner">
    <div class="oryx-section-head">
      <div class="oryx-tag">Protocol</div>
      <h2 class="oryx-section-title">Complete Agent Runtime Protocol</h2>
      <p class="oryx-section-lead">
        Public REST API surface (planned in US-5 — current status: <strong>draft</strong>).
        Every endpoint is authenticated, audited, and observable.
      </p>
    </div>
    <div class="oryx-proto-grid">
      <div class="oryx-proto-group">
        <h3 class="oryx-proto-group-title">Agent Lifecycle</h3>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">POST /api/agent/chat</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Send a message; runs ReAct loop until final answer or MAX_ITERATIONS [Planned — US-5]</span>
        </div>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">GET /api/sessions/{id}</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Retrieve session state and message history [Planned — US-5]</span>
        </div>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">DELETE /api/sessions/{id}</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Close session and persist to long-term memory [Planned — US-5]</span>
        </div>
      </div>
      <div class="oryx-proto-group">
        <h3 class="oryx-proto-group-title">Tools &amp; Plugins</h3>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">GET /api/tools</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">List registered Tools (built-in + plugin + MCP) [Planned — US-5]</span>
        </div>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">POST /api/tools/{name}/invoke</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Invoke a Tool by name with sandbox check [Planned — US-5]</span>
        </div>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">POST /api/skills</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Hot-reload a SKILL.md into the Tool Registry [Planned — US-5]</span>
        </div>
      </div>
      <div class="oryx-proto-group">
        <h3 class="oryx-proto-group-title">Observability</h3>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">GET /api/audit/tool-invocations</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Query tool_invocations table (SQLite-backed) [Planned — US-5]</span>
        </div>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">GET /api/audit/llm-calls</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Query llm_calls table — every prompt and response [Planned — US-5]</span>
        </div>
        <div class="oryx-proto-row">
          <code class="oryx-proto-subject">GET /api/health</code>
          <span class="oryx-proto-arrow">→</span>
          <span class="oryx-proto-desc">Liveness probe — runtime, providers, DB connectivity [Planned — US-5]</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

Remove the now-unused `protocolGroups` computed from `<script setup>`.

- [ ] **Step 5.7: Replace CTA section copy**

Find the CTA `<section>` block. Final copy (per spec §5.7):

```html
<!-- CTA -->
<section class="oryx-section oryx-cta-section">
  <div class="oryx-section-inner">
    <div class="oryx-cta">
      <h2 class="oryx-cta-title">Start Building</h2>
      <p class="oryx-cta-desc">Clone the repo, run one command, send your first Agent message.</p>
      <pre class="oryx-code oryx-cta-code"><code># Clone and run
git clone https://github.com/&lt;OWNER&gt;/OryxOS
cd OryxOS
./mvnw spring-boot:run

# In another terminal — send your first Agent message
curl -X POST http://localhost:8080/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"Hello, OryxOS"}'</code></pre>
      <div class="oryx-cta-links">
        <a class="oryx-btn-primary" href="/docs/">Read the Docs →</a>
        <a class="oryx-btn-ghost" href="https://github.com/&lt;OWNER&gt;/OryxOS" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 5.8: Verify all TODO placeholders removed**

```bash
grep -n "TODO" website/.vitepress/theme/components/Home.vue
```

Expected output: **empty** (no matches). If anything matches, fix the remaining placeholder.

- [ ] **Step 5.9: Visual verify at 1440px**

Open `http://localhost:5173/` (with dev server running) at 1440px. Confirm:
- All copy reads as OryxOS-specific messaging (not mq9)
- No `TODO` text visible anywhere
- All 8 sections fully populated
- Compare side-by-side with `https://mq9.robustmq.com` for visual fidelity

Save screenshot to `docs/superpowers/plans/screenshots/task-5-1440.png`.

- [ ] **Step 5.10: Commit**

```bash
git add website/.vitepress/theme/components/Home.vue
git commit -m "feat(website): replace placeholder copy with OryxOS messaging"
```

---

## Task 6: Homepage entry page + first end-to-end visual verification

**Files:**
- Modify: `website/index.md` (replace bootstrap placeholder with real entry)

**Goal:** `http://localhost:5173/` (and ultimately `/` on GH Pages) renders the full OryxOS homepage. Visual parity with mq9 confirmed at 4 viewports.

- [ ] **Step 6.1: Replace `website/index.md` with real entry**

```markdown
---
layout: home
title: OryxOS — Enterprise Agent Runtime
description: A unified runtime for AI Agents in Java. Spring Boot 3.x, single binary, fully auditable.
head:
  - - meta
    - property: og:title
      content: OryxOS — Enterprise Agent Runtime
  - - meta
    - property: og:description
    - content: A unified runtime for AI Agents in Java.
  - - meta
    - property: og:type
    - content: website
---

<Home />
```

Note: The `layout: home` triggers VitePress's home layout, but our `custom.css` rule `.VPHero { display: none; }` (spec S4) hides the default hero — the `<Home />` component is what actually renders.

- [ ] **Step 6.2: Visual verify at 4 viewports**

With dev server running (`npm run docs:dev`), open `http://localhost:5173/` in browser. Set DevTools viewport to each size, take a full-page screenshot, save to `docs/superpowers/plans/screenshots/`:

| Viewport | Screenshot path | What to verify |
|---|---|---|
| 1440px | `task-6-1440.png` | Full desktop layout, all 8 sections, 3-col capability grid, 2-col scenario grid |
| 900px | `task-6-900.png` | SDK cards collapse to 1 col, capability cards collapse to 1 col |
| 768px | `task-6-768.png` | Hero padding shrinks, problem/scenario/compare all become 1 col |
| 375px | `task-6-375.png` | Mobile layout — no horizontal scroll, all text readable |

- [ ] **Step 6.3: Side-by-side comparison with mq9**

Open `https://mq9.robustmq.com` in a second browser window. Compare at 1440px:

| Element | mq9 | OryxOS | Match? |
|---|---|---|---|
| Hero badge dot pulse | Yes | Yes (animated) | ☐ |
| Hero title font (Space Grotesk) | Yes | Yes | ☐ |
| Hero title size (~120px desktop) | Yes | Yes | ☐ |
| Pure achromatic palette | Yes | Yes | ☐ |
| Problem 2-col with compare card | Yes | Yes | ☐ |
| Architecture diagram | Yes | Yes (different SVG) | N/A |
| 3-col capability cards | Yes | Yes | ☐ |
| 2-col 8 scenarios | Yes | Yes | ☐ |
| 3-col SDK cards with featured border | Yes | Yes | ☐ |
| Protocol 3 groups with rows | Yes | Yes (different content) | N/A |
| CTA with code block | Yes | Yes | ☐ |
| Responsive breakpoints | Yes | Yes | ☐ |
| No dark mode | Yes | Yes | ☐ |

Tick each ☐ as verified. If any major mismatch, fix Home.vue and re-screenshot.

- [ ] **Step 6.4: Console error check**

In browser DevTools → Console:
- Expected: 0 errors, 0 warnings (or only benign Vite HMR warnings)
- If Vue errors or 404s, fix and re-verify

- [ ] **Step 6.5: Network 404 check**

In DevTools → Network, reload page, filter by 4xx/5xx:
- Expected: 0 responses with 4xx or 5xx status
- If any asset 404s (logo*.svg, architecture.svg, fonts), fix and re-verify

- [ ] **Step 6.6: Commit**

```bash
git add website/index.md docs/superpowers/plans/screenshots/
git commit -m "feat(website): wire homepage entry, complete first visual verification"
```

---

## Task 7: Production build + GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy-website.yml`
- Create: `website/CNAME`

**Goal:** `npm run docs:build` produces `website/.vitepress/dist/index.html`. Workflow file is in place for first deploy.

- [ ] **Step 7.1: Verify production build succeeds**

```bash
cd website
npm run docs:build
echo "exit code: $?"
ls -la .vitepress/dist/
```

Expected:
- Exit code: `0`
- `.vitepress/dist/` contains `index.html`, `assets/`, and other static files
- `index.html` size > 5 KB

- [ ] **Step 7.2: Inspect built `index.html`**

```bash
head -50 website/.vitepress/dist/index.html
```

Expected: HTML contains the OryxOS title, `<Home />` rendered as static HTML, links to CSS/JS bundles.

- [ ] **Step 7.3: Preview production build locally**

```bash
cd website
npm run docs:preview -- --port 4173 &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/
pkill -f "vitepress preview"
```

Expected: HTTP `200`. If 404, build is broken — investigate `dist/` contents.

- [ ] **Step 7.4: Create `.github/workflows/deploy-website.yml`**

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'
      - 'docs/images/**'
      - '.github/workflows/deploy-website.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: website/package-lock.json

      - name: Install dependencies
        working-directory: website
        run: npm ci

      - name: Build
        working-directory: website
        run: npm run docs:build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: website/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7.5: Create `website/CNAME` (placeholder per spec §7.3 default)**

Per spec §7.3 default, ship to GitHub Pages default URL. Create `website/CNAME` with a **commented** placeholder:

```yaml
# Add your custom domain here when ready, e.g.:
# oryxos.example.com
#
# Until then, this file is intentionally blank and the site serves from
# https://<owner>.github.io/OryxOS
```

Actually, `CNAME` must be a plain text file (one hostname per line) or GitHub Pages rejects it. Use plain text:

```text
# Add your custom domain here when ready, e.g.: oryxos.example.com
```

Hmm — GitHub Pages treats any non-empty `CNAME` as a domain directive. To truly defer, just **don't create the file at all**. The site will serve at the GitHub default URL.

**Decision**: **Skip creating `website/CNAME` for now**. When owner provides a domain, create it as a single-line text file with the domain name, e.g.:

```text
oryxos.example.com
```

For this task, just verify the absence of `CNAME` is intentional (the default URL will be used):

```bash
ls website/CNAME 2>/dev/null && echo "WARNING: CNAME exists, review domain" || echo "OK: no CNAME, using GitHub default URL"
```

- [ ] **Step 7.6: Configure GitHub Pages source (manual, owner action)**

Owner must:
1. Go to GitHub repo → Settings → Pages
2. Source: "GitHub Actions"
3. Save

This cannot be automated from the workflow file. **Document this as an owner action item in the commit message.**

- [ ] **Step 7.7: Commit**

```bash
git add .github/workflows/deploy-website.yml
git commit -m "feat(ci): add deploy-website workflow for GitHub Pages

Owner action required: enable GitHub Pages in repo Settings → Pages → Source: GitHub Actions."
```

---

## Task 8: First deploy + smoke tests + CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md` (add `website/` pointer in "相关文件位置" section)

**Goal:** Homepage is live on GitHub Pages. Smoke tests pass. CLAUDE.md reflects the new artifact.

- [ ] **Step 8.1: Push to main and monitor workflow**

```bash
git push origin main
```

Then watch the workflow run in GitHub Actions UI. Expected:
- `build` job succeeds (Node 24 setup, npm ci, docs:build, artifact upload)
- `deploy` job succeeds (artifact deployed to Pages)
- Workflow completes in < 3 minutes

- [ ] **Step 8.2: Verify deployed URL returns 200**

Owner provides the URL (typically `https://<owner>.github.io/OryxOS`):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<owner>.github.io/OryxOS/
```

Expected: `200`.

- [ ] **Step 8.3: Visual verify on deployed URL**

Open the deployed URL in browser. Confirm full homepage renders. Take screenshot for records:

```bash
# Save screenshot via browser DevTools or screenshot tool
# docs/superpowers/plans/screenshots/task-8-deployed.png
```

- [ ] **Step 8.4: Lighthouse audit**

Run Lighthouse in Chrome DevTools (or via `npx lighthouse <url>`):
- Accessibility: ≥ 90
- Performance: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

If any score < 90, document the issue and either fix Home.vue or add a follow-up task.

- [ ] **Step 8.5: Console error check on deployed URL**

Open deployed URL → DevTools → Console:
- Expected: 0 errors

- [ ] **Step 8.6: Network audit on deployed URL**

DevTools → Network → reload:
- Expected: 0 responses with 4xx/5xx status
- Google Fonts requests succeed (200)

- [ ] **Step 8.7: Update `CLAUDE.md` to reference `website/`**

Open `E:\VibeCoding\OryxOS\CLAUDE.md`. In the "相关文件位置" section, append:

```markdown
- 主页（公开网站）：`website/`（VitePress → GitHub Pages）。⚠️ 这是对 §3.2.1 "单二进制部署"原则的显式偏离，已由 owner 授权，详见 [`docs/superpowers/specs/2026-09-03-oryxos-homepage-design.md`](docs/superpowers/specs/2026-09-03-oryxos-homepage-design.md) 的 Constitution Deviation Notice
- 主页实施计划：[`docs/superpowers/plans/2026-09-03-oryxos-homepage.md`](docs/superpowers/plans/2026-09-03-oryxos-homepage.md)
```

- [ ] **Step 8.8: Verify no other CLAUDE.md sections need updates**

Re-read CLAUDE.md to check:
- "项目状态" — still accurate (still greenfield for runtime; homepage is separate)
- "Constitution 原则" — should now mention the deviation exists for homepage only
- "不做" list — not affected

If "Constitution 原则" needs an annotation, add a one-line note like:

```markdown
> ⚠️ 唯一偏离：主页（`website/`）走独立 VitePress + GitHub Pages 部署，不进 fat JAR。Owner 已显式授权。详见 spec。
```

- [ ] **Step 8.9: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: reference website/ in CLAUDE.md, note constitution deviation"
```

- [ ] **Step 8.10: Final verification — record outcome**

Update `docs/superpowers/specs/2026-09-03-oryxos-homepage-design.md` "Implementation Steps" section: mark each of the 12 steps as ✅ completed. Commit the spec update:

```bash
git add docs/superpowers/specs/2026-09-03-oryxos-homepage-design.md
git commit -m "docs(spec): mark homepage implementation steps as complete"
```

---

## Self-Review (writer-side checklist)

### 1. Spec coverage

| Spec section | Task(s) |
|---|---|
| §1 Purpose | Task 5 (copy), Task 6 (entry) |
| §2 Architecture | Task 7 (workflow), Task 8 (deploy) |
| §3.1 File list (13 files) | Tasks 1, 2, 3, 4, 5, 6, 7 |
| §3.3 Symlinks vs copies | Task 2 (S3, copy approach) |
| §4 Visual structure (8 sections) | Task 4 (template), Task 5 (copy) |
| §5.1 Hero copy | Task 5.1 |
| §5.2 Problem copy | Task 5.2 |
| §5.3 Capabilities copy | Task 5.3 |
| §5.4 Scenarios copy (8) | Task 5.4 |
| §5.5 SDK copy | Task 5.5 |
| §5.6 Protocol copy (placeholder) | Task 5.6 |
| §5.7 CTA copy | Task 5.7 |
| §6 Deployment pipeline | Task 7 (workflow), Task 8 (deploy + smoke) |
| §6.3 Domain placeholder | Task 7.5 (CNAME deferred) |
| §7.1 Symlinks vs copies | Task 2 (copy default) |
| §7.2 Protocol placeholder | Task 5.6 (with `[Planned — US-5]` tags) |
| §7.3 Domain default | Task 7.5 (GitHub default) |
| §7.4 Favicon derived | Task 2 (Step 2.4-2.6) |
| §8 Testing (visual, Lighthouse, console, 404) | Task 6 (visual), Task 8 (Lighthouse + console + 404) |
| §9 Implementation Steps (12) | Tasks 1-8 (mapped) |
| §11 Out of Scope | Explicitly excluded from all tasks |

### 2. Placeholder scan

Searched for: `TBD`, `TODO`, `implement later`, `fill in details`, `add appropriate error handling`, `similar to Task N`.

Found:
- Task 4.1: `TODO` placeholders — **intentional**, replaced in Task 5.
- Task 5.1-5.7: `[Planned — US-5]` markers — **intentional**, per spec §7.2 default.
- Task 7.5: `CNAME` decision deferred — **intentional**, per spec §7.3 default.

No accidental placeholders remain.

### 3. Type / interface consistency

| Reference | Definition | Usage | Match |
|---|---|---|---|
| `oryx-*` CSS classes | Defined in Task 4 (template) + Task 4 (scoped CSS) | Used throughout | ✅ |
| `capabilities` computed | `[{ id, icon, title, subtitle, code }]` (Task 4) | Same shape in Task 5.3 | ✅ |
| `scenarios` computed | `[{ num, title, desc }]` (Task 4) | Same shape in Task 5.4 | ✅ |
| `sdkCards` computed | `[{ id, icon, title, desc, tags }]` (Task 4) | Same shape in Task 5.5 | ✅ |
| `protocolGroups` computed | Defined Task 4, **removed** Task 5.6 (replaced with inline HTML) | No stale refs | ✅ |
| `<OWNER>` placeholder | Used in 4 places (config, hero CTA, GitHub links, CTA code block) | Consistent — Task 8 owner fills in | ✅ |
| GitHub Pages URL | `https://<owner>.github.io/OryxOS` | Consistent | ✅ |

### 4. Internal consistency

- Visual constraints (V1-V7) referenced in Global Constraints, enforced in Task 4 (CSS) and Tasks 5, 6 (template).
- Process constraints (P1-P4) referenced in Global Constraints, applied to every task's commit step.
- No contradictions between tasks.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-03-oryxos-homepage.md`** (8 tasks, ~80 bite-sized steps).

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration with two-stage review

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

**Prerequisites for any execution:**
- Node.js 24+ installed locally
- Owner provides GitHub `<OWNER>` placeholder value (currently `<OWNER>` literal in 4 files)
- OryxOS repo initialized as git (`git init` + initial commit of `docs/`, `CLAUDE.md`, etc.)
- GitHub Pages enabled on the repo (after first workflow run)

If `<OWNER>` is known, I can do a global string replace before executing. If not, I'll pause at the right step and ask.
