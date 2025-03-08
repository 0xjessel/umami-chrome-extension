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
 * Format large numbers for badge display
 * Abbreviates numbers with k and m suffixes
 */
function formatBadgeNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format time in minutes for badge display
 * Returns hours only for clarity (e.g. 78h)
 */
function formatBadgeTime(minutes) {
  if (!minutes) return '0';
  
  // For badge, just show hours rounded up for simplicity
  const hours = Math.ceil(minutes / 60);
  return hours.toString() + 'h';
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

    if (config.badgeMetric === 'active') {
      // Active users comes from a different API endpoint
      const activeUsers = await api.getActiveUsers();
      value = formatBadgeNumber(activeUsers);
    } else {
      // All other metrics come from getDailyStats
      const stats = await api.getDailyStats();
      
      // Map badge metrics to their exact property names in the API response
      const metricsMap = {
        'views': 'pageviews',
        'visitors': 'visitors',
        'visits': 'visits',
        'bounces': 'bounces',
        'totalTime': 'totaltime'  // Note: API uses 'totaltime' (lowercase)
      };
      
      const propName = metricsMap[config.badgeMetric];
      
      // Check if the property exists in the response
      if (propName && stats[propName] && typeof stats[propName].value !== 'undefined') {
        // Special handling for totaltime (display as hours)
        if (propName === 'totaltime') {
          value = formatBadgeTime(stats[propName].value);
        } else {
          value = formatBadgeNumber(stats[propName].value);
        }
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
