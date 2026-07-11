# Changelog — Pulse360

All notable changes to this project will be documented in this file.

---

## [1.0.0] - 2026-07-11

### Added
- **Predictive Core**: Telemetry Simulation Engine and +10/20/30m Prediction Engine.
- **AI Integration**: Google Gemini 2.0 Flash integration for automatic Operational Briefings and conversational fan questions.
- **Portals UX**: Completed Organizer Command Center, multilingual Fan Portal, Volunteer Roster Planner, and Security Heatmap with live Evacuation Drill simulator.
- **SSE Stream**: Server-Sent Events (SSE) stream endpoint `/api/intelligence/stream` coordinating all data components.
- **Security Protocols**: Helmet, Express rate-limit splits, 10kb body parsers, Zod filters, and whitelisted CORS limits.

### Fixed
- **Tailwind Build Resolution**: Swapped PostCSS Tailwind configuration with a robust, pure CSS design system in `client/src/index.css` to fix monorepo compilation conflicts.
- **Vite Cache Fix**: Patched component type-imports to use type-only parameters (`import type { ... }`) to eliminate browser compilation caching issues.

---

## [0.1.0] - 2026-07-11
- Monorepo scaffold initialized.
- Telemetry mock templates and routing established.
