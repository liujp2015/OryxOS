<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/logo-dark.svg" />
    <img src="docs/images/logo.svg" alt="OryxOS — Enterprise Java-native Agent Runtime" width="520" />
  </picture>
</p>

# OryxOS

> **Java 原生的企业级 Agent OS** — 私有部署、完全可审计、跟 Java 生态对齐的 Agent 统一底座

[![Status](https://img.shields.io/badge/status-design--phase-yellow)]()
[![Java](https://img.shields.io/badge/JDK-21-orange)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green)]()
[![License](https://img.shields.io/badge/license-TBD-lightgrey)]()

[English](#) · [简体中文](README.md) · [文档索引](#项目文档)

> 📚 **所有设计文档位于 [`docs/`](docs/) 目录**，本仓库根目录只有 README 和 CLAUDE.md。

---

## 这是什么

**OryxOS** 是一个基于 Java 实现的企业级 **Agent OS**（智能体操作系统）。它装在企业自己的 K8s 或服务器上，作为统一底座承载各种业务 Agent（运维助手、客服助手、HR 助手、销售助手、知识管理助手等），共享一套渠道接入、模型路由、工具调用、记忆系统、沙箱执行能力。数据完全留在企业自己的基础设施，不锁任何云生态。

**一句话**：让 Java 企业像装一个 Spring Boot 应用一样装上 Agent 底座，业务方只写 Tool 和配 Profile，不用造 Agent 后端代码。

---

## 为什么需要 OryxOS

业界已经有 OpenClaw（Node.js）和 Hermes Agent（Python）两个代表性的开源 Agent OS，但 **Java 生态在这一层是空白**。对于严监管企业（银行、政府、电信、能源、医疗），真正的刚需是：

| 需求 | OpenClaw / Hermes | OryxOS |
|---|---|---|
| 私有部署，数据不出企业 | ✅ | ✅ |
| 完全可审计，全链路留痕 | ❌ | ✅ |
| 跟 Java 体系对齐（复用 Nacos / Sentinel / SkyWalking） | ❌ | ✅ |
| 默认安全（最小权限、强制沙箱） | ❌ | ✅ |
| 走现有合规审查流程 | ❌（Node.js 加固难） | ✅（Java 原生） |

OryxOS 填这个位置。**锚在不变的企业刚需上**，不锚在"Agent OS"这个词上。

详细的业界分析见 [IndustryResearch.md](docs/IndustryResearch.md)。

---

## 核心特性

### 五大核心能力

| # | 能力 | 一句话 | 当前状态 |
|---|---|---|---|
| 一 | **对接 LLM** | Provider 抽象，基于 Spring AI Alibaba，跑通 DeepSeek / Kimi / Qwen 等十余家 | 📝 设计完成 |
| 二 | **ReAct 循环** | Agent 大脑，自实现循环，核心数十行 Java | 📝 设计完成 |
| 三 | **Memory 三层记忆** | 会话 + 长期（MEMORY.md），扩展支持向量检索 | 📝 设计完成 |
| 四 | **Tool 体系** | 内置 5 个 Tool + Plugin Tool 三档接入（SKILL.md / MCP / @Tool） | 📝 设计完成 |
| 五 | **Web Service** | REST API 10 个核心端点，对外完整门面 | 📝 设计完成 |

### 三大差异化

1. **Java 原生** — Spring Boot 3.x 单体应用，运维工具链无缝对接（Nacos、Sentinel、SkyWalking、Arthas、Prometheus + Grafana）
2. **私有可控** — 单二进制部署（`java -jar`），数据完全留在企业；扩展阶段支持 GraalVM Native Image
3. **企业级治理** — 审计 day one 落库（`tool_invocations`、`llm_calls`）；扩展阶段补齐多租户、SSO、Tool Policy

---

## 架构

![OryxOS 整体架构](docs/images/architecture.svg)

### 9 个 Maven 模块

```
oryxos-core       # 核心引擎：ReActLoop、PromptBuilder、ToolExecutor、OryxTool、Session、Profile
oryxos-provider   # 能力一：ProviderService、Function Calling 适配、provider name 映射
oryxos-memory     # 能力三：MemoryService 三层门面、LongTermMemory、MemoryTools
oryxos-tool       # 能力四（三合一）：内置 Tool、MCP Client、ToolRegistry、SandboxChecker
oryxos-web        # 能力五：WebServer、6 个 ApiController、GlobalExceptionHandler、OpenAPI
oryxos-channel-cli# CLI Channel
oryxos-storage    # SQLite 三张表：sessions、tool_invocations、llm_calls
oryxos-cli        # Picocli 12 个命令入口
oryxos-boot       # Spring Boot fat JAR 启动模块
```

### 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 运行时 | **JDK 21 + Spring Boot 3.x** | virtual thread 撑高并发，不用响应式 |
| LLM | **Spring AI Alibaba** | 只用 Provider 抽象 + schema 生成，**禁用自动 tool 执行** |
| Agent 引擎 | **自实现 ReAct loop** | 不依赖 Spring AI Agent 抽象 |
| 存储 | **SQLite + Spring Data JPA** | sessions / tool_invocations / llm_calls |
| 长期记忆 | **MEMORY.md 文件** | 核心阶段关键词检索；扩展阶段升级向量检索 |
| CLI | **Picocli** | 12 个子命令 |
| Plugin | **MCP Java SDK** | stdio transport 优先，SSE 放扩展 |

> **单二进制部署**：一个 fat JAR，扩展阶段再用 GraalVM Native Image 压启动时间和内存占用。

### 运行时流程

![ReAct 循环运行时流程](docs/images/react-loop.svg)

---

## 快速开始

> ⚠️ **当前状态**：项目处于设计阶段，4 份核心文档已定型，**代码尚未编写**。开发按 4 周节奏推进，每周 3 小时实践。

### 贡献者入门

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/oryxos.git
cd oryxos

# 2. 按顺序阅读设计文档（每份都要读）
#    - IndustryResearch.md   为什么做
#    - DemandAnalysis.md     做什么
#    - TechnicalSolution.md  怎么做
#    - AiProgrammingGuide.md 用 AI 怎么做

# 3. 启动 Claude Code，使用 Spec-Kit 工作流
claude
> /speckit.constitution    # 写项目宪章（7 条原则）
> /speckit.specify         # 把需求文档转成 5 个 user story
> /speckit.plan            # 把技术方案转成实施 plan
```

完整开发指引见 [AiProgrammingGuide.md](docs/AiProgrammingGuide.md)。

---

## 项目文档

| 文档 | 回答的问题 | 内容 |
|---|---|---|
| [IndustryResearch.md](docs/IndustryResearch.md) | Why | 业界判断、Agent OS 定义、Java 生态缺位、定位论证 |
| [DemandAnalysis.md](docs/DemandAnalysis.md) | What | 五大核心能力 + 非功能需求 + 验收标准 |
| [TechnicalSolution.md](docs/TechnicalSolution.md) | How | 技术栈选型、9 模块架构、关键流程、工程风险 |
| [AiProgrammingGuide.md](docs/AiProgrammingGuide.md) | How to AI | Spec-Kit 工作流、5 个 user story 拆解 |

辅助文件：[CLAUDE.md](CLAUDE.md) — 给 Claude Code 的项目级引导上下文。

---

## 路线图

### 核心阶段（4 周 × 3 小时 = 12 小时）

| 周 | 主题 | 周末可演示成果 |
|---|---|---|
| 1 | 对接 LLM + ReAct 循环 | `oryxos chat` 多轮对话，Agent 调 HTTP Tool 查天气穿衣 |
| 2 | Memory + Tool 体系 | Agent 跨对话记偏好、调文件读写、调外部 MCP 工具 |
| 3 | Web Service | 外部系统通过 10 个 REST 端点调用 OryxOS |
| 4 | 多 Agent + 工程化收尾 | 多 Agent 并存、CLI 完整、Session 跨重启恢复 |

### 扩展阶段（开源社区接力）

- 多 Channel 接入：企业微信 / 飞书 / 钉钉 / Slack / 邮件
- Memory 升级：自动抽取、向量检索（pgvector / LanceDB）、情景记忆、Memory Wiki
- Tool 治理：Tool Policy、Tool LRU、完整 Sandbox（Docker / K8s pod）
- Web Service 完善：SSE 流式、Web 仪表板、认证（API Key + JWT）
- 企业级治理：多租户、SSO、完整审计、Prometheus 指标
- 规模化：高可用集群、GraalVM Native Image

---

## 与业界项目的关系

| 项目 | 类型 | 语言 | 定位 | 与 OryxOS 的关系 |
|---|---|---|---|---|
| **OpenClaw** | Agent OS | Node.js | 个人 / 小团队 | 同类不同定位，SKILL.md 互通 |
| **Hermes Agent** | Agent OS | Python | 团队 / 小公司 | 同类不同定位，互补 |
| **Dify / Coze** | 编排平台 | - | 可视化 workflow | OryxOS 是底层支撑，Dify 可跑在 OryxOS 之上 |
| **Spring AI / LangChain4j** | 框架 | Java | LLM 调用库 | OryxOS 复用它们做底层 |

---

## 安全

OpenClaw 的安全问题（CVE、恶意 skill、凭证收割）**不是偶然的 bug，是结构性的**。OryxOS 从 day one 走相反的路：

- ✅ **Skill 和 Tool 来源受控**，不做无约束的公开市场
- ✅ **最小权限**，而不是默认全开
- ✅ **沙箱隔离是强制的**，不是可选的
- ✅ **凭证不落地**，走企业密钥体系（KMS / Vault）
- ✅ **全链路审计**是底座能力，不是事后补
- ✅ **走企业现有合规审查流程**，不需要二次加固

详细设计见 [TechnicalSolution.md](docs/TechnicalSolution.md) §6.7。

---

## 贡献

> 项目当前处于设计阶段，尚未发布代码。

**现在可以贡献的**：

- 🐛 提交 issue 指出文档问题或提出改进建议
- 💡 通过 issue 讨论新场景、新能力、集成方向
- 📖 帮助完善文档（API 参考、部署运维手册、贡献者指南 CONTRIBUTING.md）
- 🔌 提供企业 IT 系统的 MCP server 实现（开发启动后）

**开发启动后可以贡献的**：

- ⭐ 实现核心能力（按 5 个 user story 顺序认领）
- 🔧 加新的 Channel（企业微信 / 飞书 / 钉钉）
- 🧠 升级 Memory（向量检索、自动抽取、情景记忆）
- 🛡️ 完善 Tool 治理（Tool Policy、完整 Sandbox）

具体贡献流程和 issue 标注（`good-first-issue` / `feature-request` / `long-term-goal`）将在 1.0 发布后随 CONTRIBUTING.md 一并上线。

---

## 许可证

待定（核心阶段结束后决议，倾向 Apache 2.0 或 MIT）。

---

## 致谢

OryxOS 借鉴了 OpenClaw 和 Hermes Agent 在开源 Agent OS 领域已被验证的设计哲学（Channel 抽象、三层记忆、Skill 体系、Tool 通过 MCP 协议接入、单二进制部署），并补齐企业级治理能力。

底层 LLM 调用基于 **Spring AI Alibaba** 提供的主流 LLM connector，**MCP 协议** 由 Anthropic 提出并已成为 Agent 生态事实标准。

---

## 联系方式

- **GitHub Issues**：提交问题、讨论方向、贡献代码
- **项目主页**（计划中）：核心阶段结束后上线（VitePress）

---

> **让 Java 企业像装 Spring Boot 一样装上 Agent 底座。**