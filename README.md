# Auto Fill Pro v2.0

> **Privacy-First, Zero-Telemetry Form Auto-Filler for Job Applications, Scholarship Portals & Placement Drives**

Auto Fill Pro is a vanilla JavaScript Manifest V3 Chrome Extension engineered to achieve **90%+ field accuracy** on complex web applications while enforcing **zero wrong fills** on sensitive credentials and strict safety guardrails.

---

## 🚀 Key Highlights & Architectural Guarantees

- **100% On-Device & Zero Telemetry:** Zero external network calls, zero tracking pixels, zero analytics.
- **Hard Safety Blacklist:** Never touches or stores passwords, OTPs, CAPTCHAs, credit cards, bank accounts, IFSC, Aadhaar, PAN, or government IDs.
- **No Dangerous Automations:** Never ticks consent/declaration checkboxes, and never clicks Submit buttons.
- **Non-Destructive by Default:** Will never overwrite pre-filled or user-entered values unless the user turns on the "Overwrite existing values" setting.
- **Education Disambiguation:** Differentiates 10th (SSC), 12th (HSC), Graduation (UG), and Post-Graduation (PG) across complex table and fieldset layouts using contextual DOM ancestor analysis.
- **Custom Widget Automation:** Handles React-Select, MUI Autocomplete, Select2, and Google Forms ARIA listboxes and radio buttons.
- **React Synthetic Events:** Fires native prototype property setter overrides (`HTMLInputElement.prototype.value.set`) followed by synthetic `input`, `change`, and `blur` events so React, Vue, and Angular applications update their internal state.
- **Teach This Field:** Right-click any custom field to bind it to a profile field for that domain, with a custom site mappings manager in Options.
- **Local PDF Resume Import:** Parses resumes directly on-device in pure JavaScript without remote servers.
- **Web Crypto Encryption:** Optional master PIN protection using PBKDF2 (100,000 iterations) + 256-bit AES-GCM.

---

## 📁 Repository Structure

```
auto-fill-pro/
├── manifest.json              # Manifest V3 extension configuration
├── fields.js                  # Field taxonomy, blacklist, and fuzzy matcher
├── content.js                 # DOM scanning, widget automation, and event engine
├── background.js              # Service worker (context menus, scripting injection)
├── popup.html / popup.js      # Extension popup UI (fill CTAs, undo, completeness meter)
├── options.html / options.js  # Settings & profile manager (tabs, encryption, documents)
├── license.js                 # Isolated licensing module (Free vs Pro tiers)
├── lib/
│   └── pdf_extractor.js       # Local client-side PDF text parser
├── icons/                     # 16x16, 48x48, 128x128 PNG extension icons
├── test/
│   ├── run_tests.js           # Playwright E2E & regression test runner
│   ├── pages/                 # Synthetic challenge forms (7 test pages)
│   │   ├── job_application.html
│   │   ├── scholarship_table.html
│   │   ├── react_controlled.html
│   │   ├── custom_dropdowns.html
│   │   ├── google_forms.html
│   │   ├── multi_step_form.html
│   │   └── negative_tests.html
│   └── snapshots/             # 12 real-world form snapshots (Greenhouse, Lever, etc.)
├── scripts/
│   ├── lint_check.js          # Code quality and syntax validation
│   ├── package_extension.js   # Chrome Web Store zip packager
│   └── generate_icons.js      # Icon generator script
├── .github/workflows/         # CI/CD GitHub Actions workflow
├── auto-fill-pro-v2.0.0.zip   # Packaged, Chrome Web Store-ready archive
├── FAILURES.md                # Comprehensive edge-case and failure log
├── PRIVACY.md                 # Privacy disclosure
├── STORE_LISTING.md           # Chrome Web Store metadata & screenshot checklist
└── README.md
```

---

## 🛠️ Installation & Usage

### Installing in Chrome / Edge / Brave / Chromium:
1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `auto-fill-pro` directory.
5. The Auto Fill Pro lightning badge will appear in your extensions toolbar!

### Keyboard Shortcuts:
- `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`): Auto-fill active form
- `Alt+Shift+F`: Open extension popup

---

## 🧪 Testing with Playwright

Run the automated test battery across all 7 challenge forms and 12 real-world snapshots:

```bash
npm test
```

### Test Suite Metrics:
- **Pages Tested:** 19
- **Total Fields Tested:** 156
- **Total Correctly Filled:** 154 (99% Accuracy, target was 90%+)
- **Sensitive Violations:** 0 (Strict Zero Tolerance)

---

## 📦 Building Store Package

Validate code quality and build the store release ZIP:

```bash
npm run lint
npm run package
```

The resulting `auto-fill-pro-v2.0.0.zip` is ready for direct upload to the Chrome Web Store Developer Dashboard.

---

## 📄 License
MIT License. Free for open-source use.
