# Security Policy — Pulse360

We take the security of Pulse360 seriously. This document describes reporting vulnerabilities, security features, and disclosure processes.

---

## 1. Supported Versions

Only the latest release version on the main branch is actively supported with security updates.

| Version | Supported |
| --- | --- |
| 1.0.x | Yes |
| < 1.0.0 | No |

---

## 2. Reporting a Vulnerability

Please do not open GitHub issues to report security vulnerabilities. Instead, report them privately:

1.  Send an email to the repository owner describing the vulnerability.
2.  Provide a detailed description of the vulnerability, step-by-step instructions to reproduce it, and any proof-of-concept scripts.
3.  Allow up to 72 hours for a verification response before taking further actions.

---

## 3. Core Security Controls

Every deployable build of Pulse360 contains:
- **Helmet Headers**: Blocks MIME sniffing, clickjacking, and browser frame injection.
- **Express Rate Limiting**: Limit-throttled APIs (100 req/min for general routes, 20 req/min for Gemini LLM execution).
- **Size-Bounded Parsers**: Rejects POST payloads larger than 10KB to stop buffer overflows.
- **Zod Data Sanitization**: Strict input validation schemas on all public inputs.
