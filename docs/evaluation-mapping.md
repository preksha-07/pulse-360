# Hackathon Evaluation Mapping — Pulse360

This guide lists where in the repository the code implementations corresponding to the hackathon judging criteria can be found.

---

## 1. Code Quality
*Focus: TypeScript type-safety, clean code separation, design pattern modularity.*
*   **Monorepo separation**: Independent packages for client (`/client`) and server (`/server`).
*   **Predictive Engine (`/server/src/prediction`)**: Modular class-based design separating telemetry mutation from predictions.
*   **Shared Interfaces (`/client/src/types.ts`)**: Mirrors backend types exactly to guarantee integration compliance.
*   **Linter Checks**: ESLint configs defined for both projects.

---

## 2. Security
*Focus: Protection against attacks, request sanitization, and endpoint safety.*
*   **Security Middleware (`/server/src/index.ts`)**: Renders `helmet` security headers, strict `cors` origins, and `express.json` body size constraints (10kb max).
*   **Rate Limiting (`/server/src/index.ts`)**: Employs `express-rate-limit` splits between standard traffic (100 req/min) and AI pipelines (20 req/min).
*   **Input Validation (`/server/src/index.ts`)**: All parameters are filtered using `zod` schema checks.
*   **Safe Mock Fallback (`/server/src/ai/gemini.ts`)**: Prevents server crashes if the `GEMINI_API_KEY` is missing or invalid.

---

## 3. Efficiency
*Focus: Real-time update bandwidth, caching, and stream stability.*
*   **Server-Sent Events (`/server/src/index.ts` & `/client/src/App.tsx`)**: streams telemetry updates on a 2s interval rather than polling.
*   **AI Caching & Refresh Intervals (`/client/src/components/Dashboard.tsx`)**: Restricts Gemini Operational briefings to 30s intervals to limit token usage.
*   **Vanilla CSS Design System (`/client/src/index.css`)**: Zero runtime JS styling performance overhead.

---

## 4. Accessibility (a11y)
*Focus: Color contrast, screen readers, semantic layout.*
*   **Semantic layouts (`/client/src/components/`)**: Clean HTML structure using `<h1>`, `<h2>`, and `<header>` tags.
*   **WAI-ARIA Tab Navigation (`/client/src/App.tsx`)**: Fully interactive controls utilizing `aria-selected` and `role="tab"` mappings.
*   **No color-only indicators (`/client/src/components/SecurityPortal.tsx`)**: Status items include readable labels (`SAFE`, `CRITICAL`) and icons.

---

## 5. Problem Statement Alignment
*Focus: Enhancing FIFA World Cup 2026 operations and fan experience.*
*   **Navigation & Transportation**: Recommends gates and lists metro schedules.
*   **Volunteer Coordination**: Automates staff redeployment during crowd surges.
*   **Emergency Security**: Real-time evacuation simulation and safety checklists.
*   **Multilingual Assistant**: Gemini chatbot translates questions on gates and wait times automatically.
