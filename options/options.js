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
  serverType: document.querySelector('input[name="serverType"]:checked'),
  cloudAuth: document.getElementById('cloudAuth'),
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
  // Only set default cloud URL if no URL is saved or if server type is cloud
  elements.baseUrl.value = config.baseUrl || (config.serverType === 'cloud' ? 'https://cloud.umami.is' : '');
  elements.credentialsForm.querySelector('#websiteId').value = config.websiteId || '';
  
  // Set server type
  const serverType = config.serverType || 'cloud';
  elements.credentialsForm.querySelector(`input[name="serverType"][value="${serverType}"]`).checked = true;
  
  // Load auth credentials based on server type
  if (serverType === 'cloud') {
    elements.credentialsForm.querySelector('#apiKey').value = config.apiKey || '';
  } else {
    elements.credentialsForm.querySelector('#username').value = config.username || '';
    elements.credentialsForm.querySelector('#password').value = config.password || '';
  }
  
  // Show/hide appropriate auth fields
  toggleAuthFields(serverType);

  // Load display settings
  const badgeMetricInputs = elements.displayForm.querySelectorAll('input[name="badgeMetric"]');
  badgeMetricInputs.forEach(input => {
    input.checked = input.value === config.badgeMetric;
  });

  elements.displayForm.querySelector('input[name="showActiveUsers"]').checked = config.showActiveUsers;
  elements.displayForm.querySelector('input[name="showPageViews"]').checked = config.showPageViews;
  elements.displayForm.querySelector('input[name="showVisitors"]').checked = config.showVisitors;
  
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
 * Toggle authentication fields based on server type
 */
async function toggleAuthFields(serverType) {
  const config = await StorageManager.getConfig();
  if (serverType === 'cloud') {
    elements.cloudAuth.style.display = 'block';
    elements.selfHostedAuth.style.display = 'none';
    // Save the current URL if it's not the cloud URL
    const currentUrl = elements.baseUrl.value;
    if (currentUrl && currentUrl !== 'https://cloud.umami.is') {
      await StorageManager.updateConfig({ lastSelfHostedUrl: currentUrl });
    }
    elements.baseUrl.value = 'https://cloud.umami.is';
    elements.baseUrl.readOnly = true;
    elements.urlHelp.textContent = 'Using Umami Cloud (https://cloud.umami.is)';
    // Clear any validation messages since cloud URL is always valid
    elements.urlValidation.textContent = '';
    elements.baseUrl.setCustomValidity('');
  } else {
    elements.cloudAuth.style.display = 'none';
    elements.selfHostedAuth.style.display = 'block';
    // Restore the last used self-hosted URL if available
    if (config.lastSelfHostedUrl) {
      elements.baseUrl.value = config.lastSelfHostedUrl;
    } else if (!config.baseUrl || config.baseUrl === 'https://cloud.umami.is') {
      elements.baseUrl.value = '';
    }
    elements.baseUrl.readOnly = false;
    elements.urlHelp.textContent = 'Your self-hosted Umami server URL';
    validateUrl(elements.baseUrl);
  }
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
  const serverType = formData.get('serverType');
  const baseUrl = formData.get('baseUrl');
  const websiteId = formData.get('websiteId');

  // Validate URL format
  if (!validateUrl(elements.baseUrl)) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }
  
  try {
    let token;
    if (serverType === 'cloud') {
      token = formData.get('apiKey');
    } else {
      const username = formData.get('username');
      const password = formData.get('password');
      token = await getSelfHostedToken(baseUrl, username, password);
    }

    const credentials = {
      serverType,
      baseUrl,
      token,
      websiteId,
      // Store these separately for future use
      apiKey: serverType === 'cloud' ? token : null,
      username: serverType === 'self-hosted' ? formData.get('username') : null,
      password: serverType === 'self-hosted' ? formData.get('password') : null
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
  const serverType = formData.get('serverType');
  const baseUrl = formData.get('baseUrl');
  const websiteId = formData.get('websiteId');
  
  // Create API instance with current form values
  const api = new UmamiAPI();
  api.serverType = serverType;
  api.baseUrl = baseUrl;

  if (!websiteId) {
    showStatus('Website ID is required', 'error');
    return;
  }
  api.websiteId = websiteId;

  try {
    if (serverType === 'cloud') {
      api.token = formData.get('apiKey');
      if (!api.token) {
        showStatus('API key is required', 'error');
        return;
      }
    } else {
      const username = formData.get('username');
      const password = formData.get('password');
      if (!username || !password) {
        showStatus('Username and password are required', 'error');
        return;
      }
      api.username = username;
      api.password = password;
      await api.authenticate();
    }
    const isValid = await api.verifyAuth();
    
    if (isValid) {
      // Save credentials since verification succeeded
      await StorageManager.setCredentials({
        serverType,
        baseUrl,
        token: api.token,
        websiteId,
        apiKey: serverType === 'cloud' ? api.token : null,
        username: serverType === 'self-hosted' ? formData.get('username') : null,
        password: serverType === 'self-hosted' ? formData.get('password') : null
      });
      showStatus('Connection successful', 'success');
    } else {
      showStatus('Invalid credentials', 'error');
    }
  } catch (error) {
    showStatus('Connection failed: ' + error.message, 'error');
  }
}

/**
 * Validate URL format
 */
function validateUrl(input) {
  const validationMsg = elements.urlValidation;
  let url = input.value.trim();

  // Handle empty URL
  if (!url) {
    validationMsg.textContent = 'Please enter a URL';
    input.setCustomValidity('URL is required');
    return false;
  }

  // Check if protocol is present
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    validationMsg.textContent = 'URL must start with http:// or https://';
    input.setCustomValidity('Missing protocol');
    return false;
  }

  try {
    // Try to parse the URL to validate it
    const parsedUrl = new URL(url);
    
    // Ensure protocol is http or https
    if (!parsedUrl.protocol.match(/^https?:$/)) {
      throw new Error('Invalid protocol');
    }

    // Ensure we have a hostname
    if (!parsedUrl.hostname) {
      throw new Error('Missing hostname');
    }

    // Remove trailing slash from pathname if present
    if (parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith('/')) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
      url = parsedUrl.toString();
      input.value = url;
    }

    // URL is valid
    validationMsg.textContent = '';
    input.setCustomValidity('');
    return true;
  } catch (e) {
    validationMsg.textContent = 'Please enter a valid URL starting with http:// or https://';
    input.setCustomValidity('Invalid URL format');
    return false;
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Event Listeners
  elements.credentialsForm.addEventListener('submit', saveCredentials);
  elements.displayForm.addEventListener('submit', saveDisplaySettings);
  elements.verifyButton.addEventListener('click', verifyConnection);
  elements.resetButton.addEventListener('click', resetSettings);
  // Handle both typing and pasting for URL validation
  elements.baseUrl.addEventListener('input', (e) => validateUrl(e.target));
  elements.baseUrl.addEventListener('paste', (e) => {
    // Use setTimeout to let the paste complete before validation
    setTimeout(() => validateUrl(e.target), 0);
  });

  // Server type change handler
  document.querySelectorAll('input[name="serverType"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      try {
        await toggleAuthFields(e.target.value);
      } catch (error) {
        showStatus('Failed to update server type: ' + error.message, 'error');
      }
    });
  });

  // Load settings
  loadSettings();
});
