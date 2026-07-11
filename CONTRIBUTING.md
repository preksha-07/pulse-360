# Contributing to Pulse360

We welcome contributions to Pulse360! To ensure a smooth development process and code quality, please adhere to the following guidelines.

---

## 1. Development Principles

- **TypeScript-First**: All code in the server and client must use strict TypeScript. No loose compiler rules or un-typed parameters.
- **Predictive Grounding**: Ensure all features leverage predictive concepts (+10m/20m/30m) rather than solely real-time overlays.
- **WAI-ARIA Accessibility**: Any newly added UI elements must have appropriate tags, contrast parameters, and label annotations.
- **Security Validation**: All public endpoints must restrict inputs using Zod validations and have appropriate rate-limit limits.

---

## 2. Setting Up Your Environment

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/preksha-07/pulse-360.git
    cd pulse-360
    ```
2.  **Install Node Modules**:
    ```bash
    npm install
    ```
3.  **Setup Environment Files**:
    Copy `server/.env.example` into `server/.env` and edit it to include your `GEMINI_API_KEY`.
4.  **Run Development Servers**:
    - Backend: `cd server && npm run dev`
    - Frontend: `cd client && npm run dev`

---

## 3. Contribution Workflow

1.  **Create an Issue**: Open an issue describing the bug or feature proposal before coding.
2.  **Branch Naming**: Use clean branch labels:
    - `bugfix/issue-number-title`
    - `feature/issue-number-title`
3.  **Create a Pull Request**: Check that all lints and compilations execute cleanly before submitting.
4.  **Tests**: Write unit and integration tests under `tests/` for new logic updates.
