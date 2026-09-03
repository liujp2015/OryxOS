---
title: Documentation
layout: doc
description: OryxOS documentation — overview, requirements, architecture, and AI dev workflow
---

OryxOS is an enterprise Agent OS written in Java. It runs on your own infrastructure as a single Spring Boot binary, providing a unified runtime where multiple business Agents share channel access, model routing, memory, tool execution, and audit. Data stays inside your perimeter. No cloud lock-in.

This documentation is derived from the four internal design documents that drove the project. Each page below maps to one of those documents and distills the relevant content for an external audience.

## Where to start

If you are new to OryxOS, read the pages in order:

1. **[Overview](/docs/overview)** — what OryxOS is, why Java needed an Agent OS, and how OryxOS positions itself.
2. **[Requirements](/docs/demand)** — the five core capabilities, the core feature set, milestones, and acceptance criteria.
3. **[Architecture](/docs/tech)** — the seven key technical decisions, the five-capability deep dive, and the nine Maven modules.
4. **[AI Dev Guide](/docs/ai-guide)** — how the project is built with Spec-Kit, the five user stories, and the manual-prompt mode for incremental work.

## The four pages

### Overview

What is an Agent OS, what gap existed in the Java ecosystem, and how OryxOS fills it. Covers the four-word positioning (**Unified / Private / Easy-to-integrate / Observable**) and the boundary between OryxOS and adjacent concepts like orchestration platforms (Dify) and frameworks (LangChain, Spring AI).

[Read the overview →](/docs/overview)

### Requirements

The five core capabilities in detail: LLM Provider, ReAct loop, three-layer Memory, Plugin Tool system, and Web Service. Covers the 4-week milestone plan and the five acceptance demos that gate the core release.

[Read the requirements →](/docs/demand)

### Architecture

The seven key technical decisions, the layered architecture, deep dives on each of the five capabilities, and the nine Maven modules. Explains why ReAct is self-implemented, why Spring AI is only used for protocol conversion and schema generation, and how SQLite plus MEMORY.md covers persistence.

[Read the architecture →](/docs/tech)

### AI Dev Guide

How OryxOS is developed using AI tooling. Covers the two-phase approach (Spec-Kit for the main development, manual prompts for incremental work), the seven constitution principles, the five user stories ordered by dependency, and the Spec-Kit artifacts used during the build.

[Read the AI dev guide →](/docs/ai-guide)

## Source documents

The pages above are distilled from four internal design documents. The full documents remain the single source of truth and are referenced where deeper detail is needed:

- **Industry Research** — why OryxOS exists, industry landscape, the Java ecosystem gap.
- **Demand Analysis** — full feature and non-functional requirements.
- **Technical Solution** — complete architecture, module design, and data persistence.
- **AI Programming Guide** — full Spec-Kit workflow and incremental development guide.

## Where OryxOS fits in one minute

- **What it is** — an enterprise Agent OS in Java. Single Spring Boot binary. Runs on your own infrastructure.
- **What it solves** — the gap between LLM-as-a-Service and production Agent deployment inside regulated enterprises: integration with existing systems, audit, multi-tenant isolation, governance.
- **How it's built** — five core capabilities (LLM Provider, ReAct loop, three-layer memory, Plugin Tool system, Web Service) layered on top of JDK 21 + Spring Boot 3.x + SQLite + Picocli, packaged as a single Maven multi-module project.
- **How it's developed** — Spec-Kit drives the main development phase; manual prompts with Claude Code handle incremental changes after the core ships.

If you want the short version: OryxOS is to enterprise AI Agents what Spring Boot is to enterprise web services — a coherent runtime that lets business teams add new capabilities by configuration, without rebuilding the infrastructure each time.