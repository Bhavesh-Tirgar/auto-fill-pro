/**
 * Auto Fill Pro v2.0 - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const profileSelect = document.getElementById('profile-select');
  const meterBar = document.getElementById('meter-bar');
  const meterPercentage = document.getElementById('meter-percentage');
  const missingFieldsText = document.getElementById('missing-fields-text');
  const btnFillForm = document.getElementById('btn-fill-form');
  const btnFillStep = document.getElementById('btn-fill-step');
  const btnUndo = document.getElementById('btn-undo');
  const btnTeachField = document.getElementById('btn-teach-field');
  const togglePreview = document.getElementById('toggle-preview');
  const toggleOverwrite = document.getElementById('toggle-overwrite');
  const btnDarkToggle = document.getElementById('btn-dark-toggle');
  const btnOptions = document.getElementById('btn-options');
  const statusBox = document.getElementById('status-box');

  let currentProfiles = [];
  let currentSettings = {};

  // Check tab validity
  try {
    const tabInfo = await chrome.runtime.sendMessage({ action: 'GET_TAB_INFO' });
    if (tabInfo && tabInfo.restricted) {
      showStatus('Auto Fill Pro cannot run on browser system/restricted pages.', 'error');
      btnFillForm.disabled = true;
      btnFillStep.disabled = true;
      btnUndo.disabled = true;
      btnTeachField.disabled = true;
    }
  } catch (e) {}

  // Load storage state
  const data = await chrome.storage.local.get(['profiles', 'activeProfileId', 'settings']);
  currentProfiles = data.profiles || [];
  currentSettings = data.settings || {};

  // Apply dark mode
  if (currentSettings.darkMode) {
    document.body.classList.add('dark-mode');
  }

  // Populate settings toggles
  togglePreview.checked = !!currentSettings.previewBeforeFill;
  toggleOverwrite.checked = !!currentSettings.overwriteExisting;

  // Populate profiles
  populateProfiles(data.activeProfileId);

  // Settings change listeners
  togglePreview.addEventListener('change', async () => {
    currentSettings.previewBeforeFill = togglePreview.checked;
    await chrome.storage.local.set({ settings: currentSettings });
  });

  toggleOverwrite.addEventListener('change', async () => {
    currentSettings.overwriteExisting = toggleOverwrite.checked;
    await chrome.storage.local.set({ settings: currentSettings });
  });

  profileSelect.addEventListener('change', async () => {
    const newActiveId = profileSelect.value;
    await chrome.storage.local.set({ activeProfileId: newActiveId });
    updateCompletenessMeter(newActiveId);
  });

  btnDarkToggle.addEventListener('click', async () => {
    const isDark = document.body.classList.toggle('dark-mode');
    currentSettings.darkMode = isDark;
    await chrome.storage.local.set({ settings: currentSettings });
  });

  btnOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Action buttons
  btnFillForm.addEventListener('click', async () => {
    showStatus('Filling form...', 'success');
    const res = await chrome.runtime.sendMessage({
      action: 'INJECT_AND_FILL',
      subAction: 'FILL_FORM',
      payload: { preview: togglePreview.checked }
    });
    handleFillResponse(res);
  });

  btnFillStep.addEventListener('click', async () => {
    showStatus('Filling active step...', 'success');
    const res = await chrome.runtime.sendMessage({
      action: 'INJECT_AND_FILL',
      subAction: 'FILL_STEP',
      payload: { preview: togglePreview.checked }
    });
    handleFillResponse(res);
  });

  btnUndo.addEventListener('click', async () => {
    const res = await chrome.runtime.sendMessage({
      action: 'INJECT_AND_FILL',
      subAction: 'UNDO_FILL'
    });
    if (res && res.success) {
      showStatus(`Restored ${res.undoneCount || 0} fields!`, 'success');
    } else {
      showStatus(res?.reason || 'Nothing to undo.', 'error');
    }
  });

  btnTeachField.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({
      action: 'INJECT_AND_FILL',
      subAction: 'START_TEACH_MODE'
    });
    window.close();
  });

  function handleFillResponse(res) {
    if (!res) {
      showStatus('No response from page.', 'error');
      return;
    }
    if (res.previewShown) {
      showStatus('Review dialog opened in page.', 'success');
      window.close();
      return;
    }
    if (res.success) {
      const msg = `Filled ${res.filledCount} fields (${res.skippedCount} skipped, ${res.lowConfidenceCount} flagged).`;
      showStatus(msg, 'success');
    } else {
      showStatus(res.error || res.reason || 'Failed to fill.', 'error');
    }
  }

  function showStatus(text, type = 'success') {
    statusBox.textContent = text;
    statusBox.className = `status-msg status-${type}`;
    setTimeout(() => {
      statusBox.style.display = 'none';
    }, 4000);
  }

  function populateProfiles(activeId) {
    profileSelect.innerHTML = '';
    if (currentProfiles.length === 0) {
      profileSelect.innerHTML = '<option value="">No Profiles (Create one in Settings)</option>';
      return;
    }

    currentProfiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.isDefault ? ' (Default)' : '');
      if (p.id === activeId) opt.selected = true;
      profileSelect.appendChild(opt);
    });

    updateCompletenessMeter(profileSelect.value);
  }

  function updateCompletenessMeter(profileId) {
    const prof = currentProfiles.find(p => p.id === profileId);
    if (!prof) {
      meterBar.style.width = '0%';
      meterPercentage.textContent = '0%';
      missingFieldsText.textContent = 'No profile selected.';
      return;
    }

    // Core benchmark fields
    const benchmarkFields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'dob', label: 'DOB' },
      { key: 'gender', label: 'Gender' },
      { key: 'addressLine1', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pincode', label: 'PIN' },
      { key: 'tenthBoard', label: '10th Board' },
      { key: 'tenthPercentage', label: '10th %' },
      { key: 'twelfthBoard', label: '12th Board' },
      { key: 'twelfthPercentage', label: '12th %' },
      { key: 'gradCollege', label: 'College' },
      { key: 'gradDegree', label: 'Degree' },
      { key: 'gradCgpa', label: 'CGPA' },
      { key: 'skills', label: 'Skills' },
      { key: 'currentCompany', label: 'Company' },
      { key: 'linkedinUrl', label: 'LinkedIn' },
      { key: 'githubUrl', label: 'GitHub' }
    ];

    const present = benchmarkFields.filter(f => prof[f.key] && String(prof[f.key]).trim().length > 0);
    const missing = benchmarkFields.filter(f => !prof[f.key] || String(prof[f.key]).trim().length === 0);

    const pct = Math.round((present.length / benchmarkFields.length) * 100);
    meterBar.style.width = `${pct}%`;
    meterPercentage.textContent = `${pct}%`;

    if (missing.length === 0) {
      missingFieldsText.textContent = '✨ Profile 100% complete!';
      meterPercentage.style.color = '#10B981';
      meterBar.style.backgroundColor = '#10B981';
    } else {
      const missingList = missing.slice(0, 3).map(m => m.label).join(', ');
      missingFieldsText.textContent = `Missing: ${missingList}${missing.length > 3 ? '...' : ''}`;
      if (pct < 50) {
        meterPercentage.style.color = '#EF4444';
        meterBar.style.backgroundColor = '#EF4444';
      } else {
        meterPercentage.style.color = '#F59E0B';
        meterBar.style.backgroundColor = '#F59E0B';
      }
    }
  }
});
