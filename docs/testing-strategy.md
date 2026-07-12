# Testing Strategy — Pulse360

This document outlines the testing architecture, testing levels, and verification strategies designed for the Pulse360 platform.

---

## 1. Testing Framework Stack

Our recommended testing stack uses **Vitest** for server/client unit tests and **Playwright** for end-to-end integration flows.

---

## 2. Unit Testing Strategy

### Telemetry Simulation Engine
Tests focus on validating state changes over time.
*   **Target File**: `server/src/telemetry/engine.ts`
*   **Test Cases**:
    *   Verify that `telemetryEngine.start()` sets up the recurring interval.
    *   Assert that `mutateState()` accurately increments counts and triggers metro arrivals.
    *   Verify that listeners are correctly notified on state ticks.

### Prediction Engine
Validates the accuracy of the +10m/20m/30m forecast outputs against mocked telemetry state parameters.
*   **Target File**: `server/src/prediction/engine.ts`
*   **Test Cases**:
    *   Verify that `generatePredictions` computes the timeline increments accurately.
    *   Verify that a simulated metro passenger count surge triggers high-density warnings at Gate 6 in the future timeline.
    *   Ensure risk levels scale correctly with capacity percentages.

---

## 3. Integration & Mock Testing

### AI Service Mocks (Gemini 2.0)
Testing components that contact the `@google/generative-ai` endpoint utilizes dependency mocking:
- **Briefing Test**: Mocks the Gemini SDK response to confirm the backend successfully handles raw text output without breaking the REST handler.
- **Fan Chat Test**: Verifies that when the Gemini API responds with an error, the fallback engine cleanly catches the rejection and answers the query using internal regex keyword matching.
- **Endpoint Tests**: Uses `supertest` to mock REST connections, validating schemas, health states, and error handling.

---

## 4. Component & Integration UI Testing

Vitest coupled with React Testing Library executes in a `jsdom` environment to verify critical client UI components and layout logic:

```
client/src/tests/
├── App.test.tsx            # Verifies SSE connection link state, loaders, and tab switches
├── Dashboard.test.tsx      # Renders KPI panels, charts, and debounced briefings
├── FanPortal.test.tsx      # Manages language selector, recommended gates, and chat submission
├── VolunteerPortal.test.tsx # Verifies active rosters, reassignment status tags, and zone loads
├── SecurityPortal.test.tsx  # Verifies heatmap density colors, evacuation comparisons, and plans
└── Widget.test.tsx         # Assures widget rendering logic
```

### Running the Test Suite

You can execute the entire monorepo testing suite (both server and client) with a single command from the root directory:

```bash
npm test
```

This runs both test runner instances in parallel or sequentially depending on workspace flags, ensuring full CI pipeline compliance.
