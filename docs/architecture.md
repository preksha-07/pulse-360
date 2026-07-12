# Architecture Overview — Pulse360

This document describes the technical architecture, data flow, and components of the Pulse360 Predictive AI Stadium Intelligence platform.

---

## 1. System Topology

![Pulse360 System Topology](assets/architecture.png)

Pulse360 is built as a modular monorepo containing a React frontend and an Express backend. Real-time updates are pushed to the client using **Server-Sent Events (SSE)**, which establishes a persistent, memory-efficient pipeline for streaming telemetry, future predictions, and coordinated recommendations.

```mermaid
graph TD
    subgraph "External Clients"
        FC[Fan Client / Mobile]
        OC[Organizer Command Center]
        SC[Security Client]
        VC[Volunteer Client]
    end

    subgraph "Express Server Backend"
        API[Express Router / API Server]
        SSE[SSE Stream Router]
        TE[Telemetry Simulation Engine]
        PE[Prediction Engine]
        CA[Agent Coordinator]
    end

    subgraph "Generative AI Layer"
        Gemini[Google Gemini 2.0 Flash API]
    end

    %% Client Interactions
    FC -->|POST /api/ai/fan-assist| API
    OC -->|GET /api/ai/briefing| API
    OC & FC & SC & VC -->|GET /api/intelligence/stream| SSE

    %% Server Internal Data Flow
    TE -->|State Tick| PE
    PE -->|10m/20m/30m timeline + risks| CA
    CA -->|Synthesized recommendations| SSE
    
    %% AI Interactions
    API <-->|Generate Briefing / Chat Response| Gemini
```

---

## 2. Telemetry Simulation Engine (`server/src/telemetry`)

The `TelemetryEngine` acts as a state machine simulating active stadium nodes during a matchday. 
- **Interval**: Mutates state and ticks every 2 seconds.
- **Data Models**:
  - **Gates**: Capacity, current queue times, and accessibility status.
  - **Zones**: Crowding metrics in concourses, stands, and amenities.
  - **Transport**: Metro and bus arrivals, passenger counts, and countdowns.
  - **Sustainability**: Live energy usage (kW), water consumption (liters), and waste generation (kg).
  - **Volunteers**: Individual roster names, current zone locations, and status (active, reassigning, break).

---

## 3. Prediction Engine (`server/src/prediction`)

The `PredictionEngine` transforms raw telemetry data into prospective state vectors. It forecasts stadium conditions at **+10, +20, and +30 minute** offsets.

### Prediction Logic
- **Crowd Interpolation**: Interpolates path capacity over time based on transport countdown schedules.
- **Event-Driven Surges**: Simulates high-density load propagation (e.g. when a metro train arrives, a future spike is propagated to Gate 6).
- **Risk Assessment**: Generates structural risk warnings with computed probability thresholds when densities are projected to exceed limits.

---

## 4. Multi-Agent Coordinator Layer (`server/src/agents`)

The coordinator processes the `PredictionState` and triggers action plans. It simulates five distinct operational agents:

```mermaid
classDiagram
    class CoordinatorAgent {
        +process(predictionState) AgentRecommendation[]
    }
    class CrowdAgent {
        +evaluate() AgentRecommendation
    }
    class NavigationAgent {
        +evaluate() AgentRecommendation
    }
    class VolunteerAgent {
        +evaluate() AgentRecommendation
    }
    class EmergencyAgent {
        +evaluate() AgentRecommendation
    }
    class SustainabilityAgent {
        +evaluate() AgentRecommendation
    }

    CoordinatorAgent --> CrowdAgent
    CoordinatorAgent --> NavigationAgent
    CoordinatorAgent --> VolunteerAgent
    CoordinatorAgent --> EmergencyAgent
    CoordinatorAgent --> SustainabilityAgent
```

- **Crowd Agent**: Monitors gate overflow risks.
- **Navigation Agent**: Directs entry distribution.
- **Volunteer Agent**: Redeploys personnel to overloaded sectors.
- **Emergency Agent**: Triggers evacuation routines.
- **Sustainability Agent**: Implements energy-saving or waste-mitigation measures.

All actions are synthesized, assigned a priority level (`low`, `medium`, `high`, `critical`), and combined with explicit operational reasoning.

---

## 5. Client Component Architecture

The React client exposes role-specific portal views that consume the unified Server-Sent Event stream:

- **`Dashboard.tsx` (Command Center)**: Evaluates live KPIs, tracks the timeline chart, and renders the operational briefing.
- **`FanPortal.tsx` (Fan Companion)**: Shows personalized gates, transport details, and houses the multilingual Gemini chatbot.
- **`VolunteerPortal.tsx` (Task Manager)**: Handles task assignments and live roster shifts.
- **`SecurityPortal.tsx` (Threat Panel)**: Shows heatmaps, live risks, and controls evacuation simulators.

---

## 6. End-to-End Live Sequence Data Flow

The following sequence diagram details how real-time ticks flow from the telemetry simulation engine, calculate predictions, trigger the coordinator agent, and propagate downstream to clients via the persistent Server-Sent Events (SSE) connection:

```mermaid
sequenceDiagram
    autonumber
    participant Engine as TelemetryEngine (Server)
    participant Predictor as PredictionEngine (Server)
    participant Coordinator as CoordinatorAgent (Server)
    participant Stream as SSE Router (Server)
    participant Client as React App (Client Browser)
    participant Gemini as Gemini AI Layer

    %% Connection Setup
    Client->>Stream: Establish connection (GET /api/intelligence/stream)
    Stream-->>Client: HTTP 200 OK (Keep-Alive, Event-Stream)

    %% Ticking loop
    loop Every 2 Seconds
        Engine->>Engine: Mutate state (Fluctuate stands, advance metro)
        Engine->>Predictor: Dispatch State Tick (current telemetry vectors)
        Predictor->>Predictor: Compute timelines (+10m/+20m/+30m offsets)
        Predictor->>Predictor: Evaluate risk overload flags (>80% capacity)
        Predictor->>Coordinator: Forward PredictionState (telemetry + timeline + risks)
        Coordinator->>Coordinator: Evaluate agent rules (Crowd, Emergency, Volunteer, etc.)
        Coordinator->>Stream: Broadcast unified IntelligencePayload
        Stream->>Client: Send SSE message (data: JSON string)
        Client->>Client: Render dynamic components & re-draw heatmaps
    end

    %% Gemini chatbot interaction
    Note over Client, Gemini: Multilingual Fan Chatbot Flow
    Client->>Gemini: Submit question (POST /api/ai/fan-assist)
    Gemini->>Gemini: Call Gemini 2.0 Flash API (or fallback mock)
    Gemini-->>Client: Respond with context-aware reply
    Client->>Client: Render answer bubble in chat panel
```

