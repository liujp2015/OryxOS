<script setup lang="ts">
import { computed } from 'vue'

// Section copy — finalized per spec §5
const capabilities = computed(() => [
  {
    id: 'react',
    icon: '🧠',
    title: 'ReAct Loop',
    subtitle: 'Self-implemented cycle · MAX_ITERATIONS guard · resumable',
    code: `// ReAct loop — fully under your control
while (iterations < MAX_ITERATIONS) {
  Thought    = llm.think(messages, tools)
  Action     = parseToolCall(Thought)
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
    sessionMemory.put(s, key, value);        // tier 1: in-session
    longTermMemory.put(s.userId, key, value); // tier 2: across sessions
    memoryMdFile.append(s, key, value);       // tier 3: human-readable
  }
}`,
  },
])

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
</script>

<template>
  <!-- ============== HERO ============== -->
  <section class="oryx-hero">
    <div class="oryx-hero-inner">
      <img src="/logo-mark.svg" alt="OryxOS" class="oryx-hero-mark" />
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
        <a class="oryx-btn-ghost" href="https://github.com/liujp2015/OryxOS" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div class="oryx-hero-note">
        Spring Boot 3.x · JDK 21 virtual threads · MCP Protocol · SKILL.md · SQLite · JPA
      </div>
    </div>
  </section>

  <!-- ============== PROBLEM ============== -->
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
        <h2 class="oryx-section-title">The Three Pillars of OryxOS</h2>
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
        <h2 class="oryx-section-title">Eight real-world use cases</h2>
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
        <h2 class="oryx-section-title">Three ways to connect — pick what fits</h2>
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

  <!-- ============== CTA ============== -->
  <section class="oryx-section oryx-cta-section">
    <div class="oryx-section-inner">
      <div class="oryx-cta">
        <h2 class="oryx-cta-title">Start Building</h2>
        <p class="oryx-cta-desc">Clone the repo, run one command, send your first Agent message.</p>
        <pre class="oryx-code oryx-cta-code"><code># Clone and run
git clone https://github.com/liujp2015/OryxOS
cd OryxOS
./mvnw spring-boot:run

# In another terminal — send your first Agent message
curl -X POST http://localhost:8080/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"Hello, OryxOS"}'</code></pre>
        <div class="oryx-cta-links">
          <a class="oryx-btn-primary" href="/docs/">Read the Docs →</a>
          <a class="oryx-btn-ghost" href="https://github.com/liujp2015/OryxOS" target="_blank" rel="noopener">GitHub</a>
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
.oryx-hero-mark {
  display: block;
  width: 80px;
  height: 80px;
  margin: 0 auto 32px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.oryx-primitive {
  background: var(--oryx-bg);
  border: 1px solid var(--oryx-border);
  border-radius: 12px;
  padding: 24px;
  min-width: 0;
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
  max-width: 100%;
  white-space: pre;
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
