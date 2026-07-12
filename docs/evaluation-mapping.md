# Component Mapping & Reference — Pulse360

This guide lists where in the repository the code implementations corresponding to core platform specifications and standards can be found.

---

## 1. Software Design & Standards
*Focus: TypeScript type-safety, clean code separation, and modular design patterns.*
*   **Monorepo Structure**: Separate packages for client frontend (`/client`) and server backend (`/server`).
*   **Predictive Engine (`/server/src/prediction`)**: Modular class-based design separating telemetry mutation from predictions.
*   **Shared Interfaces (`/client/src/types.ts`)**: Mirrors backend types exactly to guarantee integration compliance.
*   **Code Validation Configs**: Explicit linter and typescript compilation configurations defined for both projects.

---

## 2. Security Controls
*Focus: Request sanitization, rate limiting, and endpoint safety.*
*   **Security Middleware (`/server/src/index.ts`)**: Renders `helmet` security headers, strict `cors` origins, and `express.json` body size constraints (10kb max).
*   **Rate Limiting (`/server/src/index.ts`)**: Employs `express-rate-limit` splits between standard traffic (100 req/min) and AI pipelines (20 req/min).
*   **Input Validation (`/server/src/index.ts`)**: All parameters are filtered using `zod` schema checks.
*   **Safe Mock Fallback (`/server/src/ai/gemini.ts`)**: Prevents server crashes if the `GEMINI_API_KEY` is missing or invalid.

---

## 3. Performance & Efficiency
*Focus: Real-time update bandwidth, caching, and stream stability.*
*   **Server-Sent Events (`/server/src/index.ts` & `/client/src/App.tsx`)**: Streams telemetry updates on a 2s interval rather than polling.
*   **AI Caching & Refresh Intervals (`/client/src/components/Dashboard.tsx`)**: Restricts Gemini Operational briefings to 30s intervals to limit token usage.
*   **Vanilla CSS Design System (`/client/src/index.css`)**: Zero runtime JS styling performance overhead.

---

## 4. Accessibility Compliance (a11y)
*Focus: Color contrast, screen readers, and semantic page layouts.*
*   **Semantic Layouts (`/client/src/components/`)**: Clean HTML structure using standard semantic layout tags.
*   **WAI-ARIA Tab Navigation (`/client/src/App.tsx`)**: Fully interactive controls utilizing keyboard listeners and `role="tab"` mappings.
*   **No Color-Only Indicators (`/client/src/components/SecurityPortal.tsx`)**: Status items include readable labels (`SAFE`, `CRITICAL`) and icons.

---

## 5. Core Feature Implementations
*Focus: Event operations and fan experience.*
*   **Navigation & Transportation**: Recommends gates and lists transit schedules.
*   **Volunteer Coordination**: Automates staff redeployment alerts during stand surges.
*   **Emergency Security**: Real-time evacuation simulation and safety checklists.
*   **Multilingual Assistant**: Gemini chatbot translates questions on gates and wait times automatically.
