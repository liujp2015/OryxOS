---
title: 文档
layout: doc
description: OryxOS 文档 — 概览、需求、架构和 AI 开发流程
---

OryxOS 是用 Java 编写的**企业级 Agent OS**。它以单个 Spring Boot 二进制文件的形式运行在企业自有基础设施之上,提供了一个统一运行时,让多个业务 Agent 共享渠道接入、模型路由、记忆、工具执行和审计能力。数据始终留在企业边界之内,不存在云厂商锁定。

本文档内容源自驱动本项目的四份内部设计文档。下方每个页面分别对应其中一份文档,并提炼出面向外部读者的关键内容。

## 阅读路径

如果你是第一次接触 OryxOS,建议按以下顺序阅读:

1. **[概览](/zh/docs/overview)** —— OryxOS 是什么、Java 生态为什么需要 Agent OS、OryxOS 的定位策略。
2. **[需求分析](/zh/docs/demand)** —— 五大核心能力、核心功能集合、里程碑计划和验收标准。
3. **[架构设计](/zh/docs/tech)** —— 七项关键技术决策、五大能力详解、九个 Maven 模块。
4. **[AI 开发指南](/zh/docs/ai-guide)** —— 项目如何使用 Spec-Kit 构建、五个 user story 以及增量开发的手动提示词模式。

## 四个页面

### 概览

什么是 Agent OS、Java 生态存在的空白是什么、OryxOS 如何填补这片空白。涵盖四词定位(**统一 / 私有 / 易接入 / 可观测**),以及 OryxOS 与编排平台(Dify)和框架(LangChain、Spring AI)等邻近概念的边界。

[阅读概览 →](/zh/docs/overview)

### 需求分析

五大核心能力的细节:LLM Provider、ReAct 循环、三层记忆、Plugin Tool 体系、Web Service。涵盖 4 周里程碑计划以及作为核心阶段发布门槛的五个验收 demo。

[阅读需求分析 →](/zh/docs/demand)

### 架构设计

七项关键技术决策、分层架构、五大能力的深度解析、九个 Maven 模块。解释为什么 ReAct 循环要自实现、为什么 Spring AI 仅用于协议转换和 schema 生成,以及 SQLite 配合 `MEMORY.md` 如何覆盖持久化需求。

[阅读架构设计 →](/zh/docs/tech)

### AI 开发指南

OryxOS 如何借助 AI 工具开发。涵盖两阶段方法(主体开发用 Spec-Kit,增量开发切手动提示词)、七条 Constitution 原则、按依赖关系排序的五个 user story,以及构建过程中使用的 Spec-Kit artifact。

[阅读 AI 开发指南 →](/zh/docs/ai-guide)

## 源文档

上述页面是从四份内部设计文档提炼出来的。完整文档仍是单一事实来源,在需要更深入细节时被引用:

- **行业研究(Industry Research)** —— OryxOS 存在的理由、行业格局、Java 生态的空白。
- **需求分析(Demand Analysis)** —— 完整的功能和非功能需求。
- **技术方案(Technical Solution)** —— 完整架构、模块设计和数据持久化方案。
- **AI 编程指南(AI Programming Guide)** —— 完整的 Spec-Kit 工作流与增量开发指南。

## 一分钟理解 OryxOS

- **它是什么** —— 用 Java 编写的企业级 Agent OS。单个 Spring Boot 二进制文件,运行在企业自有基础设施上。
- **解决什么问题** —— 在受监管企业内部,LLM-as-a-Service 与生产级 Agent 部署之间的鸿沟:与现有系统的集成、审计、多租户隔离、治理。
- **如何构建** —— 五大核心能力(LLM Provider、ReAct 循环、三层记忆、Plugin Tool 体系、Web Service)构建在 JDK 21 + Spring Boot 3.x + SQLite + Picocli 之上,封装为单个 Maven 多模块项目。
- **如何开发** —— 主体开发阶段由 Spec-Kit 驱动;核心发布后,使用 Claude Code 配合手动提示词处理增量变更。

如果想要更简短的一句话:**OryxOS 对于企业 AI Agent 的意义,就像 Spring Boot 对于企业 Web 服务一样** —— 一个连贯的运行时,让业务团队可以通过配置来添加新能力,而无需每次都重新搭建基础设施。