---
layout: doc
title: OryxOS — 企业级 Agent 运行时
description: 企业可控、Java 原生、私有可审计的 Agent 统一底座。
---

# OryxOS

企业可控、Java 原生、私有可审计的 **Agent 运行时**。

> **Agent OS** 是一类运行和管理 AI Agent 的底座系统。它装在企业自己的基础设施上，向上为各类业务 Agent 提供统一的运行环境，向下接入模型、渠道、工具、记忆、身份和审计基础设施。

## 五大核心能力

| 能力 | 一句话 | 主模块 |
|---|---|---|
| **对接 LLM** | Provider 抽象，基于 Spring AI Alibaba | `oryxos-provider` |
| **ReAct 循环** | Agent 大脑，自实现循环 | `oryxos-core` |
| **Memory** | 三层记忆（核心做会话+长期两层） | `oryxos-memory` |
| **Tool 体系** | 内置 5 个 + Plugin 三档 | `oryxos-tool` |
| **Web Service** | REST API 10 个核心端点 | `oryxos-web` |

## 四词定位

**统一、私有、易接入、可观测**。

- **统一**：企业内多个 Agent 共享一套底座。
- **私有**：数据和部署完全在企业自己手里。
- **易接入**：基于标准 Spring Boot 工程结构，跟现有系统和工具链直接对接。
- **可观测**：标准 Prometheus 指标、结构化日志、健康检查。

## 快速开始

- 📖 [查看完整文档 →](/zh/docs/overview)
- 💻 [GitHub 仓库](https://github.com/liujp2015/OryxOS)

## 技术栈

**JDK 21** + Spring Boot 3.x + Spring AI Alibaba + 自实现 ReAct loop + SQLite + Picocli，单二进制部署。