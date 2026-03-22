class ResonanceUI {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.currentData = null;
    this.init();
  }

  init() {
    this.createPanel();
    this.setupEventListeners();
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(['panelPosition', 'autoShow']);
      this.panelPosition = settings.panelPosition || 'top-right';
      this.autoShow = settings.autoShow !== false; // Default true
      this.updatePanelPosition();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'resonance-panel';
    this.panel.className = 'resonance-panel hidden';

    this.panel.innerHTML = `
      <div class="resonance-header">
        <div class="resonance-logo">
          <span>🎵</span>
          <span class="logo-text">Resonance AI</span>
        </div>
        <div class="resonance-controls">
          <button class="resonance-minimize" title="Minimize">−</button>
          <button class="resonance-close" title="Close">×</button>
        </div>
      </div>
      <div class="resonance-content">
        <div class="resonance-loading">
          <div class="loading-spinner"></div>
          <span>Analyzing song...</span>
        </div>
        <div class="resonance-error hidden">
          <span class="error-icon">⚠️</span>
          <span class="error-message"></span>
          <button class="retry-button">Retry</button>
        </div>
        <div class="resonance-analysis hidden">
          <div class="song-info">
            <h3 class="song-title"></h3>
            <p class="song-artist"></p>
          </div>
          <div class="analysis-tabs">
            <button class="tab active" data-tab="meaning">Meaning</button>
            <button class="tab" data-tab="themes">Themes</button>
            <button class="tab" data-tab="trivia">Trivia</button>
            <button class="tab" data-tab="process">Process</button>
          </div>
          <div class="analysis-content">
            <div class="tab-content active" data-tab="meaning">
              <p class="meaning-text"></p>
            </div>
            <div class="tab-content" data-tab="themes">
              <div class="themes-list"></div>
            </div>
            <div class="tab-content" data-tab="trivia">
              <p class="trivia-text"></p>
            </div>
            <div class="tab-content" data-tab="process">
              <p class="process-text"></p>
            </div>
          </div>
        </div>
        <div class="resonance-no-music hidden">
          <span class="info-icon">ℹ️</span>
          <span>This doesn't appear to be a music video</span>
        </div>
        <div class="resonance-no-api hidden">
          <span class="warning-icon">🔑</span>
          <span>API key not configured</span>
          <button class="config-button">Configure</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
  }

  setupEventListeners() {
    // Close button
    this.panel.querySelector('.resonance-close').addEventListener('click', () => {
      this.hide();
    });

    // Minimize button
    this.panel.querySelector('.resonance-minimize').addEventListener('click', () => {
      this.panel.classList.toggle('minimized');
    });

    // Retry button
    this.panel.querySelector('.retry-button').addEventListener('click', () => {
      if (window.songDetector) {
        window.songDetector.detectCurrentSong();
      }
    });

    // Config button
    this.panel.querySelector('.config-button').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Tab switching
    this.panel.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Listen for song detection events
    document.addEventListener('resonanceDetection', (event) => {
      this.handleDetectionEvent(event.detail);
    });

    // Dragging functionality
    this.setupDragging();
  }

  setupDragging() {
    const header = this.panel.querySelector('.resonance-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.panel.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;

      // Keep panel within viewport
      const maxLeft = window.innerWidth - this.panel.offsetWidth;
      const maxTop = window.innerHeight - this.panel.offsetHeight;

      this.panel.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
      this.panel.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
      this.panel.style.right = 'auto';
      this.panel.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  updatePanelPosition() {
    this.panel.className = `resonance-panel ${this.panelPosition}`;
  }

  handleDetectionEvent(detail) {
    const { status, data } = detail;

    this.hideAllStates();

    switch (status) {
      case 'loading':
        this.showLoading();
        break;

      case 'success':
        if (data && data.song) {
          this.showAnalysis(data);
        }
        break;

      case 'error':
        this.showError(data);
        break;

      case 'not-music':
      case 'no-song-info':
        this.showNotMusic();
        break;

      case 'no-title':
        // Don't show anything for no title
        return;
    }

    if (this.autoShow && status !== 'not-music' && status !== 'no-title') {
      this.show();
    }
  }

  hideAllStates() {
    this.panel.querySelectorAll('.resonance-loading, .resonance-error, .resonance-analysis, .resonance-no-music, .resonance-no-api')
      .forEach(el => el.classList.add('hidden'));
  }

  showLoading() {
    this.panel.querySelector('.resonance-loading').classList.remove('hidden');
  }

  showError(message) {
    const errorEl = this.panel.querySelector('.resonance-error');
    const messageEl = errorEl.querySelector('.error-message');

    messageEl.textContent = message || 'An error occurred';
    errorEl.classList.remove('hidden');
  }

  showNotMusic() {
    this.panel.querySelector('.resonance-no-music').classList.remove('hidden');
  }

  showAnalysis(data) {
    const { song, analysis } = data;
    this.currentData = data;

    // Update song info
    this.panel.querySelector('.song-title').textContent = song.title || 'Unknown Song';
    this.panel.querySelector('.song-artist').textContent = song.artist || 'Unknown Artist';

    if (analysis) {
      // Update analysis content
      this.panel.querySelector('.meaning-text').textContent = analysis.meaning || 'No meaning available';
      this.panel.querySelector('.trivia-text').textContent = analysis.trivia || 'No trivia available';
      this.panel.querySelector('.process-text').textContent = analysis.writingProcess || 'No writing process information available';

      // Update themes
      const themesContainer = this.panel.querySelector('.themes-list');
      themesContainer.innerHTML = '';

      if (analysis.themes && analysis.themes.length > 0) {
        analysis.themes.forEach(theme => {
          const themeEl = document.createElement('span');
          themeEl.className = 'theme-tag';
          themeEl.textContent = theme;
          themesContainer.appendChild(themeEl);
        });
      } else {
        themesContainer.innerHTML = '<span class="no-themes">No themes identified</span>';
      }
    } else {
      // No analysis available
      this.panel.querySelector('.meaning-text').textContent = 'Analysis is being generated...';
      this.panel.querySelector('.trivia-text').textContent = 'Analysis is being generated...';
      this.panel.querySelector('.process-text').textContent = 'Analysis is being generated...';
      this.panel.querySelector('.themes-list').innerHTML = '<span class="no-themes">Analysis is being generated...</span>';
    }

    this.panel.querySelector('.resonance-analysis').classList.remove('hidden');
  }

  switchTab(tabName) {
    // Update tab buttons
    this.panel.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    this.panel.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
  }

  show() {
    this.panel.classList.remove('hidden');
    this.isVisible = true;
  }

  hide() {
    this.panel.classList.add('hidden');
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isShowing() {
    return this.isVisible;
  }
}

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.resonanceUI = new ResonanceUI();
  });
} else {
  window.resonanceUI = new ResonanceUI();
}