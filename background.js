/**
 * Auto Fill Pro v2.0 - Background Service Worker
 * Handles context menus, keyboard commands, activeTab injection, and licensing verification.
 */

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  setupContextMenus();
  await initializeDefaultStorage();
  console.log('[Auto Fill Pro] Installed successfully, version 2.0.0');
});

/**
 * Configure Context Menus
 */
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'autofill_pro_root',
      title: 'Auto Fill Pro',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autofill_fill_form',
      parentId: 'autofill_pro_root',
      title: '⚡ Fill Current Form (Ctrl+Shift+F)',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autofill_fill_step',
      parentId: 'autofill_pro_root',
      title: '📑 Fill Active Step',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autofill_undo',
      parentId: 'autofill_pro_root',
      title: '↩️ Undo Last Fill',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autofill_separator_1',
      parentId: 'autofill_pro_root',
      type: 'separator',
      contexts: ['editable']
    });

    chrome.contextMenus.create({
      id: 'autofill_teach_field',
      parentId: 'autofill_pro_root',
      title: '🎯 Teach This Field...',
      contexts: ['editable']
    });

    chrome.contextMenus.create({
      id: 'autofill_separator_2',
      parentId: 'autofill_pro_root',
      type: 'separator',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autofill_open_options',
      parentId: 'autofill_pro_root',
      title: '⚙️ Profiles & Settings',
      contexts: ['all']
    });
  });
}

/**
 * Initialize default sample profile and settings if empty
 */
async function initializeDefaultStorage() {
  const data = await chrome.storage.local.get(['profiles', 'activeProfileId', 'settings', 'customMappings']);
  const updates = {};

  if (!data.settings) {
    updates.settings = {
      overwriteExisting: false,
      highlightConfidence: true,
      showFloatingButton: true,
      previewBeforeFill: false,
      darkMode: false,
      autoFillOnLoad: false,
      pinLockEnabled: false,
      siteAllowlist: [],
      siteBlocklist: []
    };
  }

  if (!data.profiles || data.profiles.length === 0) {
    const defaultProfile = {
      id: 'prof_' + Date.now(),
      name: 'Default Applicant',
      isDefault: true,
      createdAt: new Date().toISOString(),
      // Personal
      fullName: 'Rahul Sharma',
      firstName: 'Rahul',
      middleName: 'Kumar',
      lastName: 'Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9876543210',
      altPhone: '9123456780',
      dob: '2001-08-15',
      gender: 'Male',
      maritalStatus: 'Single',
      bloodGroup: 'O+',
      nationality: 'Indian',
      // Demographics
      category: 'General',
      religion: 'Hindu',
      domicile: 'Maharashtra',
      motherTongue: 'Hindi',
      pwd: 'No',
      // Family
      fatherName: 'Suresh Sharma',
      fatherOccupation: 'Government Service',
      motherName: 'Sunita Sharma',
      motherOccupation: 'Homemaker',
      annualIncome: '650000',
      // Address
      addressLine1: 'Flat 402, Sunshine Heights',
      addressLine2: 'MG Road, Kothrud',
      city: 'Pune',
      district: 'Pune',
      taluka: 'Haveli',
      state: 'Maharashtra',
      pincode: '411038',
      country: 'India',
      // Education 10th
      tenthSchool: 'St. Xavier High School',
      tenthBoard: 'CBSE',
      tenthPassingYear: '2017',
      tenthRollNo: 'CBSE1789234',
      tenthMarksObtained: '475',
      tenthTotalMarks: '500',
      tenthPercentage: '95.0',
      // Education 12th
      twelfthSchool: 'Ferguson Junior College',
      twelfthBoard: 'Maharashtra State Board',
      twelfthStream: 'Science',
      twelfthPassingYear: '2019',
      twelfthRollNo: 'HSC194821',
      twelfthMarksObtained: '570',
      twelfthTotalMarks: '600',
      twelfthPercentage: '95.0',
      // Education Grad
      gradCollege: 'College of Engineering Pune (COEP)',
      gradUniversity: 'Savitribai Phule Pune University',
      gradDegree: 'B.Tech',
      gradBranch: 'Computer Science and Engineering',
      gradStartYear: '2019',
      gradPassingYear: '2023',
      gradRollNo: '111903042',
      gradCgpa: '8.92',
      gradPercentage: '89.2',
      // Professional
      currentCompany: 'Infosys Ltd',
      currentTitle: 'Software Engineer',
      totalExperienceYears: '2',
      noticePeriodDays: '30',
      currentCtc: '950000',
      expectedCtc: '1400000',
      skills: 'JavaScript, TypeScript, React, Node.js, Python, SQL, Git',
      summary: 'Results-driven software engineer with 2+ years experience building scalable web applications and high-throughput microservices.',
      portfolioUrl: 'https://rahulsharma.dev',
      linkedinUrl: 'https://linkedin.com/in/rahulsharma-dev',
      githubUrl: 'https://github.com/rahulsharma'
    };

    updates.profiles = [defaultProfile];
    updates.activeProfileId = defaultProfile.id;
  }

  if (!data.customMappings) {
    updates.customMappings = {};
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

/**
 * Check if a URL is restricted from extension script injection
 */
function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com')
  );
}

/**
 * Injects fields.js and content.js into the active tab on demand and dispatches action
 */
async function injectAndExecute(tabId, action, payload = {}) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || isRestrictedUrl(tab.url)) {
      return { success: false, error: 'Cannot run on browser internal or restricted pages.' };
    }

    // Check if content script is already loaded by pinging it
    let isLoaded = false;
    try {
      const pong = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      if (pong && pong.status === 'PONG') {
        isLoaded = true;
      }
    } catch (e) {
      isLoaded = false;
    }

    if (!isLoaded) {
      // Inject fields.js first, then content.js
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['fields.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    }

    // Now send the action message
    const response = await chrome.tabs.sendMessage(tabId, { action, payload });
    return response || { success: true };
  } catch (error) {
    console.warn('[Auto Fill Pro] Script injection error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Context Menu Click Handler
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'autofill_open_options') {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (info.menuItemId === 'autofill_fill_form') {
    await injectAndExecute(tab.id, 'FILL_FORM');
  } else if (info.menuItemId === 'autofill_fill_step') {
    await injectAndExecute(tab.id, 'FILL_STEP');
  } else if (info.menuItemId === 'autofill_undo') {
    await injectAndExecute(tab.id, 'UNDO_FILL');
  } else if (info.menuItemId === 'autofill_teach_field') {
    await injectAndExecute(tab.id, 'START_TEACH_MODE');
  }
});

/**
 * Keyboard Command Handler
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill_active_tab') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await injectAndExecute(tab.id, 'FILL_FORM');
    }
  }
});

/**
 * Message Dispatcher for Popup and Options
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'PONG', version: '2.0.0' });
    return true;
  }

  if (request.action === 'INJECT_AND_FILL') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        sendResponse({ success: false, error: 'No active tab found.' });
        return;
      }
      const res = await injectAndExecute(tab.id, request.subAction || 'FILL_FORM', request.payload);
      sendResponse(res);
    })();
    return true;
  }

  if (request.action === 'GET_TAB_INFO') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        sendResponse({ restricted: true, url: '' });
        return;
      }
      sendResponse({
        id: tab.id,
        url: tab.url,
        restricted: isRestrictedUrl(tab.url)
      });
    })();
    return true;
  }
});
