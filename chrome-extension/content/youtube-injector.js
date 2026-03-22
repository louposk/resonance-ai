// Main content script for YouTube integration
class YouTubeInjector {
  constructor() {
    this.isYouTube = this.checkYouTubeUrl();
    this.initialized = false;
    this.init();
  }

  checkYouTubeUrl() {
    return window.location.hostname.includes('youtube.com');
  }

  async init() {
    if (!this.isYouTube) {
      console.log('Not on YouTube, skipping injection');
      return;
    }

    console.log('Resonance AI: Initializing YouTube integration');

    try {
      // Check if API key is configured
      const hasApiKey = await this.checkApiKey();
      if (!hasApiKey) {
        console.log('No API key configured');
        this.showApiKeyPrompt();
        return;
      }

      // Wait for YouTube to load
      await this.waitForYouTubeLoad();

      // Initialize components
      this.initializeComponents();

      // Add keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Add extension button to YouTube interface
      this.addExtensionButton();

      this.initialized = true;
      console.log('Resonance AI: Successfully initialized');

    } catch (error) {
      console.error('Resonance AI: Initialization error:', error);
    }
  }

  async checkApiKey() {
    try {
      const apiKey = await sendMessage('getApiKey');
      return !!apiKey;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }

  async waitForYouTubeLoad() {
    return new Promise((resolve) => {
      const checkLoad = () => {
        // Check for key YouTube elements
        const hasPlayer = document.querySelector('#player');
        const hasContent = document.querySelector('#content');

        if (hasPlayer && hasContent) {
          resolve();
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });
  }

  initializeComponents() {
    // Components are initialized by their respective scripts
    // This method can be used for any additional setup
    console.log('YouTube components initialized');
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + R to toggle panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        if (window.resonanceUI) {
          window.resonanceUI.toggle();
        }
      }

      // Escape to close panel
      if (event.key === 'Escape' && window.resonanceUI && window.resonanceUI.isShowing()) {
        event.preventDefault();
        window.resonanceUI.hide();
      }
    });
  }

  addExtensionButton() {
    // Find a good place to add our button in YouTube's UI
    const addButton = () => {
      // Try to find the top bar or controls area
      const selectors = [
        '#end.style-scope.ytd-masthead',  // Top right area
        '.ytp-chrome-controls .ytp-right-controls', // Video player controls
        '#owner-sub-count' // Below video info
      ];

      for (const selector of selectors) {
        const container = document.querySelector(selector);
        if (container && !container.querySelector('#resonance-button')) {
          this.createExtensionButton(container);
          break;
        }
      }
    };

    // Try to add button now
    addButton();

    // Also try again after navigation changes
    setTimeout(addButton, 2000);
  }

  createExtensionButton(container) {
    const button = document.createElement('button');
    button.id = 'resonance-button';
    button.className = 'resonance-toggle-button';
    button.innerHTML = '🎵 Resonance AI';
    button.title = 'Toggle Resonance AI Analysis (Ctrl+Shift+R)';

    button.addEventListener('click', () => {
      if (window.resonanceUI) {
        window.resonanceUI.toggle();
      }
    });

    // Style the button to fit with YouTube's design
    button.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 8px 12px;
      border-radius: 18px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    container.appendChild(button);
  }

  showApiKeyPrompt() {
    // Show a notification that API key is needed
    const notification = document.createElement('div');
    notification.className = 'resonance-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>🎵</span>
        <span>Resonance AI needs an API key to work. Click to configure.</span>
        <button class="configure-btn">Configure</button>
        <button class="dismiss-btn">×</button>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: #1976d2;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: 'YouTube Sans', 'Roboto', sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Handle buttons
    notification.querySelector('.configure-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openOptionsPage' });
      notification.remove();
    });

    notification.querySelector('.dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  // Health check method
  async healthCheck() {
    try {
      const isHealthy = await sendMessage('healthCheck');
      return isHealthy;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Manually trigger song detection
  detectSong() {
    if (window.songDetector) {
      window.songDetector.detectCurrentSong();
    }
  }

  // Get current song info
  getCurrentSong() {
    if (window.songDetector) {
      return window.songDetector.getCurrentSong();
    }
    return null;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.youtubeInjector = new YouTubeInjector();
  });
} else {
  window.youtubeInjector = new YouTubeInjector();
}

// Handle messages from popup and other extension components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'detectSong':
        if (window.youtubeInjector) {
          window.youtubeInjector.detectSong();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Extension not initialized' });
        }
        break;

      case 'togglePanel':
        if (window.resonanceUI) {
          window.resonanceUI.toggle();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'UI not initialized' });
        }
        break;

      case 'getCurrentSong':
        const currentSong = window.youtubeInjector?.getCurrentSong();
        sendResponse({
          success: true,
          song: currentSong?.song,
          analysis: currentSong?.analysis
        });
        break;

      case 'getExtensionStatus':
        sendResponse({
          success: true,
          initialized: !!window.youtubeInjector,
          hasUI: !!window.resonanceUI,
          hasDetector: !!window.songDetector,
          isYouTube: window.location.hostname.includes('youtube.com')
        });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Keep message channel open
});

// Expose for debugging
window.ResonanceAI = {
  injector: window.youtubeInjector,
  detector: window.songDetector,
  ui: window.resonanceUI,
  detectSong: () => window.youtubeInjector?.detectSong(),
  getCurrentSong: () => window.youtubeInjector?.getCurrentSong(),
  toggleUI: () => window.resonanceUI?.toggle(),
  healthCheck: () => window.youtubeInjector?.healthCheck()
};