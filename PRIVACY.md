# Privacy Policy - Auto Fill Pro v2.0

**Effective Date:** November 21, 2026  
**Last Updated:** November 21, 2026

Auto Fill Pro is built on an uncompromising **privacy-first, zero-telemetry** architecture. We believe your personal, academic, and professional information belongs solely to you.

---

## 1. Zero External Data Collection (100% On-Device)
- **No Analytics & No Tracking:** Auto Fill Pro contains zero tracking scripts, telemetry, or analytics beacons (no Google Analytics, Mixpanel, Sentry, or external trackers).
- **No Remote Network Calls:** The extension makes **zero outbound network requests** during operation. All field detection, fuzzy matching, resume parsing, and document handling occur entirely within your local browser process.
- **No Remote Code Execution:** The extension strictly complies with Manifest V3 and executes only locally bundled, audited JavaScript.

---

## 2. Hard Safety Blacklist (Never Filled or Stored)
Auto Fill Pro enforces non-negotiable security guardrails at the DOM parser level. The extension will **never** detect, fill, prompt for, or store any of the following sensitive credentials:
- Passwords, passphrases, and security question answers
- One-Time Passwords (OTPs) and 2FA authentication codes
- CAPTCHA challenge inputs
- Credit/Debit card numbers, CVV/CVC codes, and card expiration dates
- Bank account numbers, IFSC codes, and routing numbers
- Aadhaar numbers (UIDAI), PAN card numbers, and Social Security Numbers (SSN)
- Any other government identification numbers

---

## 3. Strict Non-Destructive Operation
- **No Checkbox / Consent Ticking:** Auto Fill Pro will never automatically check checkboxes (such as terms of service agreements, privacy policies, or legal declarations).
- **No Form Submissions:** Auto Fill Pro will never click submit, apply, or register buttons. The final review and submission are always in your hands.
- **No Unintended Overwrites:** Existing form entries are never overwritten unless you explicitly enable the "Overwrite existing values" toggle in Settings.

---

## 4. Local Storage & Encryption
- **Storage Locations:** Your profile data is stored exclusively within your browser's sandboxed `chrome.storage.local`. File attachments (resumes, photos, marksheets) are stored in client-side `IndexedDB`.
- **Optional Web Crypto AES-GCM Encryption:** When you configure a master PIN, all profile data is encrypted using 256-bit AES-GCM with a key derived from PBKDF2 (100,000 iterations of SHA-256) via the standard W3C Web Crypto API. Your unencrypted data never touches disk storage without your PIN unlock.

---

## 5. Permissions Justification
- `activeTab`: Used to access and fill the web form on the currently active tab when you click the extension action, press `Ctrl+Shift+F`, or click the floating fill trigger.
- `storage`: Used to persist your applicant profiles, site preferences, and custom mappings locally on your machine.
- `contextMenus`: Used to provide convenient right-click options ("Auto Fill Pro -> Fill Current Form", "Teach This Field").
- `scripting`: Used to inject local helper scripts into the active tab on demand, adhering to Chrome's principle of least privilege.
- `optional_host_permissions (<all_urls>)`: Allows users to optionally grant automated form detection across all web pages without requiring broad initial permissions at install time.

---

## 6. User Rights & Data Portability
- You can view, edit, export (JSON), and permanently delete all stored profiles and documents at any time via the Options page (`chrome://extensions/?options=...`).
- Uninstalling the extension completely purges all local storage and IndexedDB databases created by Auto Fill Pro.

---

## 7. Contact
For security inquiries, open-source review, or bug reports, please refer to the project repository.
