# Accessibility Compliance (a11y) — Pulse360

This document outlines the accessibility strategy, WAI-ARIA standards, and design implementations incorporated into the Pulse360 client interface.

---

## 1. Vision & Standards Alignment

Pulse360 adheres to **WCAG 2.1 Level AA** standards. In high-pressure operational environments like a stadium command center, accessibility features are not optional — they prevent critical errors by ensuring information is readable by all users, including those under stress or with visual/auditory impairments.

---

## 2. Color-Blind & Contrast Design System

We employ a dark NASA Mission Control styling, tailored with specialized high-contrast color codes:

### Color Tokens & Contrast Ratios
- **Background (`--bg-dark` / `#070c18`)** to **Card Foreground (`--gray-100` / `#f3f4f6`)**: Contrast exceeds **7.2:1** (WCAG AAA standard: 7:1).
- **Cyan (`--cyan` / `#00e5ff`)** text is accompanied by a dark background to guarantee readability.
- **Crimson Alert (`--crimson` / `#ff3b3b`)** is backed by an opaque dim card overlay (`rgba(255, 59, 59, 0.12)`) and bordered to stand out cleanly.

### Color-Blind Safeguards
Operational status displays do **not** rely solely on color encoding:
1.  **Heatmap Metrics**: Grid boxes show color accents but also list explicit text densities (e.g. `100%`) alongside labels (`SAFE`, `ELEVATED`, `CRITICAL`).
2.  **Telemetry Dots**: Live indicators blink using animations (`@keyframes blink`) and use adjacent icons (🚇, 👷, ⏱) rather than simple colored circles.
3.  **Risk Priority Tags**: Every prediction item uses explicit text tags (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) instead of color-coded risk flags.

---

## 3. WAI-ARIA & Interactive Roles

Pulse360 features clean semantic HTML markup:

### Dashboard Tabs
Navigational controls use the appropriate ARIA tablist patterns:
```html
<div class="tabs" role="tablist" aria-label="Portal Navigation">
  <button role="tab" aria-selected="true" aria-controls="command-panel" id="tab-command">🏟 Command Center</button>
  <button role="tab" aria-selected="false" aria-controls="fan-panel" id="tab-fan">👤 Fan Portal</button>
  ...
</div>
```

### Screen Reader Friendly Inputs
The Fan Chat assistant uses semantic element naming:
- Text inputs feature explicit `aria-label="Ask anything about the stadium"` and `placeholder="Ask anything in English..."`.
- Chat history logs use `aria-live="polite"` so newly generated AI text blocks are announced immediately.

---

## 4. Semantic Document Hierarchy

Every portal view starts with a single, clear structural hierarchy:
- **`<h1>`**: App Branding Logo (`PULSE360`).
- **`<h2>`**: Portal Title (`FAN PORTAL`, `SECURITY PORTAL`).
- **`<h3>`**: Sub-widget sections (`AI-Recommended Entry`, `Predicted Threats`).

This ensures that assistive technologies like JAWS or VoiceOver can catalog and navigate the layout grid seamlessly.
