import { StorageManager } from './src/storage.js';
import { UmamiAPI } from './src/api.js';

let api = null;

/**
 * Initialize the API client
 */
async function initializeAPI() {
  try {
    if (!await StorageManager.hasCredentials()) {
      console.log('No credentials found in storage');
      return false;
    }

    console.log('Credentials found, initializing API client');
    api = new UmamiAPI();
    try {
      const config = await StorageManager.getConfig();
      console.log('Retrieved config:', Object.keys(config).join(', '));
      
      api.serverType = config.serverType;
      api.baseUrl = config.baseUrl;
      api.token = config.token;
      api.websiteId = config.websiteId;
      api.username = config.username;
      api.password = config.password;
      
      // Verify API parameters
      if (!api.baseUrl) console.log('Warning: baseUrl is missing');
      if (!api.token) console.log('Warning: token is missing');
      if (!api.websiteId) console.log('Warning: websiteId is missing');
      if (!api.username) console.log('Warning: username is missing');
      if (!api.password) console.log('Warning: password is missing');
      
      await api.init();
      console.log('API initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize API:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in initializeAPI:', error);
    return false;
  }
}

/**
 * Format large numbers for badge display
 * Abbreviates numbers with k and m suffixes
 */
function formatBadgeNumber(num) {
  // Handle null/undefined/NaN values
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  // Explicitly handle any type by converting to String safely
  return String(num);
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
  console.log('Starting badge update...');
  try {
    // First check if API needs initialization
    if (!api && !(await initializeAPI())) {
      console.log('API initialization failed, setting error badge');
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      return;
    }

    console.log('API initialized successfully');
    const config = await StorageManager.getConfig();
    console.log('Badge metric:', config.badgeMetric);
    // Default badge value
    let value = '0';
    let rawValue = 0;

    // Get the appropriate metric value based on badge metric setting
    if (config.badgeMetric === 'active') {
      // Active users comes from a different API endpoint
      try {
        console.log('Fetching active users...');
        rawValue = await api.getActiveUsers();
        console.log('Active users raw value:', rawValue);
        
        // Ensure value is a number
        if (rawValue === null || rawValue === undefined || isNaN(rawValue)) {
          rawValue = 0;
        }
        
        // Try to convert to a number if it's not already
        if (typeof rawValue !== 'number') {
          rawValue = Number(rawValue) || 0;
        }
        console.log('Active users final value:', rawValue);
      } catch (apiError) {
        console.error('Error fetching active users:', apiError);
        rawValue = 0;
      }
    } else {
      // All other metrics come from getDailyStats
      try {
        console.log('Fetching daily stats...');
        const stats = await api.getDailyStats();
        console.log('Daily stats:', stats);
        
        // Map badge metrics to their exact property names in the API response
        const metricsMap = {
          'views': 'pageviews',
          'visitors': 'visitors',
          'visits': 'visits',
          'bounces': 'bounces',
          'totalTime': 'totaltime'  // Note: API uses 'totaltime' (lowercase)
        };
        
        const metricKey = metricsMap[config.badgeMetric];
        console.log('Metric key:', metricKey);
        
        // Get the raw value if the data structure is valid
        if (metricKey && stats && stats[metricKey] && 
            stats[metricKey].value !== undefined) {
          rawValue = stats[metricKey].value;
          console.log('Raw value from stats:', rawValue);
          
          // Ensure value is a number (except for totalTime)
          if (metricKey !== 'totaltime' && (rawValue === null || rawValue === undefined || isNaN(rawValue))) {
            rawValue = 0;
          }
        }
      } catch (apiError) {
        console.error('Error fetching daily stats:', apiError);
        rawValue = 0;
      }
    }
    
    // Format the value for display based on the metric type
    try {
      if (config.badgeMetric === 'totalTime') {
        value = formatBadgeTime(rawValue);
      } else {
        // All other metrics use number format
        value = formatBadgeNumber(rawValue);
      }
      console.log('Formatted badge value:', value);
    } catch (formatError) {
      console.error('Error formatting badge value:', formatError);
      value = '0';
    }
    
    // Make sure the badge gets updated with the new value
    try {
      // Ensure value is always a string
      if (typeof value !== 'string') {
        value = String(value || '0');
      }
      
      // Limit badge text to 4 characters for display purposes
      if (value.length > 4) {
        value = value.substring(0, 4);
      }
      
      console.log('Setting badge text to:', value);
      chrome.action.setBadgeText({ text: value });
      chrome.action.setBadgeBackgroundColor({ color: config.badgeColor || '#6366f1' });
      console.log('Badge successfully updated');
    } catch (badgeError) {
      // If we can't update the badge, at least clear it to avoid showing an error
      console.error('Error setting badge text:', badgeError);
      try {
        chrome.action.setBadgeText({ text: '!' });
      } catch (clearError) {
        console.error('Error clearing badge:', clearError);
        // Ignore errors when resetting badge
      }
      throw badgeError;
    }
  } catch (error) {
    console.error('Overall error in updateBadge:', error);
    // If all else fails, try to show an error badge, but don't throw more errors
    try {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } catch (finalError) {
      console.error('Final error in badge update:', finalError);
      // Silent fail if even this doesn't work
    }
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

// Listen for messages from popup or options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    // Important: Return true to indicate async response
    try {
      updateBadge()
        .then(() => {
          // Send response after badge update attempt
          try {
            sendResponse({ success: true });
          } catch (responseError) {
            console.error('Error sending response:', responseError);
          }
        })
        .catch((error) => {
          console.error('Error in badge update:', error);
          try {
            sendResponse({ success: false, error: error.message });
          } catch (responseError) {
            console.error('Error sending error response:', responseError);
          }
        });
    } catch (error) {
      console.error('Critical error in message handler:', error);
      try {
        sendResponse({ success: false, error: error.message });
      } catch (responseError) {
        // Nothing we can do here
      }
    }
    return true; // This indicates we'll send response asynchronously
  }
});

// Keep the service worker alive for badge updates
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'keepAlive') {
    // This will keep the service worker alive as long as the port is connected
    port.onDisconnect.addListener(() => {
      // Optional: Perform cleanup when the port is disconnected
    });
  }
});
