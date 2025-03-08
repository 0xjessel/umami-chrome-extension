import { StorageManager } from './src/storage.js';
import { UmamiAPI } from './src/api.js';

let api = null;

/**
 * Initialize the API client
 */
async function initializeAPI() {
  if (!await StorageManager.hasCredentials()) {
    return false;
  }

  api = new UmamiAPI();
  try {
    const config = await StorageManager.getConfig();
    api.serverType = config.serverType;
    api.baseUrl = config.baseUrl;
    api.token = config.token;
    api.websiteId = config.websiteId;
    api.username = config.username;
    api.password = config.password;
    await api.init();
    return true;
  } catch (error) {
    console.error('Failed to initialize API:', error);
    return false;
  }
}

/**
 * Update the extension badge with current metrics
 */
async function updateBadge() {
  if (!api && !(await initializeAPI())) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    return;
  }

  try {
    const config = await StorageManager.getConfig();
    let value = '0';

    switch (config.badgeMetric) {
      case 'active':
        value = (await api.getActiveUsers()).toString();
        break;
      case 'views': {
        const stats = await api.getDailyStats();
        value = stats.pageviews.value.toString();
        break;
      }
      case 'visitors': {
        const stats = await api.getDailyStats();
        value = stats.visitors.value.toString();
        break;
      }
    }

    chrome.action.setBadgeText({ text: value });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } catch (error) {
    console.error('Failed to update badge:', error);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }
}

// Set up alarm for periodic updates
async function setupAlarm() {
  const config = await StorageManager.getConfig();
  chrome.alarms.create('updateMetrics', {
    periodInMinutes: Math.max(0.5, Math.floor(config.pollingInterval / (60 * 1000)))
  });
}

// Initial alarm setup
setupAlarm();

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateMetrics') {
    updateBadge();
  }
});

// Listen for installation/update
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize with default configuration
  const config = await StorageManager.getConfig();
  await StorageManager.updateConfig(config);
  
  // Attempt initial badge update
  updateBadge();
});

// Listen for configuration changes
chrome.storage.onChanged.addListener(async (changes) => {
  // If credentials changed, reinitialize API
  if (changes.baseUrl || changes.token || changes.websiteId) {
    api = null;
    await initializeAPI();
  }
  
  // If polling interval changed, update alarm
  if (changes.pollingInterval) {
    chrome.alarms.create('updateMetrics', {
      periodInMinutes: Math.max(0.5, Math.floor(changes.pollingInterval.newValue / (60 * 1000)))
    });
  }

  // Update badge with new configuration
  updateBadge();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    updateBadge();
    sendResponse({ success: true });
  }
  return true;
});
