/**
 * Auto Fill Pro v2.0 - Content Script
 * Robust DOM traversal, widget automation, synthetic event dispatch,
 * education context disambiguation, undo buffer, and teach-this-field engine.
 */

(() => {
  // Prevent duplicate execution
  if (window.__AutoFillProInitialized) {
    return;
  }
  window.__AutoFillProInitialized = true;

  // Last fill undo history
  let lastFillHistory = [];

  // Active floating button element
  let floatingButtonEl = null;

  /**
   * Helper to fetch active profile and settings
   */
  async function getActiveProfileAndSettings() {
    // Test configuration override if set
    if (window.__AutoFillProTestConfig) {
      return {
        activeProfile: window.__AutoFillProTestConfig.profile,
        settings: window.__AutoFillProTestConfig.settings || {},
        customMappings: window.__AutoFillProTestConfig.customMappings || {},
        hostname: window.location.hostname.toLowerCase()
      };
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get([
        'profiles',
        'activeProfileId',
        'settings',
        'customMappings'
      ]);

      const settings = Object.assign({
        overwriteExisting: false,
        highlightConfidence: true,
        showFloatingButton: true,
        previewBeforeFill: false,
        siteAllowlist: [],
        siteBlocklist: []
      }, data.settings || {});

      // Site filtering
      const hostname = window.location.hostname.toLowerCase();
      if (settings.siteBlocklist && settings.siteBlocklist.some(s => hostname.includes(s.toLowerCase()))) {
        return { blocked: true };
      }
      if (settings.siteAllowlist && settings.siteAllowlist.length > 0) {
        const allowed = settings.siteAllowlist.some(s => hostname.includes(s.toLowerCase()));
        if (!allowed) return { blocked: true };
      }

      const profiles = data.profiles || [];
      const activeProfile = profiles.find(p => p.id === data.activeProfileId) || profiles[0] || null;
      const customMappings = data.customMappings || {};

      return { activeProfile, settings, customMappings, hostname };
    }

    return { blocked: true, reason: 'Chrome storage unavailable' };
  }

  /**
   * Generate unique DOM signature for custom mapping
   */
  function generateFieldSignature(el) {
    const host = window.location.hostname || 'local';
    const id = el.id ? `#${el.id}` : '';
    const name = el.name ? `[name="${el.name}"]` : '';
    const tagName = el.tagName.toLowerCase();
    const type = el.type ? `[type="${el.type}"]` : '';

    if (id) return `${host}:${id}`;
    if (name) return `${host}:${tagName}${name}`;
    
    // Fallback: aria-label or placeholder
    const aria = el.getAttribute('aria-label');
    if (aria) return `${host}:${tagName}[aria-label="${aria}"]`;

    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return `${host}:${tagName}[placeholder="${placeholder}"]`;

    // Path signature
    let path = tagName + type;
    if (el.parentElement) {
      const parentTag = el.parentElement.tagName.toLowerCase();
      const parentClass = el.parentElement.className ? `.${el.parentElement.className.trim().split(/\s+/)[0]}` : '';
      path = `${parentTag}${parentClass} > ${path}`;
    }
    return `${host}:${path}`;
  }

  /**
   * Extract comprehensive descriptive context for an element
   */
  function extractFieldContext(el) {
    let labelText = '';

    // 1. Associated label via 'for'
    if (el.id) {
      try {
        const labelEl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (labelEl) labelText = labelEl.innerText;
      } catch (e) {}
    }

    // 2. Ancestor label
    if (!labelText) {
      const parentLabel = el.closest('label');
      if (parentLabel) {
        labelText = parentLabel.innerText;
      }
    }

    // 3. Preceding sibling or nearby text
    if (!labelText && el.previousElementSibling) {
      const prev = el.previousElementSibling;
      if (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV' || prev.tagName === 'P') {
        labelText = prev.innerText;
      }
    }

    // 4. Ancestor question / form-group label
    if (!labelText && el.closest('.field, .form-group, .question-card, [role="listitem"], .form-item, .row')) {
      const qCard = el.closest('.field, .form-group, .question-card, [role="listitem"], .form-item, .row');
      const headerEl = qCard.querySelector('label, .q-title, span, strong');
      if (headerEl && headerEl !== el) {
        labelText = headerEl.innerText;
      }
    }

    // 5. Table header context
    let tableHeader = '';
    const td = el.closest('td');
    if (td) {
      const cellIndex = td.cellIndex;
      const table = td.closest('table');
      if (table) {
        const thList = table.querySelectorAll('th');
        if (thList && thList[cellIndex]) {
          tableHeader = thList[cellIndex].innerText;
        }
      }
    }

    // 6. Ancestor container context (fieldset, card, section, row)
    const container = el.closest('fieldset, .form-group, .card, .section, [class*="education"], [class*="academic"], tr');
    const containerContext = container ? (container.className + ' ' + container.innerText.slice(0, 300)) : '';

    return {
      name: el.name || '',
      id: el.id || '',
      placeholder: el.placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      autocomplete: el.getAttribute('autocomplete') || '',
      label: labelText.trim(),
      tableHeader: tableHeader.trim(),
      containerContext: containerContext.trim(),
      siteSignature: generateFieldSignature(el)
    };
  }

  /**
   * Dispatch native React/Vue/Angular synthetic input events
   */
  function setNativeValue(element, value) {
    if (!element) return;

    if (element.tagName === 'INPUT') {
      const prototype = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }
    } else if (element.tagName === 'TEXTAREA') {
      const prototype = window.HTMLTextAreaElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }
    } else if (element.tagName === 'SELECT') {
      const prototype = window.HTMLSelectElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }
    }

    // Dispatch lifecycle events
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
  }

  /**
   * Safe Select element matching (by value, text, partial)
   */
  function fillNativeSelect(selectEl, targetValue) {
    if (!selectEl || !targetValue) return false;
    const targetNorm = targetValue.toString().toLowerCase().trim();
    let bestIndex = -1;

    for (let i = 0; i < selectEl.options.length; i++) {
      const opt = selectEl.options[i];
      const optVal = (opt.value || '').toLowerCase().trim();
      const optText = (opt.text || '').toLowerCase().trim();

      if (optVal === targetNorm || optText === targetNorm) {
        bestIndex = i;
        break;
      }
      if (bestIndex === -1 && (optText.includes(targetNorm) || targetNorm.includes(optText))) {
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      selectEl.selectedIndex = bestIndex;
      selectEl.dispatchEvent(new Event('input', { bubbles: true }));
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  /**
   * Handle Custom Dropdowns (React-Select, Select2, MUI Autocomplete, Google Forms listbox)
   */
  async function fillCustomDropdown(container, targetValue) {
    if (!container || !targetValue) return false;
    const targetStr = targetValue.toString().toLowerCase().trim();

    // 1. Google Forms Listbox
    if (container.getAttribute('role') === 'listbox' || container.querySelector('[role="listbox"]')) {
      const listbox = container.getAttribute('role') === 'listbox' ? container : container.querySelector('[role="listbox"]');
      listbox.click();
      await new Promise(r => setTimeout(r, 100));

      const options = document.querySelectorAll('[role="option"], [data-value]');
      for (const opt of options) {
        const text = (opt.innerText || opt.getAttribute('data-value') || '').toLowerCase().trim();
        if (text === targetStr || text.includes(targetStr)) {
          opt.click();
          return true;
        }
      }
    }

    // 2. React-Select
    if (container.matches('[class*="-control"], [class*="Select"]') || container.querySelector('[class*="-control"]')) {
      const control = container.matches('[class*="-control"]') ? container : container.querySelector('[class*="-control"]');
      control.click();
      await new Promise(r => setTimeout(r, 100));

      const input = control.querySelector('input');
      if (input) {
        setNativeValue(input, targetValue);
        await new Promise(r => setTimeout(r, 80));
      }

      const menuOptions = document.querySelectorAll('[class*="-option"], [id*="react-select"], .Select-option');
      for (const opt of menuOptions) {
        const text = opt.innerText.toLowerCase().trim();
        if (text === targetStr || text.includes(targetStr)) {
          opt.click();
          return true;
        }
      }
    }

    // 3. MUI Autocomplete
    if (container.matches('.MuiAutocomplete-root') || container.querySelector('.MuiAutocomplete-root')) {
      const input = container.querySelector('.MuiAutocomplete-input') || container.querySelector('input');
      if (input) {
        input.focus();
        setNativeValue(input, targetValue);
        await new Promise(r => setTimeout(r, 100));

        const popperOptions = document.querySelectorAll('.MuiAutocomplete-option, [role="option"]');
        for (const opt of popperOptions) {
          const text = opt.innerText.toLowerCase().trim();
          if (text === targetStr || text.includes(targetStr)) {
            opt.click();
            return true;
          }
        }
      }
    }

    // 4. Select2
    if (container.matches('.select2-container') || container.querySelector('.select2-container')) {
      const selection = container.querySelector('.select2-selection');
      if (selection) {
        selection.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await new Promise(r => setTimeout(r, 100));

        const select2Options = document.querySelectorAll('.select2-results__option');
        for (const opt of select2Options) {
          const text = opt.innerText.toLowerCase().trim();
          if (text === targetStr || text.includes(targetStr)) {
            opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Handle Google Forms style radio buttons (role="radio")
   */
  function fillRoleRadio(radios, targetValue) {
    if (!radios || radios.length === 0 || !targetValue) return false;
    const targetNorm = targetValue.toString().toLowerCase().trim();

    for (const radio of radios) {
      const val = (radio.getAttribute('data-value') || radio.innerText || '').toLowerCase().trim();
      const aria = (radio.getAttribute('aria-label') || '').toLowerCase().trim();
      if (val === targetNorm || aria === targetNorm || val.includes(targetNorm)) {
        radio.click();
        return true;
      }
    }
    return false;
  }

  /**
   * Scan page and identify all fillable elements
   */
  function scanFormElements() {
    const selector = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"])',
      'textarea',
      'select',
      '[role="combobox"]',
      '[role="listbox"]',
      '.Select-control',
      '[class*="-control"]',
      '.MuiAutocomplete-root'
    ].join(',');

    const elements = Array.from(document.querySelectorAll(selector));
    return elements.filter(el => {
      if (el.disabled || el.readOnly) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        if (el.tagName === 'SELECT') return true;
        return false;
      }
      return true;
    });
  }

  /**
   * Perform Form Auto-Fill
   */
  async function performAutoFill(options = {}) {
    const config = await getActiveProfileAndSettings();
    if (config.blocked) {
      return { success: false, reason: 'Site is blocklisted or unavailable.' };
    }
    if (!config.activeProfile) {
      return { success: false, reason: 'No active profile found. Please create one in options.' };
    }

    const { activeProfile, settings, customMappings } = config;
    const fieldsHelper = window.AutoFillFields;
    if (!fieldsHelper) {
      return { success: false, reason: 'Field helper library not loaded.' };
    }

    const elements = scanFormElements();
    const fillActions = [];
    const undoBatch = [];
    let filledCount = 0;
    let skippedCount = 0;
    let lowConfidenceCount = 0;

    for (const el of elements) {
      // HARD SAFETY RULE: Skip passwords, checkboxes, and blacklisted fields
      if (el.type === 'password' || el.type === 'checkbox') {
        continue;
      }

      const context = extractFieldContext(el);
      const match = fieldsHelper.matchField(context, customMappings);

      if (!match || !match.fieldKey) {
        continue;
      }

      if (match.reason === 'blacklisted_sensitive') {
        // Hard safety rule: Never touch sensitive fields
        continue;
      }

      const targetValue = activeProfile[match.fieldKey];
      if (targetValue === undefined || targetValue === null || targetValue === '') {
        continue;
      }

      // Check confidence threshold
      if (match.confidence < 0.60) {
        lowConfidenceCount++;
        continue;
      }

      // Medium confidence (0.60 - 0.79): Highlight yellow
      if (match.confidence < 0.80) {
        lowConfidenceCount++;
        if (settings.highlightConfidence) {
          el.style.outline = '2px dashed #F59E0B';
          el.setAttribute('data-autofill-hint', `Suggested: ${match.label} (${Math.round(match.confidence * 100)}%)`);
        }
        continue;
      }

      // Check existing value
      const currentValue = (el.value || '').trim();
      if (currentValue && !settings.overwriteExisting) {
        skippedCount++;
        continue;
      }

      // Register fill action
      fillActions.push({
        element: el,
        fieldKey: match.fieldKey,
        label: match.label,
        value: targetValue,
        confidence: match.confidence,
        previousValue: el.value || ''
      });
    }

    // Check Google Forms radiogroups
    const radioGroups = document.querySelectorAll('[role="radiogroup"]');
    radioGroups.forEach(rg => {
      const qCard = rg.closest('.question-card, [role="listitem"]');
      const label = qCard?.querySelector('.q-title')?.innerText || '';
      const match = fieldsHelper.matchField({ label });
      if (match && match.fieldKey && activeProfile[match.fieldKey]) {
        fillRoleRadio(rg.querySelectorAll('[role="radio"]'), activeProfile[match.fieldKey]);
        filledCount++;
      }
    });

    // Check if preview before fill is requested
    if (options.preview || settings.previewBeforeFill) {
      showPreviewModal(fillActions);
      return { success: true, previewShown: true, actionsCount: fillActions.length };
    }

    // Execute fills
    for (const action of fillActions) {
      const { element, value, previousValue } = action;

      // Store in undo batch
      undoBatch.push({ element, previousValue });

      if (element.tagName === 'SELECT') {
        fillNativeSelect(element, value);
      } else if (
        element.matches('[class*="-control"], .MuiAutocomplete-root, [role="listbox"]') ||
        element.closest('.MuiAutocomplete-root, .Select-control, .select2-container')
      ) {
        const customContainer = element.matches('[class*="-control"], .MuiAutocomplete-root, [role="listbox"]')
          ? element
          : element.closest('.MuiAutocomplete-root, .Select-control, .select2-container');
        await fillCustomDropdown(customContainer, value);
      } else {
        setNativeValue(element, value);
      }

      // Visual success flash
      if (settings.highlightConfidence) {
        const origBorder = element.style.borderColor;
        element.style.borderColor = '#10B981';
        element.style.outline = '2px solid #10B981';
        setTimeout(() => {
          element.style.borderColor = origBorder;
          element.style.outline = '';
        }, 1500);
      }
      filledCount++;
    }

    // Handle file input helper
    await handleFileInputHelper();

    // Repeating sections
    await handleRepeatingSections(activeProfile);

    // Save to undo history
    if (undoBatch.length > 0) {
      lastFillHistory = undoBatch;
    }

    return {
      success: true,
      filledCount,
      skippedCount,
      lowConfidenceCount
    };
  }

  /**
   * Handle File Upload Helper (DataTransfer technique + Visual helper badge)
   */
  async function handleFileInputHelper() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length === 0) return;

    // Check IndexedDB documents
    let db = null;
    try {
      db = await new Promise((resolve) => {
        const req = indexedDB.open('AutoFillProDocs', 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      db = null;
    }

    async function getDoc(type) {
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('documents', 'readonly');
          const store = tx.objectStore('documents');
          const req = store.get(type);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }

    for (const input of fileInputs) {
      const label = (
        (input.name || '') + ' ' +
        (input.id || '') + ' ' +
        (input.getAttribute('aria-label') || '') + ' ' +
        (input.closest('.form-group, .field, label')?.innerText || '')
      ).toLowerCase();

      let targetDocType = null;
      let docLabel = '';

      if (/resume|cv|curriculum/i.test(label)) {
        targetDocType = 'resume';
        docLabel = 'Resume (PDF)';
      } else if (/photo|photograph|picture|image/i.test(label)) {
        targetDocType = 'photo';
        docLabel = 'Passport Photo';
      } else if (/marksheet|transcript|certificate|degree/i.test(label)) {
        targetDocType = 'marksheet';
        docLabel = 'Marksheet / Transcript';
      }

      if (!targetDocType) continue;

      const doc = await getDoc(targetDocType);

      // Attempt DataTransfer attachment if file blob exists
      let attached = false;
      if (doc && doc.data) {
        try {
          const file = new File([doc.data], doc.name, { type: doc.type });
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          attached = true;
        } catch (err) {
          attached = false;
        }
      }

      // Visual helper badge
      input.style.outline = attached ? '2px solid #10B981' : '2px solid #2563EB';
      input.style.borderRadius = '4px';

      // Insert helper tooltip
      const badgeId = `autofill-file-hint-${input.id || input.name || Math.random().toString(36).slice(2, 6)}`;
      if (!document.getElementById(badgeId)) {
        const badge = document.createElement('div');
        badge.id = badgeId;
        badge.style.cssText = `
          display: inline-block;
          margin-top: 4px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          font-family: system-ui, sans-serif;
          background: ${attached ? '#ECFDF5' : '#EFF6FF'};
          color: ${attached ? '#065F46' : '#1D4ED8'};
          border: 1px solid ${attached ? '#A7F3D0' : '#BFDBFE'};
        `;
        badge.innerHTML = attached
          ? `✓ Auto-attached: ${doc.name}`
          : `📎 Auto Fill Pro: Please select your stored ${docLabel}`;
        input.parentElement?.insertBefore(badge, input.nextSibling);
      }
    }
  }

  /**
   * Handle Repeating Sections ("Add Experience", "Add Education")
   */
  async function handleRepeatingSections(profile) {
    if (!profile) return;

    if (Array.isArray(profile.experiences) && profile.experiences.length > 1) {
      const addExpButtons = Array.from(document.querySelectorAll('button, a, [role="button"]'))
        .filter(b => /add\s*(more|another)?\s*(experience|work|job|employment)/i.test(b.innerText || ''));

      if (addExpButtons.length > 0) {
        const btn = addExpButtons[0];
        for (let i = 1; i < profile.experiences.length; i++) {
          btn.click();
          await new Promise(r => setTimeout(r, 150));
        }
      }
    }

    if (Array.isArray(profile.educations) && profile.educations.length > 1) {
      const addEduButtons = Array.from(document.querySelectorAll('button, a, [role="button"]'))
        .filter(b => /add\s*(more|another)?\s*(education|qualification|degree|academic)/i.test(b.innerText || ''));

      if (addEduButtons.length > 0) {
        const btn = addEduButtons[0];
        for (let i = 1; i < profile.educations.length; i++) {
          btn.click();
          await new Promise(r => setTimeout(r, 150));
        }
      }
    }
  }

  /**
   * Undo Last Fill Operation
   */
  function undoLastFill() {
    if (!lastFillHistory || lastFillHistory.length === 0) {
      return { success: false, reason: 'No previous fill operation to undo.' };
    }

    let undoneCount = 0;
    for (const item of lastFillHistory) {
      if (item.element && item.element.isConnected) {
        setNativeValue(item.element, item.previousValue);
        undoneCount++;
      }
    }
    lastFillHistory = [];
    return { success: true, undoneCount };
  }

  /**
   * Floating "Fill" Quick Button on Detected Forms
   */
  async function checkAndRenderFloatingButton() {
    const config = await getActiveProfileAndSettings();
    if (config.blocked || !config.settings?.showFloatingButton) {
      if (floatingButtonEl) floatingButtonEl.remove();
      return;
    }

    const forms = document.querySelectorAll('form, input, textarea');
    if (forms.length < 3) {
      if (floatingButtonEl) floatingButtonEl.remove();
      return;
    }

    if (floatingButtonEl && floatingButtonEl.isConnected) {
      return;
    }

    floatingButtonEl = document.createElement('div');
    floatingButtonEl.id = 'autofill-pro-floating-trigger';
    floatingButtonEl.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #2563EB;
        color: #FFFFFF;
        padding: 10px 16px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
        cursor: pointer;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        font-weight: 600;
        user-select: none;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Auto Fill Pro</span>
      </div>
    `;

    const btn = floatingButtonEl.firstElementChild;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await performAutoFill();
    });

    document.body.appendChild(floatingButtonEl);
  }

  /**
   * Preview Modal
   */
  function showPreviewModal(actions) {
    const existing = document.getElementById('autofill-pro-preview-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'autofill-pro-preview-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
      z-index: 2147483647; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    `;

    let rowsHtml = '';
    actions.forEach((act, idx) => {
      rowsHtml += `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px;"><input type="checkbox" checked data-preview-idx="${idx}"></td>
          <td style="padding: 10px; font-weight: 500;">${act.label}</td>
          <td style="padding: 10px; color: #64748B; font-family: monospace;">${escapeHtml(String(act.value))}</td>
          <td style="padding: 10px; text-align: right;"><span style="background: #ECFDF5; color: #065F46; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${Math.round(act.confidence * 100)}%</span></td>
        </tr>
      `;
    });

    modal.innerHTML = `
      <div style="background: #FFFFFF; width: 90%; max-width: 620px; max-height: 85vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.25);">
        <div style="padding: 18px 24px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Review & Fill Fields</h3>
          <button id="autofill-preview-close" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 16px 24px; overflow-y: auto; flex: 1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #CBD5E1; text-align: left; color: #64748B;">
                <th style="padding: 8px;">Fill</th>
                <th style="padding: 8px;">Field</th>
                <th style="padding: 8px;">Value</th>
                <th style="padding: 8px; text-align: right;">Confidence</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 12px; background: #F8FAFC;">
          <button id="autofill-preview-cancel" style="padding: 8px 16px; border: 1px solid #CBD5E1; background: #FFFFFF; border-radius: 8px; cursor: pointer;">Cancel</button>
          <button id="autofill-preview-apply" style="padding: 8px 20px; border: none; background: #2563EB; color: #FFFFFF; border-radius: 8px; cursor: pointer; font-weight: 600;">Apply Selected (${actions.length})</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#autofill-preview-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#autofill-preview-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#autofill-preview-apply').addEventListener('click', () => {
      const checkboxes = modal.querySelectorAll('[data-preview-idx]');
      const undoBatch = [];

      checkboxes.forEach(cb => {
        if (cb.checked) {
          const idx = parseInt(cb.getAttribute('data-preview-idx'), 10);
          const act = actions[idx];
          if (act && act.element) {
            undoBatch.push({ element: act.element, previousValue: act.previousValue });
            if (act.element.tagName === 'SELECT') {
              fillNativeSelect(act.element, act.value);
            } else {
              setNativeValue(act.element, act.value);
            }
          }
        }
      });

      if (undoBatch.length > 0) lastFillHistory = undoBatch;
      modal.remove();
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  /**
   * Teach this field
   */
  function startTeachMode() {
    const fieldsHelper = window.AutoFillFields;
    if (!fieldsHelper) return;

    const overlay = document.createElement('div');
    overlay.id = 'autofill-teach-overlay';
    overlay.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      background: #1E293B; color: #FFFFFF; padding: 12px 24px; border-radius: 12px;
      z-index: 2147483647; font-family: system-ui, sans-serif; font-size: 14px;
    `;
    overlay.innerHTML = `🎯 <strong>Teach Mode:</strong> Click any field to map. <span id="autofill-cancel-teach" style="margin-left: 12px; text-decoration: underline; cursor: pointer; color: #93C5FD;">Cancel</span>`;
    document.body.appendChild(overlay);

    function onTargetClick(e) {
      const target = e.target.closest('input, textarea, select');
      if (!target) return;
      e.preventDefault(); e.stopPropagation();
      cleanup();
      showTeachDialog(target);
    }

    function cleanup() {
      overlay.remove();
      document.removeEventListener('click', onTargetClick, true);
    }

    overlay.querySelector('#autofill-cancel-teach').addEventListener('click', cleanup);
    setTimeout(() => { document.addEventListener('click', onTargetClick, true); }, 100);
  }

  function showTeachDialog(targetEl) {
    const fieldsHelper = window.AutoFillFields;
    const sig = generateFieldSignature(targetEl);

    let optionsHtml = '<option value="">-- Choose Profile Field --</option>';
    for (const [key, def] of Object.entries(fieldsHelper.FIELD_DEFINITIONS)) {
      optionsHtml += `<option value="${key}">${def.label}</option>`;
    }

    const dialog = document.createElement('div');
    dialog.id = 'autofill-teach-dialog';
    dialog.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #FFFFFF; padding: 24px; border-radius: 16px; z-index: 2147483647;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3); width: 380px; font-family: system-ui, sans-serif;
    `;
    dialog.innerHTML = `
      <h3 style="margin: 0 0 12px 0;">Map This Field</h3>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748B;">Signature: <code>${sig}</code></p>
      <select id="autofill-teach-select" style="width: 100%; padding: 8px; margin-bottom: 16px;">${optionsHtml}</select>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button id="autofill-teach-cancel" style="padding: 6px 12px;">Cancel</button>
        <button id="autofill-teach-save" style="padding: 6px 14px; background: #2563EB; color: white; border: none; border-radius: 6px;">Save</button>
      </div>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector('#autofill-teach-cancel').addEventListener('click', () => dialog.remove());
    dialog.querySelector('#autofill-teach-save').addEventListener('click', async () => {
      const selectedKey = dialog.querySelector('#autofill-teach-select').value;
      if (!selectedKey) return;

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const { customMappings = {} } = await chrome.storage.local.get(['customMappings']);
        customMappings[sig] = selectedKey;
        await chrome.storage.local.set({ customMappings });
      }
      dialog.remove();
    });
  }

  // Expose global methods for testing and extension triggers
  window.__AutoFillProPerformFill = performAutoFill;
  window.__AutoFillProUndo = undoLastFill;
  window.__AutoFillProScan = scanFormElements;

  // Custom DOM event listener
  window.addEventListener('__AUTOFILL_PRO_TRIGGER__', async (e) => {
    const res = await performAutoFill(e.detail || {});
    window.dispatchEvent(new CustomEvent('__AUTOFILL_PRO_RESULT__', { detail: res }));
  });

  // Listen for Chrome runtime messages
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'PING') {
        sendResponse({ status: 'PONG' });
        return true;
      }
      if (request.action === 'FILL_FORM' || request.action === 'FILL_STEP') {
        performAutoFill(request.payload || {}).then(res => sendResponse(res));
        return true;
      }
      if (request.action === 'UNDO_FILL') {
        sendResponse(undoLastFill());
        return true;
      }
      if (request.action === 'START_TEACH_MODE') {
        startTeachMode();
        sendResponse({ success: true });
        return true;
      }
      if (request.action === 'SCAN_SUMMARY') {
        sendResponse({ detectedCount: scanFormElements().length });
        return true;
      }
    });
  }

  // Observer
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkAndRenderFloatingButton, 400);
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  checkAndRenderFloatingButton();
})();
