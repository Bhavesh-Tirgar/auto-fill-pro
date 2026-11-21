# STATE: Auto Fill Pro v2.0

## Current Milestone
- Phase 1: Real-Form Testing & Base Extension Harness

## Active Task
- Establishing extension core modules (`manifest.json`, `fields.js`, `content.js`, `background.js`, `popup.html/js`, `options.html/js`) and setting up the Playwright test suite in `/test`.

## Key Decisions & Invariants
- Manifest V3 compliant.
- Pure vanilla JS, no external runtime dependencies or bundlers needed for the extension itself.
- 100% on-device operation. No external network requests, analytics, or telemetry.
- Hard safety rules:
  - NEVER touch passwords, OTPs, CAPTCHAs, credit cards, CVVs, bank accounts, IFSC, Aadhaar, PAN or government IDs.
  - NEVER check checkboxes or submit forms automatically.
  - NEVER overwrite non-empty fields unless explicitly enabled by user setting.
- Chromium / Edge compatibility tested via Playwright.

## Blockers
- None.
