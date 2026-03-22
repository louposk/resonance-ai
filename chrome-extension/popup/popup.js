document.addEventListener('DOMContentLoaded', async function() {
  const elements = {
    apiKey: document.getElementById('apiKey'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    saveApiKey: document.getElementById('saveApiKey'),
    testApiKey: document.getElementById('testApiKey'),
    apiStatus: document.getElementById('apiStatus'),
    autoShow: document.getElementById('autoShow'),
    panelPosition: document.getElementById('panelPosition'),
    detectionSensitivity: document.getElementById('detectionSensitivity'),
    currentSongInfo: document.getElementById('currentSongInfo'),
    detectSong: document.getElementById('detectSong'),
    togglePanel: document.getElementById('togglePanel'),
    clearCache: document.getElementById('clearCache'),
    cacheCount: document.getElementById('cacheCount')
  };

  // Load saved settings
  await loadSettings();

  // Event listeners
  elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
  elements.saveApiKey.addEventListener('click', saveApiKey);
  elements.testApiKey.addEventListener('click', testApiConnection);
  elements.autoShow.addEventListener('change', saveSetting);
  elements.panelPosition.addEventListener('change', saveSetting);
  elements.detectionSensitivity.addEventListener('change', saveSetting);
  elements.detectSong.addEventListener('click', detectCurrentSong);
  elements.togglePanel.addEventListener('click', toggleAnalysisPanel);
  elements.clearCache.addEventListener('click', clearCache);

  // Update current song info
  updateCurrentSongInfo();

  // Update cache count (placeholder)
  updateCacheCount();

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'apiKey',
        'autoShow',
        'panelPosition',
        'detectionSensitivity'
      ]);

      if (result.apiKey) {
        elements.apiKey.value = result.apiKey;
      }

      elements.autoShow.checked = result.autoShow !== false; // Default true
      elements.panelPosition.value = result.panelPosition || 'top-right';
      elements.detectionSensitivity.value = result.detectionSensitivity || 'normal';
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus('error', 'Error loading settings');
    }
  }

  function toggleApiKeyVisibility() {
    const isPassword = elements.apiKey.type === 'password';
    elements.apiKey.type = isPassword ? 'text' : 'password';
    elements.toggleApiKey.textContent = isPassword ? '🙈' : '👁️';
  }

  async function saveApiKey() {
    const apiKey = elements.apiKey.value.trim();

    if (!apiKey) {
      showStatus('error', 'Please enter an API key');
      return;
    }

    try {
      // Send API key to background script
      await sendMessage('setApiKey', { apiKey });

      // Save to storage
      await chrome.storage.sync.set({ apiKey });

      showStatus('success', 'API key saved successfully');

      // Test the connection
      setTimeout(testApiConnection, 500);
    } catch (error) {
      console.error('Error saving API key:', error);
      showStatus('error', 'Error saving API key: ' + error.message);
    }
  }

  async function testApiConnection() {
    try {
      showStatus('info', 'Testing connection...');

      const isHealthy = await sendMessage('healthCheck');

      if (isHealthy) {
        showStatus('success', 'Connection successful! API is working.');
      } else {
        showStatus('error', 'Connection failed. Please check your API key and try again.');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      showStatus('error', 'Connection test failed: ' + error.message);
    }
  }

  async function saveSetting(event) {
    const setting = event.target.id;
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    try {
      await chrome.storage.sync.set({ [setting]: value });
      showStatus('success', 'Setting saved');

      // Hide status after 2 seconds
      setTimeout(() => {
        elements.apiStatus.style.display = 'none';
      }, 2000);
    } catch (error) {
      console.error('Error saving setting:', error);
      showStatus('error', 'Error saving setting');
    }
  }

  async function detectCurrentSong() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('youtube.com')) {
        showStatus('error', 'Please navigate to a YouTube page');
        return;
      }

      showStatus('info', 'Detecting song...');

      // Execute script in content script context
      await chrome.tabs.sendMessage(tab.id, { action: 'detectSong' });

      showStatus('success', 'Song detection triggered');

      // Update song info after a delay
      setTimeout(updateCurrentSongInfo, 2000);
    } catch (error) {
      console.error('Error detecting song:', error);
      showStatus('error', 'Error: ' + error.message);
    }
  }

  async function toggleAnalysisPanel() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('youtube.com')) {
        showStatus('error', 'Please navigate to a YouTube page');
        return;
      }

      await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
      showStatus('success', 'Panel toggled');
    } catch (error) {
      console.error('Error toggling panel:', error);
      showStatus('error', 'Error: ' + error.message);
    }
  }

  async function clearCache() {
    try {
      await sendMessage('clearCache');
      showStatus('success', 'Cache cleared successfully');
      updateCacheCount();
    } catch (error) {
      console.error('Error clearing cache:', error);
      showStatus('error', 'Error clearing cache');
    }
  }

  async function updateCurrentSongInfo() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('youtube.com')) {
        elements.currentSongInfo.innerHTML = '<div class="no-song">Not on YouTube</div>';
        return;
      }

      // Try to get current song info from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentSong' });

      if (response && response.song) {
        elements.currentSongInfo.innerHTML = `
          <div class="song-display">
            <div class="title">${response.song.title}</div>
            <div class="artist">${response.song.artist}</div>
          </div>
        `;
      } else {
        elements.currentSongInfo.innerHTML = '<div class="no-song">No song detected</div>';
      }
    } catch (error) {
      console.error('Error updating song info:', error);
      elements.currentSongInfo.innerHTML = '<div class="no-song">Error loading song info</div>';
    }
  }

  function updateCacheCount() {
    // Placeholder - in a real implementation, you'd get this from the background script
    elements.cacheCount.textContent = '0';
  }

  function showStatus(type, message) {
    elements.apiStatus.className = `status-message ${type}`;
    elements.apiStatus.textContent = message;
    elements.apiStatus.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      elements.apiStatus.style.display = 'none';
    }, 5000);
  }

  function sendMessage(action, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, ...data }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  }

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'songDetected') {
      updateCurrentSongInfo();
    }
  });
});