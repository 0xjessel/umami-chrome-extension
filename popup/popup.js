import { StorageManager } from '../src/storage.js';
import { UmamiAPI } from '../src/api.js';
import './popup.css';

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

// Define elements but don't access DOM yet
let elements = {};

let api = null;

/**
 * Format numbers for display
 */
function formatNumber(num) {
  if (num === undefined || num === null) {
    return '0';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format time in minutes to display format
 */
function formatTime(minutes) {
  if (minutes === undefined || minutes === null) {
    return '0s';
  }
  
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return seconds + 's';
  }
  
  if (minutes < 60) {
    return Math.round(minutes) + 'm';
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours + 'h';
  }
  
  const days = Math.floor(hours / 24);
  return days + 'd';
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
  if (!elements.setupRequired || !elements.errorMessage || !elements.stats || !elements.loading) return;

  // Hide all elements first
  elements.setupRequired.classList.add('hidden');
  elements.errorMessage.classList.add('hidden');
  elements.stats.classList.add('hidden');
  elements.loading.classList.add('hidden');
  
  // Show the requested element
  elementToShow.classList.remove('hidden');
  
  // Show or hide action buttons
  if (elements.retryButton && elements.refreshButton) {
    elements.retryButton.classList.add('hidden');
    elements.refreshButton.classList.remove('hidden');
    
    // Show retry button when error is shown
    if (elementToShow === elements.errorMessage) {
      elements.retryButton.classList.remove('hidden');
      elements.refreshButton.classList.add('hidden');
    }
  }
  
  // Set appropriate height for different states
  if (elementToShow === elements.stats) {
    // For stats, height is handled by adjustPopupHeight()
    adjustPopupHeight();
  } else if (elementToShow === elements.setupRequired || elementToShow === elements.errorMessage) {
    // For setup or error screens - use fixed compact size
    document.body.style.height = '200px';
  } else if (elementToShow === elements.loading) {
    // For loading screen - use minimal size
    document.body.style.height = '150px';
  }
}

/**
 * Set initial server name from storage
 */
async function setInitialServerName() {
  try {
    if (!elements.serverName) return;
    
    // Get server display name from storage
    const config = await StorageManager.getConfig();
    const displayName = config.displayName || '';
    
    if (displayName) {
      elements.serverName.textContent = displayName;
    } else {
      // Use empty string as default
      elements.serverName.textContent = '';
      
      // Cache empty string as the display name
      await StorageManager.updateConfig({ displayName: '' });
    }
  } catch (error) {
    console.error('Error setting server name:', error);
    if (elements.serverName) {
      elements.serverName.textContent = '';
    }
  }
}

/**
 * Load and display cached metrics if they exist
 */
async function loadCachedMetrics() {
  try {
    const config = await StorageManager.getConfig();
    const { cachedMetrics } = config;
    
    // Skip if no cached data
    if (!cachedMetrics || !cachedMetrics.lastUpdated) {
      return false;
    }
    
    // Active Users
    if (cachedMetrics.activeUsers !== null) {
      elements.activeUsers.querySelector('.stat-value').textContent = formatNumber(cachedMetrics.activeUsers);
    }
    
    // Page Views
    if (cachedMetrics.pageViews?.value !== null) {
      elements.pageViews.querySelector('.stat-value').textContent = formatNumber(cachedMetrics.pageViews.value);
      if (cachedMetrics.pageViews.trend) {
        elements.pageViews.querySelector('.trend').textContent = cachedMetrics.pageViews.trend;
      }
    }
    
    // Visitors
    if (cachedMetrics.visitors?.value !== null) {
      elements.visitors.querySelector('.stat-value').textContent = formatNumber(cachedMetrics.visitors.value);
      if (cachedMetrics.visitors.trend) {
        elements.visitors.querySelector('.trend').textContent = cachedMetrics.visitors.trend;
      }
    }
    
    // Visits
    if (cachedMetrics.visits?.value !== null) {
      elements.visits.querySelector('.stat-value').textContent = formatNumber(cachedMetrics.visits.value);
      if (cachedMetrics.visits.trend) {
        elements.visits.querySelector('.trend').textContent = cachedMetrics.visits.trend;
      }
    }
    
    // Bounces
    if (cachedMetrics.bounces?.value !== null) {
      elements.bounces.querySelector('.stat-value').textContent = formatNumber(cachedMetrics.bounces.value);
      if (cachedMetrics.bounces.trend) {
        elements.bounces.querySelector('.trend').textContent = cachedMetrics.bounces.trend;
      }
    }
    
    // Total Time
    if (cachedMetrics.totalTime?.value !== null) {
      const formattedTime = formatTime(cachedMetrics.totalTime.value);
      elements.totalTime.querySelector('.stat-value').textContent = formattedTime;
      if (cachedMetrics.totalTime.trend) {
        elements.totalTime.querySelector('.trend').textContent = cachedMetrics.totalTime.trend;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to load cached metrics:', error);
    return false;
  }
}

/**
 * Adjust popup height based on visible metrics
 */
function adjustPopupHeight() {
  // Get all visible stat cards
  const visibleCards = Array.from(document.querySelectorAll('.stat-card'))
    .filter(card => !card.classList.contains('hidden'));
  
  if (visibleCards.length === 0) return;
  
  // Get the header height
  const headerHeight = document.querySelector('header').offsetHeight;
  
  // Calculate based on number of cards
  const cardHeight = 80; // Each card is 80px tall
  const cardGap = 8; // 0.5rem gap between cards
  const mainPadding = 16; // 0.5rem top and bottom padding (8px * 2)
  
  // Calculate content height based on number of cards
  const contentHeight = (visibleCards.length * cardHeight) + ((visibleCards.length - 1) * cardGap);
  const totalHeight = headerHeight + contentHeight + mainPadding;
  
  // Set height - dynamically adjusts based on actual number of visible cards
  document.body.style.height = `${totalHeight}px`;
}

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize DOM elements
  elements = {
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

  // Set up event listeners
  if (elements.settingsButton) {
    elements.settingsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  if (elements.openSettings) {
    elements.openSettings.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  if (elements.retryButton) {
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
  }

  // Refresh button click handler
  if (elements.refreshButton) {
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
  }

  // Immediately set server name and load cached metrics
  await setInitialServerName();
  const hasCachedMetrics = await loadCachedMetrics();

  // Load user preferences
  const config = await StorageManager.getConfig();
  
  // Apply visibility settings based on user preferences
  if (!config.showActiveUsers && elements.activeUsers) elements.activeUsers.classList.add('hidden');
  if (!config.showPageViews && elements.pageViews) elements.pageViews.classList.add('hidden');
  if (!config.showVisitors && elements.visitors) elements.visitors.classList.add('hidden');
  if (!config.showVisits && elements.visits) elements.visits.classList.add('hidden');
  if (!config.showBounces && elements.bounces) elements.bounces.classList.add('hidden');
  if (!config.showTotalTime && elements.totalTime) elements.totalTime.classList.add('hidden');
  
  // Show stats container immediately
  showElement(elements.stats);
  
  // Set initial loading state if needed
  if (!hasCachedMetrics) {
    setLoadingState();
  }
  
  // Adjust card layout for responsive display
  document.querySelectorAll('.stat-card').forEach(card => {
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
  });
  
  // Initialize API and fetch latest stats
  const apiInitialized = await initializeAPI();
  if (apiInitialized) {
    await debouncedUpdate();
  }
});

/**
 * Adjust header font size to fit container
 */
function adjustHeaderFontSize() {
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
 * Update server name in header
 */
async function updateServerName() {
  const config = await StorageManager.getConfig();
  
  // Use cached display name if available, otherwise use empty string
  let displayName = config.displayName;
  if (displayName === undefined) {
    // Use empty string as default
    displayName = '';
    
    // Cache the empty display name for future use
    await StorageManager.updateConfig({ displayName });
  }
  
  // Update the text content
  elements.serverName.textContent = displayName;
  
  // Adjust font size if needed
  adjustHeaderFontSize();
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
  // Get all stat value elements
  const statValueElements = [
    elements.activeUsers.querySelector('.stat-value'),
    elements.pageViews.querySelector('.stat-value'),
    elements.visitors.querySelector('.stat-value'),
    elements.visits.querySelector('.stat-value'),
    elements.bounces.querySelector('.stat-value'),
    elements.totalTime.querySelector('.stat-value')
  ];
  
  // Check if any have values other than loading placeholder
  const hasDisplayedValues = statValueElements.some(el => 
    el.textContent !== '' && el.textContent !== '-' && el.textContent !== '...');
  
  // Only set loading state for elements without values
  if (!hasDisplayedValues) {
    elements.activeUsers.querySelector('.stat-value').textContent = '...';
    elements.pageViews.querySelector('.stat-value').textContent = '...';
    elements.visitors.querySelector('.stat-value').textContent = '...';
    elements.visits.querySelector('.stat-value').textContent = '...';
    elements.bounces.querySelector('.stat-value').textContent = '...';
    elements.totalTime.querySelector('.stat-value').textContent = '...';
  }
  
  // Always clear trends during loading as they'll be updated
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
  
  // Cache the updated metrics
  const pageViewsTrend = elements.pageViews.querySelector('.trend').textContent;
  const visitorsTrend = elements.visitors.querySelector('.trend').textContent;
  const visitsTrend = elements.visits.querySelector('.trend').textContent;
  const bouncesTrend = elements.bounces.querySelector('.trend').textContent;
  const totalTimeTrend = elements.totalTime.querySelector('.trend').textContent;
  
  StorageManager.updateCachedMetrics({
    activeUsers,
    pageViews: { value: stats.pageviews.value, trend: pageViewsTrend },
    visitors: { value: stats.visitors.value, trend: visitorsTrend },
    visits: { value: stats.visits.value, trend: visitsTrend },
    bounces: { value: stats.bounces.value, trend: bouncesTrend },
    totalTime: { value: stats.totaltime.value, trend: totalTimeTrend }
  });
  
  // Adjust popup height after data is loaded
  adjustPopupHeight();
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

// Cleanup function to reset state when popup closes
function cleanup() {
  api = null;
  isUpdating = false;
}

// Cleanup when popup is closed
window.addEventListener('unload', cleanup);
