# Chrome Web Store Listing & Store Assets - Auto Fill Pro v2.0

## 1. Store Metadata

- **Extension Name:** Auto Fill Pro: Privacy Form Auto-Filler
- **Short Description (132 chars max):**  
  Fill job applications, scholarship portals, and campus forms with 90%+ accuracy. Zero telemetry, local-only storage, 100% private.
- **Category:** Productivity / Workflow
- **Languages:** English
- **Pricing:** Free (optional Pro upgrade via isolated feature flag)

---

## 2. Detailed Store Description (Formatted for CWS)

Tired of typing your personal, academic, and professional details into hundreds of job applications, scholarship portals, and campus placement drives?

**Auto Fill Pro** is the intelligent, privacy-first form auto-filler built specifically for applicants. Unlike generic autofill tools, Auto Fill Pro understands complex multi-tier education tables (10th, 12th, Graduation, Post-Graduation), regional Indian scholarship portals (NSP, MahaDBT, UP Scholarship), and major ATS platforms (Greenhouse, Lever, Workday, Taleo, SmartRecruiters).

### 🛡️ Uncompromising Privacy & Safety (Zero Exceptions)
- **100% On-Device & Zero Telemetry:** Zero external servers, zero analytics, zero network requests. Your data never leaves your device.
- **Hard Safety Blacklist:** NEVER fills or stores passwords, OTPs, CAPTCHAs, credit cards, bank accounts, IFSC, Aadhaar, PAN, or government IDs.
- **No Checkbox Ticking & No Auto-Submitting:** Never checks declaration/consent boxes, and never clicks Submit. You remain in full control.
- **Non-Destructive:** Preserves existing form entries unless you explicitly choose to overwrite.

### ⚡ Key Capabilities
- **Academic Disambiguation:** Intelligently separates 10th (SSC), 12th (HSC), Graduation, and Post-Graduation details in complex tables and fieldsets.
- **Smarter Matching Engine:** Synonym dictionary with fuzzy typo-tolerance and confidence highlighting (yellow outline for unverified fields).
- **Hard Widgets & Custom Dropdowns:** Works seamlessly with React-Select, MUI Autocomplete, Select2, and Google Forms ARIA listboxes and radio buttons.
- **Multi-Step Forms & Repeating Rows:** "Fill this step" action for multi-page wizards and automated "Add Experience / Education" row filling.
- **Local PDF Resume Import:** Extract name, contact info, skills, and education directly from your PDF resume on-device with zero cloud processing.
- **"Teach This Field":** Right-click any custom input to map it to a profile field and remember it for that website.
- **Preview & Undo:** Review matched fields in an interactive preview table before applying, or instantly revert with the 1-click Undo button.
- **Web Crypto Encryption:** Optional master PIN protection using PBKDF2 (100k rounds) and 256-bit AES-GCM encryption.

---

## 3. Chrome Web Store Permissions Justification

| Permission | Technical Requirement & Justification |
| :--- | :--- |
| `activeTab` | Required to inspect form fields and apply profile values only when the user explicitly triggers autofill on the active tab via toolbar click, shortcut, or context menu. |
| `storage` | Required to store the user's encrypted profiles, custom site mappings, and general settings locally within `chrome.storage.local`. |
| `contextMenus` | Required to surface right-click actions ("Fill Current Form", "Fill Active Step", "Teach This Field") for fast keyboardless access. |
| `scripting` | Required to inject local content helper scripts into the active tab on demand without maintaining permanent background page scripts. |
| `optional_host_permissions (<all_urls>)` | Requested optionally at runtime only if the user chooses to enable the floating quick-fill button across websites. Not requested on install. |

---

## 4. Screenshot Checklist (1280x800 px or 640x400 px)

1. **Screenshot 1: The One-Click Fill (Job Application ATS)**
   - *Visual:* Auto Fill Pro filling a Greenhouse/Lever application with green success indicators and floating badge.
   - *Caption:* "Auto-fill complex job applications in one click with 90%+ accuracy."

2. **Screenshot 2: Scholarship & Education Disambiguation**
   - *Visual:* State scholarship portal table displaying 10th, 12th, and Graduation rows filled with distinct board, passing year, and percentages.
   - *Caption:* "Intelligent education hierarchy: accurately separates 10th, 12th, and Bachelor degree rows."

3. **Screenshot 3: Preview Before Fill & Undo Safety**
   - *Visual:* Sleek review modal displaying detected fields with individual checkboxes and confidence ratings.
   - *Caption:* "Review before you fill: full control with per-field toggles and instant Undo."

4. **Screenshot 4: Multi-Profile & Documents Management**
   - *Visual:* Options page displaying tabbed profile editor, IndexedDB document manager, and Dark Mode theme.
   - *Caption:* "Manage multiple profiles, store resumes in IndexedDB, and customize site rules."

5. **Screenshot 5: Web Crypto 256-Bit Security**
   - *Visual:* Master PIN prompt overlay highlighting zero-telemetry and client-side encryption.
   - *Caption:* "100% private & zero telemetry: encrypted with AES-256-GCM right on your device."

---

## 5. Keyboard Shortcuts
- `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`): Quick auto-fill active form
- `Alt+Shift+F`: Open extension popup
