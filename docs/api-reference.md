# API Reference — Pulse360

This document describes all API endpoints and real-time streams exposed by the Pulse360 Express server.

---

## 1. Global Endpoints

### Health Check
Verify the availability, operational mode, and server metrics.

*   **URL**: `/api/health`
*   **Method**: `GET`
*   **Response Codes**: `200 OK`
*   **Response Body**:
    ```json
    {
      "status": "ok",
      "service": "Pulse360",
      "version": "1.0.0",
      "timestamp": "2026-07-11T17:27:44.159Z"
    }
    ```

---

## 2. Real-Time Streaming Endpoints

### Intelligence Stream (SSE)
Establishes a persistent Server-Sent Events (SSE) connection streaming current telemetry, future predictions, and coordination recommendations.

*   **URL**: `/api/intelligence/stream`
*   **Method**: `GET`
*   **Headers Required**:
    *   `Content-Type`: `text/event-stream`
    *   `Cache-Control`: `no-cache`
    *   `Connection`: `keep-alive`
*   **Data Payload (`data: <JSON>`)**:
    ```json
    {
      "telemetry": {
        "timestamp": "2026-07-11T17:27:44.159Z",
        "gates": [
          { "id": "g1", "name": "Gate 1 (North)", "queueTimeMinutes": 16, "capacityPercent": 40 }
        ],
        "zones": [
          { "id": "z1", "name": "North Concourse", "crowdDensityPercent": 49 }
        ],
        "transport": [
          { "id": "t1", "type": "metro", "nextArrivalMinutes": 11, "expectedPassengers": 450 }
        ],
        "sustainability": {
          "energyUsageKw": 3450,
          "waterUsageLiters": 12400,
          "wasteKg: 420
        },
        "volunteers": [
          { "id": "v1", "name": "Alice M.", "zoneId": "z1", "status": "active" }
        ]
      },
      "predictions": {
        "currentTelemetry": { ... },
        "risks": [
          {
            "id": "r-g6",
            "category": "crowd",
            "targetId": "g6",
            "title": "Impending Metro Surge at Gate 6",
            "probabilityPercent": 92,
            "timeToImpactMinutes": 11,
            "reasoning": [
              "Metro arriving in 11 minutes will unload 450 passengers.",
              "Current gate queue wait is 26 minutes."
            ]
          }
        ],
        "timeline": {
          "gates": {
            "g6": [
              { "timeOffsetMinutes": 10, "value": 87, "confidencePercent": 90 }
            ]
          }
        }
      },
      "recommendations": [
        {
          "id": "rec-vol-g6",
          "domain": "volunteer",
          "action": "Reassign 5 volunteers from South Concourse to Gate 6",
          "reasoning": "Expected metro surge in 11 minutes will overwhelm current staff.",
          "priority": "high"
        }
      ]
    }
    ```

---

## 3. Generative AI Endpoints

### AI Operational Briefing
Fetches an AI-summarized briefing of stadium operations for command-center organizers.

*   **URL**: `/api/ai/briefing`
*   **Method**: `GET`
*   **Rate Limits**: 20 requests per minute.
*   **Response Body**:
    ```json
    {
      "briefing": "OPERATIONAL STATUS: AMBER. 1 risk(s) identified. PRIORITY: \"Impending Metro Surge at Gate 6\" with 92% probability...",
      "generatedAt": "2026-07-11T17:27:44.649Z"
    }
    ```

---

### Multilingual Fan Assistant
POST endpoint to converse with the contextual stadium helper.

*   **URL**: `/api/ai/fan-assist`
*   **Method**: `POST`
*   **Rate Limits**: 20 requests per minute.
*   **Request Body Validation (Zod Schema)**:
    *   `message`: String (min: 1, max: 300 characters).
    *   `language`: Enum (`English`, `Spanish`, `French`, `Arabic`, `Portuguese`, `German`, `Japanese`, `Korean`).
*   **Sample Payload**:
    ```json
    {
      "message": "Which gate is best to enter through?",
      "language": "English"
    }
    ```
*   **Response Body**:
    ```json
    {
      "reply": "Your best entry right now is Gate 1 (North) — only a 16-minute wait. Gate 6 is currently congested, so I'd avoid that one!",
      "language": "English"
    }
    ```
