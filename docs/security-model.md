# Security Model — Pulse360

This document describes the security protocols, sanitization boundaries, and request protections implemented in Pulse360.

---

## 1. Network Boundary Security

### CORS Protection
Cross-Origin Resource Sharing is locked down in `server/src/index.ts`. Access is restricted to designated local environments:
*   **Whitelisted Origins**: `http://localhost:5173`, `http://localhost:4173`
*   **Unauthorized Origins**: Instantly blocked by express middleware.

### Helmet HTTP Headers
`helmet` is configured to secure the Express responses:
- Prevents Clickjacking (`X-Frame-Options`).
- Disables MIME type sniffing (`X-Content-Type-Options`).
- Blocks Cross-Site Scripting exploits via standard XSS protection headers.

---

## 2. API Abuse & Rate Limiting

We employ split rate limits to protect endpoints based on computational complexity:

```
                  ┌──────────────────────┐
                  │   Incoming Traffic   │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   Standard API Requests            AI Processing Routes
  (/api/health, /stream)       (/api/ai/briefing, /fan-assist)
     [Max: 100/min]                  [Max: 20/min]
```

- **General API Limiter (`/api/`)**: Limits requests to 100 per minute per IP.
- **AI Processing Limiter (`/api/ai/`)**: Restricts expensive LLM generation calls to 20 per minute per IP to prevent API exhaustion.

---

## 3. Input Validation & Request Bounds

### Zod Schema Validation
Input parameters submitted to AI endpoints undergo runtime validation. This stops parameter injection and crashes due to malformed payloads:
```typescript
const FanAssistSchema = z.object({
  message: z.string().min(1).max(300).trim(),
  language: z.enum(['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'German', 'Japanese', 'Korean']).default('English')
});
```

### Strict Payload Bounds
Express JSON body parser limits incoming requests:
```typescript
app.use(express.json({ limit: '10kb' }));
```
Any attempt to submit payloads larger than 10KB is rejected with an HTTP `413 Payload Too Large` status, preventing buffer overflow and memory attacks.

---

## 4. Operational Secrets Security

- **Secrets Handling**: Live API keys are loaded via `process.env.GEMINI_API_KEY`. No raw keys are checked into source control.
- **Git Safeguards**: `.env` is registered in the root `.gitignore` to prevent leakage.
- **Mock Fallback**: If keys are missing, the application switches to safe simulated rules instead of failing or leaking system credentials.
