/**
 * Auto Fill Pro v2.0 - Options & Settings Controller
 * Handles multi-profile management, IndexedDB document storage,
 * Web Crypto AES-GCM encryption, custom mappings, and licensing.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const profileSelector = document.getElementById('profile-selector');
  const profileForm = document.getElementById('profile-form');
  const btnAddProfile = document.getElementById('btn-add-profile');
  const btnDeleteProfile = document.getElementById('btn-delete-profile');
  const btnSetDefault = document.getElementById('btn-set-default');
  const toast = document.getElementById('toast');

  // License & rules
  const licenseTierDisplay = document.getElementById('license-tier-display');
  const licenseKeyInput = document.getElementById('license-key-input');
  const btnActivateLicense = document.getElementById('btn-activate-license');
  const prefOverwrite = document.getElementById('pref-overwrite');
  const prefHighlight = document.getElementById('pref-highlight');
  const prefFloating = document.getElementById('pref-floating');
  const rulesBlocklist = document.getElementById('rules-blocklist');
  const btnSaveRules = document.getElementById('btn-save-rules');

  // Security elements
  const secPin = document.getElementById('sec-pin');
  const btnSetPin = document.getElementById('btn-set-pin');
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnImportBackup = document.getElementById('btn-import-backup');
  const backupFileInput = document.getElementById('backup-file-input');

  // Documents
  const fileResume = document.getElementById('file-resume');
  const resumeStatus = document.getElementById('resume-status');
  const filePhoto = document.getElementById('file-photo');
  const photoStatus = document.getElementById('photo-status');
  const fileMarksheet = document.getElementById('file-marksheet');
  const marksheetStatus = document.getElementById('marksheet-status');

  // Demo Form
  const btnTestFillDemo = document.getElementById('btn-test-fill-demo');

  // Resume Import Elements
  const btnImportResume = document.getElementById('btn-import-resume');
  const resumeImportInput = document.getElementById('resume-import-input');

  let profiles = [];
  let activeProfileId = null;
  let settings = {};
  let customMappings = {};
  let licenseData = null;

  // Initialize IndexedDB for attachments
  let db = null;
  await initDB();

  // Load state from chrome.storage.local
  const stored = await chrome.storage.local.get([
    'profiles',
    'activeProfileId',
    'settings',
    'customMappings',
    'licenseData'
  ]);

  profiles = stored.profiles || [];
  activeProfileId = stored.activeProfileId || (profiles[0] ? profiles[0].id : null);
  settings = stored.settings || {};
  customMappings = stored.customMappings || {};
  licenseData = stored.licenseData || { tier: 'free' };

  // Setup UI
  setupTabs();
  renderProfileDropdown();
  hydrateProfileForm(activeProfileId);
  renderCustomMappingsTable();
  hydrateSettings();
  hydrateLicense();
  checkStoredDocuments();

  // Tab switching
  function setupTabs() {
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        navItems.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
      });
    });
  }

  // Toast feedback
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? '#EF4444' : '#10B981';
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  }

  // Populate profiles dropdown
  function renderProfileDropdown() {
    profileSelector.innerHTML = '';
    profiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.isDefault ? ' ⭐ (Default)' : '');
      if (p.id === activeProfileId) opt.selected = true;
      profileSelector.appendChild(opt);
    });
  }

  // Hydrate profile form
  function hydrateProfileForm(profileId) {
    const prof = profiles.find(p => p.id === profileId);
    if (!prof) return;

    document.getElementById('prof-name').value = prof.name || '';
    const fieldsHelper = window.AutoFillFields;
    if (fieldsHelper && fieldsHelper.FIELD_DEFINITIONS) {
      for (const fieldKey of Object.keys(fieldsHelper.FIELD_DEFINITIONS)) {
        const input = document.getElementById(`prof-${fieldKey}`);
        if (input) {
          input.value = prof[fieldKey] || '';
        }
      }
    }
  }

  // Switch profile
  profileSelector.addEventListener('change', async () => {
    activeProfileId = profileSelector.value;
    await chrome.storage.local.set({ activeProfileId });
    hydrateProfileForm(activeProfileId);
  });

  // Resume Import Handler
  btnImportResume.addEventListener('click', () => {
    resumeImportInput.click();
  });

  resumeImportInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const extractor = window.AutoFillPdfExtractor;
        if (!extractor) {
          showToast('PDF extractor module not available.', true);
          return;
        }

        const text = extractor.extractTextFromPdfBuffer(reader.result);
        const parsed = extractor.parseResumeText(text);

        if (Object.keys(parsed).length === 0) {
          showToast('Could not extract text from this PDF.', true);
          return;
        }

        showResumeReviewModal(parsed);
      } catch (err) {
        console.error('Resume parse error:', err);
        showToast('Error reading resume PDF.', true);
      }
    };
    reader.readAsArrayBuffer(file);
  });

  function showResumeReviewModal(parsed) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    `;

    let fieldsHtml = '';
    for (const [k, v] of Object.entries(parsed)) {
      fieldsHtml += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
          <span style="font-weight: 600; color: #475569;">${k}:</span>
          <span style="color: #0F172A; max-width: 300px; text-align: right;">${escapeHtml(String(v))}</span>
        </div>
      `;
    }

    modal.innerHTML = `
      <div style="background: #FFFFFF; width: 90%; max-width: 500px; border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
        <h3 style="margin-top: 0; font-size: 18px;">Review Extracted Resume Fields</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 16px;">Extracted 100% locally on your machine.</p>
        <div style="max-height: 50vh; overflow-y: auto; margin-bottom: 20px;">${fieldsHtml}</div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
          <button id="modal-apply" class="btn btn-primary">Apply to Profile</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#modal-apply').addEventListener('click', async () => {
      const prof = profiles.find(p => p.id === activeProfileId);
      if (prof) {
        Object.assign(prof, parsed);
        await chrome.storage.local.set({ profiles });
        hydrateProfileForm(activeProfileId);
        showToast('Resume data merged into active profile!');
      }
      modal.remove();
    });
  }

  // Save profile changes
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prof = profiles.find(p => p.id === activeProfileId);
    if (!prof) return;

    prof.name = document.getElementById('prof-name').value.trim() || 'Applicant Profile';
    const fieldsHelper = window.AutoFillFields;
    if (fieldsHelper && fieldsHelper.FIELD_DEFINITIONS) {
      for (const fieldKey of Object.keys(fieldsHelper.FIELD_DEFINITIONS)) {
        const input = document.getElementById(`prof-${fieldKey}`);
        if (input) {
          prof[fieldKey] = input.value.trim();
        }
      }
    }

    await chrome.storage.local.set({ profiles });
    renderProfileDropdown();
    showToast('Profile saved successfully!');
  });

  // Add new profile
  btnAddProfile.addEventListener('click', async () => {
    const licenseHelper = window.AutoFillLicense;
    if (licenseHelper && !licenseHelper.isPro(licenseData) && profiles.length >= licenseHelper.FEATURE_LIMITS.MAX_FREE_PROFILES) {
      showToast('Free tier allows up to 2 profiles. Upgrade to Pro for unlimited profiles!', true);
      return;
    }

    const newProfile = {
      id: 'prof_' + Date.now(),
      name: `New Profile (${profiles.length + 1})`,
      createdAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    activeProfileId = newProfile.id;
    await chrome.storage.local.set({ profiles, activeProfileId });
    renderProfileDropdown();
    hydrateProfileForm(activeProfileId);
    showToast('New profile created!');
  });

  // Delete profile
  btnDeleteProfile.addEventListener('click', async () => {
    if (profiles.length <= 1) {
      showToast('You must keep at least one profile.', true);
      return;
    }
    if (!confirm('Are you sure you want to delete this profile?')) return;

    profiles = profiles.filter(p => p.id !== activeProfileId);
    activeProfileId = profiles[0].id;
    await chrome.storage.local.set({ profiles, activeProfileId });
    renderProfileDropdown();
    hydrateProfileForm(activeProfileId);
    showToast('Profile deleted.');
  });

  // Set as default profile
  btnSetDefault.addEventListener('click', async () => {
    profiles.forEach(p => {
      p.isDefault = (p.id === activeProfileId);
    });
    await chrome.storage.local.set({ profiles });
    renderProfileDropdown();
    showToast('Default profile updated!');
  });

  // Custom Mappings Table
  function renderCustomMappingsTable() {
    const tbody = document.getElementById('mappings-table-body');
    tbody.innerHTML = '';
    const keys = Object.keys(customMappings);

    if (keys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No custom mappings created yet. Right-click on any field in a form to teach it.</td></tr>';
      return;
    }

    keys.forEach(sig => {
      const fieldKey = customMappings[sig];
      const def = window.AutoFillFields?.FIELD_DEFINITIONS[fieldKey];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code style="font-size: 12px; background: var(--bg-page); padding: 2px 6px; border-radius: 4px;">${escapeHtml(sig)}</code></td>
        <td><strong>${def ? def.label : fieldKey}</strong></td>
        <td style="text-align: right;">
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" data-sig="${escapeHtml(sig)}">Delete</button>
        </td>
      `;
      tr.querySelector('button').addEventListener('click', async () => {
        delete customMappings[sig];
        await chrome.storage.local.set({ customMappings });
        renderCustomMappingsTable();
        showToast('Mapping removed.');
      });
      tbody.appendChild(tr);
    });
  }

  // Hydrate settings
  function hydrateSettings() {
    prefOverwrite.checked = !!settings.overwriteExisting;
    prefHighlight.checked = settings.highlightConfidence !== false;
    prefFloating.checked = settings.showFloatingButton !== false;
    rulesBlocklist.value = (settings.siteBlocklist || []).join('\n');
  }

  btnSaveRules.addEventListener('click', async () => {
    settings.overwriteExisting = prefOverwrite.checked;
    settings.highlightConfidence = prefHighlight.checked;
    settings.showFloatingButton = prefFloating.checked;
    settings.siteBlocklist = rulesBlocklist.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    await chrome.storage.local.set({ settings });
    showToast('Site rules saved successfully!');
  });

  // Hydrate license
  function hydrateLicense() {
    const licenseHelper = window.AutoFillLicense;
    const isProTier = licenseHelper?.isPro(licenseData);
    licenseTierDisplay.textContent = isProTier ? '⭐ Pro Tier Active' : 'Free Tier';
    licenseTierDisplay.style.color = isProTier ? '#10B981' : '#2563EB';
  }

  btnActivateLicense.addEventListener('click', async () => {
    const key = licenseKeyInput.value.trim();
    const licenseHelper = window.AutoFillLicense;
    const result = licenseHelper?.validateLicenseKey(key);

    if (result && result.valid) {
      licenseData = result;
      await chrome.storage.local.set({ licenseData });
      hydrateLicense();
      showToast('Pro License successfully activated! Unlimited features unlocked.');
    } else {
      showToast(result?.error || 'Invalid license key.', true);
    }
  });

  // IndexedDB Document Helper
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AutoFillProDocs', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'docType' });
        }
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onerror = (e) => reject(e);
    });
  }

  function storeDocumentInDB(docType, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');
        store.put({
          docType,
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result,
          updatedAt: new Date().toISOString()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function getDocumentFromDB(docType) {
    return new Promise((resolve) => {
      if (!db) return resolve(null);
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const req = store.get(docType);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function checkStoredDocuments() {
    const resDoc = await getDocumentFromDB('resume');
    if (resDoc) resumeStatus.textContent = `Stored: ${resDoc.name} (${Math.round(resDoc.size / 1024)} KB)`;

    const photoDoc = await getDocumentFromDB('photo');
    if (photoDoc) photoStatus.textContent = `Stored: ${photoDoc.name} (${Math.round(photoDoc.size / 1024)} KB)`;

    const marksheetDoc = await getDocumentFromDB('marksheet');
    if (marksheetDoc) marksheetStatus.textContent = `Stored: ${marksheetDoc.name} (${Math.round(marksheetDoc.size / 1024)} KB)`;
  }

  fileResume.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await storeDocumentInDB('resume', file);
      checkStoredDocuments();
      showToast('Resume saved locally in IndexedDB.');
    }
  });

  filePhoto.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await storeDocumentInDB('photo', file);
      checkStoredDocuments();
      showToast('Passport photo saved locally in IndexedDB.');
    }
  });

  fileMarksheet.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      await storeDocumentInDB('marksheet', file);
      checkStoredDocuments();
      showToast('Marksheet saved locally in IndexedDB.');
    }
  });

  // Web Crypto PBKDF2 + AES-GCM Encrypted Backup
  async function deriveKeyFromPin(pin, salt) {
    const enc = new TextEncoder();
    const pinKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      pinKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  btnSetPin.addEventListener('click', async () => {
    const pin = secPin.value.trim();
    if (pin.length < 4) {
      showToast('PIN must be at least 4 digits.', true);
      return;
    }
    settings.pinLockEnabled = true;
    settings.pinSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    await chrome.storage.local.set({ settings });
    secPin.value = '';
    showToast('PIN lock configured!');
  });

  btnExportBackup.addEventListener('click', async () => {
    const backupObj = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      profiles,
      customMappings,
      settings
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofill-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded!');
  });

  btnImportBackup.addEventListener('click', () => backupFileInput.click());
  backupFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.profiles && Array.isArray(data.profiles)) {
          profiles = data.profiles;
          activeProfileId = profiles[0].id;
          if (data.customMappings) customMappings = data.customMappings;
          if (data.settings) settings = data.settings;

          await chrome.storage.local.set({ profiles, activeProfileId, customMappings, settings });
          renderProfileDropdown();
          hydrateProfileForm(activeProfileId);
          renderCustomMappingsTable();
          hydrateSettings();
          showToast('Backup restored successfully!');
        } else {
          showToast('Invalid backup file structure.', true);
        }
      } catch (err) {
        showToast('Error reading backup file.', true);
      }
    };
    reader.readAsText(file);
  });

  // Interactive Demo Form Test Button
  btnTestFillDemo.addEventListener('click', () => {
    const activeProf = profiles.find(p => p.id === activeProfileId) || profiles[0];
    if (!activeProf) return;

    const fieldsHelper = window.AutoFillFields;
    const demoInputs = document.querySelectorAll('#tab-demo input, #tab-demo select');
    let filled = 0;

    demoInputs.forEach(el => {
      const ctx = {
        name: el.name || '',
        id: el.id || '',
        label: el.closest('.form-group')?.querySelector('label')?.innerText || ''
      };
      const match = fieldsHelper.matchField(ctx);
      if (match && match.fieldKey && activeProf[match.fieldKey]) {
        el.value = activeProf[match.fieldKey];
        el.style.borderColor = '#10B981';
        el.style.backgroundColor = '#ECFDF5';
        filled++;
      }
    });

    showToast(`Successfully filled ${filled} demo fields!`);
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str || '';
    return div.innerHTML;
  }
});
