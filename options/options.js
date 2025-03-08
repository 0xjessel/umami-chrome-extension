import { StorageManager } from '../src/storage.js';
import { POLLING_INTERVALS, DEFAULT_POLLING_INTERVAL } from '../src/constants.js';
import { UmamiAPI } from '../src/api.js';

// UI Elements
const elements = {
  credentialsForm: document.getElementById('credentialsForm'),
  displayForm: document.getElementById('displayForm'),
  verifyButton: document.getElementById('verifyButton'),
  resetButton: document.getElementById('resetButton'),
  status: document.getElementById('status'),
  selfHostedAuth: document.getElementById('selfHostedAuth'),
  baseUrl: document.getElementById('baseUrl'),
  urlHelp: document.getElementById('urlHelp'),
  urlValidation: document.getElementById('urlValidation')
};

/**
 * Show status message
 */
function showStatus(message, type = '') {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`;
  
  setTimeout(() => {
    elements.status.classList.add('hidden');
  }, 3000);
}

/**
 * Load saved settings
 */
async function loadSettings() {
  const config = await StorageManager.getConfig();
  
  // Load credentials
  elements.baseUrl.value = config.baseUrl || '';
  elements.credentialsForm.querySelector('#websiteId').value = config.websiteId || '';
  
  // Load auth credentials
  elements.credentialsForm.querySelector('#username').value = config.username || '';
  elements.credentialsForm.querySelector('#password').value = config.password || '';

  // Load display settings
  const badgeMetricInputs = elements.displayForm.querySelectorAll('input[name="badgeMetric"]');
  badgeMetricInputs.forEach(input => {
    input.checked = input.value === config.badgeMetric;
  });

  // Load visible metrics settings
  elements.displayForm.querySelector('input[name="showActiveUsers"]').checked = config.showActiveUsers;
  elements.displayForm.querySelector('input[name="showPageViews"]').checked = config.showPageViews;
  elements.displayForm.querySelector('input[name="showVisitors"]').checked = config.showVisitors;
  elements.displayForm.querySelector('input[name="showVisits"]').checked = config.showVisits;
  elements.displayForm.querySelector('input[name="showBounces"]').checked = config.showBounces;
  elements.displayForm.querySelector('input[name="showTotalTime"]').checked = config.showTotalTime;
  
  // Set polling interval
  const pollingSelect = elements.displayForm.querySelector('#pollingInterval');
  // Find the closest matching interval
  let closestInterval = 'ONE_MINUTE';
  if (config.pollingInterval) {
    const intervals = Object.entries(POLLING_INTERVALS);
    closestInterval = intervals.reduce((closest, [key, value]) => {
      if (Math.abs(value - config.pollingInterval) < Math.abs(POLLING_INTERVALS[closest] - config.pollingInterval)) {
        return key;
      }
      return closest;
    }, 'ONE_MINUTE');
  }
  pollingSelect.value = closestInterval;
}

/**
 * Get authentication token for self-hosted server
 */
async function getSelfHostedToken(baseUrl, username, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data = await response.json();
  return data.token;
}

/**
 * Save credentials
 */
async function saveCredentials(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const baseUrl = formData.get('baseUrl');
  const websiteId = formData.get('websiteId');
  const username = formData.get('username');
  const password = formData.get('password');

  // Validate URL format
  if (!validateUrl(elements.baseUrl)) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }
  
  try {
    const token = await getSelfHostedToken(baseUrl, username, password);

    const credentials = {
      serverType: 'self-hosted',
      baseUrl,
      token,
      websiteId,
      username,
      password
    };

    await StorageManager.setCredentials(credentials);
    showStatus('Credentials saved successfully', 'success');
  } catch (error) {
    showStatus('Failed to save credentials: ' + error.message, 'error');
  }
}

/**
 * Save display settings
 */
async function saveDisplaySettings(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const settings = {
    badgeMetric: formData.get('badgeMetric'),
    showActiveUsers: formData.get('showActiveUsers') === 'on',
    showPageViews: formData.get('showPageViews') === 'on',
    showVisitors: formData.get('showVisitors') === 'on',
    showVisits: formData.get('showVisits') === 'on',
    showBounces: formData.get('showBounces') === 'on',
    showTotalTime: formData.get('showTotalTime') === 'on',
    pollingInterval: POLLING_INTERVALS[formData.get('pollingInterval')]
  };

  try {
    await StorageManager.updatePreferences(settings);
    showStatus('Settings saved successfully', 'success');
  } catch (error) {
    showStatus('Failed to save settings: ' + error.message, 'error');
  }
}

/**
 * Reset settings to default
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to default?')) {
    return;
  }

  try {
    await StorageManager.updateConfig(StorageManager.DEFAULT_CONFIG);
    await StorageManager.clearCredentials();
    await loadSettings();
    showStatus('Settings reset to default', 'success');
  } catch (error) {
    showStatus('Failed to reset settings: ' + error.message, 'error');
  }
}

/**
 * Verify connection to Umami
 */
async function verifyConnection() {
  // Validate URL format first
  if (!validateUrl(elements.baseUrl)) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  // Get form data first to use latest values
  const formData = new FormData(elements.credentialsForm);
  const baseUrl = formData.get('baseUrl');
  const websiteId = formData.get('websiteId');
  const username = formData.get('username');
  const password = formData.get('password');
  
  // Create API instance with current form values
  const api = new UmamiAPI();
  api.serverType = 'self-hosted';
  api.baseUrl = baseUrl;

  if (!websiteId) {
    showStatus('Website ID is required', 'error');
    return;
  }
  api.websiteId = websiteId;

  try {
    // For self-hosted, we need to authenticate
    const token = await getSelfHostedToken(baseUrl, username, password);
    api.token = token;
    
    // Test the connection by fetching active users
    await api.getActiveUsers();
    showStatus('Connection verified successfully', 'success');
  } catch (error) {
    showStatus('Connection failed: ' + error.message, 'error');
  }
}

/**
 * Validate URL format
 */
function validateUrl(input) {
  // Clear previous validation message
  elements.urlValidation.textContent = '';
  
  // Special case: we no longer need validation for cloud URL
  if (!input.value) {
    input.setCustomValidity('Please enter your Umami server URL');
    elements.urlValidation.textContent = 'Please enter your Umami server URL';
    return false;
  }
  
  // Check if it's a valid URL (has protocol, etc)
  try {
    const url = new URL(input.value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      input.setCustomValidity('URL must use http:// or https:// protocol');
      elements.urlValidation.textContent = 'URL must use http:// or https:// protocol';
      return false;
    }
    
    // URL is valid
    input.setCustomValidity('');
    return true;
  } catch (e) {
    // Not a valid URL
    input.setCustomValidity('Please enter a valid URL');
    elements.urlValidation.textContent = 'Please enter a valid URL';
    return false;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load settings
  loadSettings();
  
  // Add event listeners
  elements.credentialsForm.addEventListener('submit', saveCredentials);
  elements.displayForm.addEventListener('submit', saveDisplaySettings);
  elements.verifyButton.addEventListener('click', verifyConnection);
  elements.resetButton.addEventListener('click', resetSettings);
  
  // Validation
  elements.baseUrl.addEventListener('input', () => validateUrl(elements.baseUrl));
  elements.baseUrl.addEventListener('paste', (e) => {
    // Use setTimeout to let the paste complete before validation
    setTimeout(() => validateUrl(elements.baseUrl), 0);
  });
  
  // Hide help text on input focus
  elements.baseUrl.addEventListener('focus', () => {
    elements.urlHelp.style.opacity = '0.5';
  });
  
  elements.baseUrl.addEventListener('blur', () => {
    elements.urlHelp.style.opacity = '1';
  });
});
