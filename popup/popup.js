import { StorageManager } from '../src/storage.js';
import { UmamiAPI } from '../src/api.js';

// Prevent multiple simultaneous updates
let isUpdating = false;
async function debouncedUpdate() {
  if (isUpdating) {
    return;
  }
  isUpdating = true;
  try {
    await updateStats();
  } finally {
    isUpdating = false;
  }
}

// UI Elements
const elements = {
  setupRequired: document.getElementById('setupRequired'),
  errorMessage: document.getElementById('errorMessage'),
  stats: document.getElementById('stats'),
  loading: document.getElementById('loading'),
  activeUsers: document.getElementById('activeUsers'),
  pageViews: document.getElementById('pageViews'),
  visitors: document.getElementById('visitors'),
  visits: document.getElementById('visits'),
  bounces: document.getElementById('bounces'),
  totalTime: document.getElementById('totalTime'),
  settingsButton: document.getElementById('settingsButton'),
  openSettings: document.getElementById('openSettings'),
  retryButton: document.getElementById('retryButton'),
  refreshButton: document.getElementById('refreshButton'),
  serverName: document.getElementById('serverName')
};

let api = null;

/**
 * Format numbers for display
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format time in minutes to human readable format
 */
function formatTime(minutes) {
  if (!minutes) return '0m';
  
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate and format trend percentage
 */
function formatTrend(current, previous) {
  if (!previous) return '';

  const percentage = ((current - previous) / previous) * 100;
  const sign = percentage >= 0 ? '+' : '-';
  const absValue = Math.abs(percentage);
  
  // Handle values >= 1000 with comma
  if (absValue >= 1000) {
    const thousands = Math.floor(absValue / 1000);
    const remainder = Math.floor(absValue % 1000);
    return `${sign}${thousands},${remainder.toString().padStart(3, '0')}%`;
  }
  
  // Show decimal only for values < 1
  return absValue < 1 ? 
    `${sign}${absValue.toFixed(1)}%` : 
    `${sign}${Math.round(absValue)}%`;
}

/**
 * Update trend indicator
 */
function updateTrend(element, current, previous) {
  const trend = element.querySelector('.trend');
  const percentage = formatTrend(current, previous);

  if (!percentage) {
    trend.textContent = '';
    return;
  }

  trend.textContent = percentage;
  trend.className = `trend ${current >= previous ? 'up' : 'down'}`;
}

/**
 * Show specified element and hide others
 */
function showElement(elementToShow) {
  // Hide all main content elements
  elements.setupRequired.classList.add('hidden');
  elements.errorMessage.classList.add('hidden');
  elements.stats.classList.add('hidden');
  elements.loading.classList.add('hidden');
  
  // Show or hide action buttons
  elements.retryButton.classList.add('hidden');
  elements.refreshButton.classList.remove('hidden');

  // Show the requested element
  if (elementToShow) {
    elementToShow.classList.remove('hidden');
  }

  // Show retry button when error is shown
  if (elementToShow === elements.errorMessage) {
    elements.retryButton.classList.remove('hidden');
    elements.refreshButton.classList.add('hidden');
  }
}

/**
 * Update server name in header
 */
async function updateServerName() {
  const config = await StorageManager.getConfig();
  const url = new URL(config.baseUrl);

  // Remove protocol and www if present
  const displayName = url.hostname.replace(/^www\./, '');
  elements.serverName.textContent = displayName;

  // Get the container width
  const headerTitle = document.querySelector('.header-title');
  const containerWidth = headerTitle.offsetWidth - 50; // Account for logo and padding

  // Start with normal size and reduce if needed
  let fontSize = 14;
  elements.serverName.style.fontSize = `${fontSize}px`;

  // Reduce font size until it fits or hits minimum
  while (elements.serverName.scrollWidth > containerWidth && fontSize > 10) {
    fontSize--;
    elements.serverName.style.fontSize = `${fontSize}px`;
  }
}

/**
 * Initialize the API client
 */
async function initializeAPI() {
  if (!await StorageManager.hasCredentials()) {
    showElement(elements.setupRequired);
    return false;
  }

  try {
    api = new UmamiAPI();
    const config = await StorageManager.getConfig();
    api.serverType = config.serverType;
    api.baseUrl = config.baseUrl;
    api.token = config.token;
    api.websiteId = config.websiteId;
    api.username = config.username;
    api.password = config.password;
    await api.init();
    await updateServerName();
    return true;
  } catch (error) {
    console.error('Failed to initialize API:', error);
    showElement(elements.errorMessage);
    return false;
  }
}

/**
 * Set loading state for stats
 */
function setLoadingState() {
  elements.activeUsers.querySelector('.stat-value').textContent = '...';
  elements.pageViews.querySelector('.stat-value').textContent = '...';
  elements.visitors.querySelector('.stat-value').textContent = '...';
  elements.visits.querySelector('.stat-value').textContent = '...';
  elements.bounces.querySelector('.stat-value').textContent = '...';
  elements.totalTime.querySelector('.stat-value').textContent = '...';
  elements.pageViews.querySelector('.trend').textContent = '';
  elements.visitors.querySelector('.trend').textContent = '';
  elements.visits.querySelector('.trend').textContent = '';
  elements.bounces.querySelector('.trend').textContent = '';
  elements.totalTime.querySelector('.trend').textContent = '';
}

/**
 * Update stats UI with data
 */
function updateStatsUI(activeUsers, stats) {
  // Update active users
  elements.activeUsers.querySelector('.stat-value').textContent = formatNumber(activeUsers);

  // Update pageviews
  elements.pageViews.querySelector('.stat-value').textContent = formatNumber(stats.pageviews.value);
  updateTrend(elements.pageViews, stats.pageviews.value, stats.pageviews.prev);

  // Update visitors
  elements.visitors.querySelector('.stat-value').textContent = formatNumber(stats.visitors.value);
  updateTrend(elements.visitors, stats.visitors.value, stats.visitors.prev);

  // Update visits
  elements.visits.querySelector('.stat-value').textContent = formatNumber(stats.visits.value);
  updateTrend(elements.visits, stats.visits.value, stats.visits.prev);

  // Update bounces
  elements.bounces.querySelector('.stat-value').textContent = formatNumber(stats.bounces.value);
  updateTrend(elements.bounces, stats.bounces.value, stats.bounces.prev);

  // Update total time
  const formattedTime = formatTime(stats.totaltime.value);
  elements.totalTime.querySelector('.stat-value').textContent = formattedTime;
  updateTrend(elements.totalTime, stats.totaltime.value, stats.totaltime.prev);
}

/**
 * Update stats display
 */
async function updateStats() {
  try {
    // Initialize API if needed
    if (!api) {
      const initialized = await initializeAPI();
      if (!initialized) {
        showElement(elements.setupRequired);
        return;
      }
    }

    // Fetch data in background
    Promise.all([
      api.getActiveUsers(),
      api.getDailyStats()
    ])
      .then(([activeUsers, stats]) => {
        updateStatsUI(activeUsers, stats);
        // Update badge after UI is updated
        chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' });
      })
      .catch(error => {
        console.error('Failed to update stats:', error);
        showElement(elements.errorMessage);
      });

  } catch (error) {
    console.error('Failed to initialize API:', error);
    showElement(elements.errorMessage);
  }
}

// Event Listeners
elements.settingsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

elements.openSettings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

elements.retryButton.addEventListener('click', () => {
  // Show stats container and loading state
  showElement(elements.stats);
  setLoadingState();

  // Disable retry button during update
  elements.retryButton.disabled = true;

  // Start retry and re-enable button when done
  debouncedUpdate();
  Promise.resolve().finally(() => {
    elements.retryButton.disabled = false;
  });
});

// Refresh button click handler
elements.refreshButton.addEventListener('click', () => {
  // Show loading state
  setLoadingState();

  // Disable refresh button during update
  elements.refreshButton.disabled = true;

  // Start refresh and re-enable button when done
  debouncedUpdate();
  Promise.resolve().finally(() => {
    elements.refreshButton.disabled = false;
  });
});

// Cleanup function to reset state when popup closes
function cleanup() {
  api = null;
  isUpdating = false;
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Show stats container immediately
  showElement(elements.stats);
  // Set initial loading state
  setLoadingState();

  // Adjust card layout for responsive display
  document.querySelectorAll('.stat-card').forEach(card => {
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
  });

  // Start loading data with debounce
  debouncedUpdate();
});

// Cleanup when popup is closed
window.addEventListener('unload', cleanup);
