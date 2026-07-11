# Architectural Decisions (ADR) — Pulse360

This document records the key architectural choices, engineering trade-offs, and technology evaluations made during the development of Pulse360.

---

## 1. Real-Time Data Pipeline: SSE vs. WebSockets

We chose **Server-Sent Events (SSE)** via HTTP for streaming live telemetry rather than full-duplex WebSockets.

### Evaluation
- **WebSocket Protocol**: Offers two-way streaming but introduces connection management complexity, heartbeat cycles, and custom packet framing overhead.
- **Server-Sent Events (SSE)**: Operates over standard HTTP. It supports automatic reconnection out of the box and is unidirectional (Server → Client), aligning with telemetry streaming.

### Decision
SSE was chosen because of its ease of integration, low overhead, and stability. Bidirectional communication (like user questions) is handled via REST, which matches standard API patterns.

---

## 2. Design System Styling: Pure CSS vs. Tailwind CSS

We migrated the client application to **pure Vanilla CSS** (located in `client/src/index.css`) rather than Tailwind CSS.

### Evaluation
- **Tailwind CSS (v4)**: Introduces configuration changes and PostCSS compiler rules that can cause build errors in Vite monorepo setups if versions conflict.
- **Vanilla CSS**: Supports CSS custom variables natively, is highly customizable, and requires zero compiler plugins.

### Decision
We developed a bespoke design system with CSS custom properties using a dark NASA Mission Control aesthetic. This avoids build tooling issues and maintains a lightweight build footprint.

---

## 3. Decision Model: Hybrid Rule Engine + Coordinator Agent

Pulse360 utilizes deterministic rules for predictions and an LLM Coordinator for explanations.

### Evaluation
- **Pure Agentic Loop**: Running continuous agent planning loops on telemetry updates is expensive, slow, and prone to recommendation drift.
- **Deterministic Rules**: Provide predictable, fast calculations but lack natural summaries.

### Decision
We combine both:
- **Telemetry & Predictions**: Computed deterministically (under 1ms).
- **Coordinator Agent**: Evaluates risk states and outputs priority values.
- **Gemini**: Generates the high-level human summary (Briefing & Chat).

This hybrid approach guarantees safety, speed, and clean developer/fan interactions.
