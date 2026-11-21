# ROADMAP: Auto Fill Pro v2.0 (Chrome Web Store Ready)

## Project Vision
A zero-dependency (vanilla JS), hyper-reliable, privacy-first Chrome Extension for automatically filling job applications, scholarship portals, campus placement drives, and complex web forms. Operates 100% on-device with zero telemetry, zero remote code, and strict safety guardrails.

---

## Phases Overview

### Phase 1: Real-Form Testing & Test Harness
- [ ] Initialize `/test` directory with Playwright test harness running unpacked extension in Chromium.
- [ ] Create synthetic local challenge pages:
  - Job application form (contacts, experience, salary, links, dates)
  - Scholarship portal with multi-tier education table (10th/12th/UG/PG)
  - React-style controlled inputs with property descriptor overrides
  - Custom dropdowns (React-Select, Select2, MUI Autocomplete, Google Forms listbox)
  - Multi-step wizard form (Step 1 -> Next -> Step 2 -> Next -> Step 3)
  - Negative test suite (password, OTP, CAPTCHA, card, Aadhaar, PAN untouched; no checkbox clicks; no submit clicks; no overwrites)
- [ ] Snapshot 12 realistic form test suites (Google Forms, Greenhouse, Lever, Workday-style, NSP scholarship, campus placement).
- [ ] Create `FAILURES.md` to record all edge cases and resolutions.

### Phase 2: Smarter Matching & Field Intelligence
- [ ] Build `fields.js` with comprehensive field taxonomy:
  - Personal, contact, address (pin, taluka, state, district), diversity/demographic (domicile, category), education tiers (10th, 12th, UG, PG), professional & salary.
  - Hard safety blacklist (passwords, OTPs, CVVs, card numbers, Aadhaar, PAN, bank accounts, IFSC).
- [ ] Levenshtein / fuzzy string matching with token weighting and confidence scoring (0.0 to 1.0).
- [ ] Education hierarchy disambiguation using DOM ancestor analysis, table headers, and preceding labels.
- [ ] "Teach this field" custom site mappings via context menu and DOM signature generator.
- [ ] Per-site custom mappings manager in options page.

### Phase 3: Hard Widgets & Complex Flows
- [ ] Custom dropdown handlers in `content.js`:
  - React-Select, MUI Autocomplete, Select2, Google Forms `role="listbox"`, ARIA comboboxes.
- [ ] Synthetic event dispatchers (`input`, `change`, `blur`, `keydown`) and React input value tracker setter bypass.
- [ ] Date picker formatters (ISO YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY).
- [ ] Country code phone selector matching.
- [ ] Multi-step form observer with debounced MutationObserver.
- [ ] Repeating sections automation ("Add Experience", "Add Education").

### Phase 4: Smart Extras
- [ ] Local client-side resume parser (PDF text extraction without remote code).
- [ ] Resume review and attribute extraction screen before saving.
- [ ] File upload helper with IndexedDB Blob storage (resume, photo, marksheets) and DataTransfer file injection + manual fallback badge.
- [ ] Profile completeness scoring engine with missing fields breakdown.

### Phase 5: UI Polish & User Experience
- [ ] Icon suite generation (16, 32, 48, 128 px SVG/PNG).
- [ ] First-run onboarding wizard with interactive demo form.
- [ ] Accessible Dark/Light theme with CSS variables and system preference detection.
- [ ] Preview-before-fill modal/flyout with per-field checkboxes.
- [ ] Instant Undo stack for reversing fills.
- [ ] Floating quick-fill badge with show/hide preference.

### Phase 6: Security, Encryption & Permissions
- [ ] Optional PIN/passphrase protection using Web Crypto API (PBKDF2-SHA256, 100k iterations, AES-256-GCM).
- [ ] Encrypted export and import of profile data.
- [ ] Site blacklist and whitelist rules.
- [ ] Permission minimization in `manifest.json` (`activeTab`, `storage`, `contextMenus`, `scripting`, optional host permissions).
- [ ] Graceful error handling on protected browser URLs (`chrome://`, `edge://`).

### Phase 7: Automation & CI
- [ ] `package.json` scripts (`npm test`, `npm run lint`, `npm run package`).
- [ ] GitHub Actions workflow (`.github/workflows/test.yml`).
- [ ] Clean zip packager producing store-ready artifact.

### Phase 8: Release Documentation & Monetization
- [ ] `PRIVACY.md` documentation.
- [ ] Chrome Web Store listing, descriptions, and screenshot checklist.
- [ ] Store permissions justification.
- [ ] Feature-flag licensing module (`license.js`) with Free (2 profiles) vs Pro tiers and mock license validator.
- [ ] Comprehensive final delivery report.
