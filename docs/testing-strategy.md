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

---

## 4. End-to-End (E2E) Testing Strategy

Playwright test suites execute headlessly to verify critical UI pathways:

```
tests/e2e/
├── dashboard.spec.ts   # Checks KPI updates, tab switches, and live SSE loading.
├── fan-chat.spec.ts    # Enters a question, submits, and checks if messages append to history.
└── security.spec.ts    # Triggers drill mode and checks if the evacuation timer scales.
```

### Sample E2E Script Workflow (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('Fan Portal multilingual chat assistant renders answers', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Click on Fan Portal tab
  await page.click('button:has-text("Fan Portal")');
  
  // Type message in chatbot
  await page.fill('input[placeholder*="Ask anything"]', 'Where is the best gate?');
  await page.press('input[placeholder*="Ask anything"]', 'Enter');
  
  // Verify chat bubbles appear
  await expect(page.locator('.chat-messages')).toContainText('PULSE AI');
});
```
