# Resonance AI Chrome Extension

A Chrome extension that integrates with the Resonance AI API to provide AI-powered music analysis while watching YouTube videos.

## Features

- **Automatic Song Detection**: Detects music videos on YouTube automatically
- **AI-Powered Analysis**: Get insights into song meanings, themes, writing process, and trivia
- **Smart Caching**: Caches analysis results to minimize API calls
- **Customizable UI**: Draggable analysis panel with multiple positioning options
- **Keyboard Shortcuts**: Quick access to extension features
- **Rate Limiting**: Respects API rate limits with intelligent retry logic

## Installation

### From Source

1. Clone or download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The Resonance AI extension should now appear in your extensions list

### Configuration

1. Click the Resonance AI icon in your browser toolbar
2. Enter your Resonance API key (get one from https://resonanceaimusic.com)
3. Configure your preferences:
   - Auto-show analysis panel
   - Panel position
   - Detection sensitivity
4. Click "Save" and "Test Connection" to verify setup

## Usage

### Automatic Detection

1. Navigate to any YouTube music video
2. The extension will automatically detect if it's a music video
3. If auto-show is enabled, the analysis panel will appear automatically
4. Browse through different tabs: Meaning, Themes, Trivia, and Process

### Manual Control

- **Toggle Panel**: Click the extension icon or use `Ctrl+Shift+R`
- **Close Panel**: Press `Escape` or click the × button
- **Minimize Panel**: Click the − button in the panel header
- **Move Panel**: Drag the panel header to reposition

### Keyboard Shortcuts

- `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac): Toggle analysis panel
- `Escape`: Close analysis panel

## API Integration

The extension integrates with the Resonance AI API with the following endpoints:

- `GET /api/songs/search` - Search for songs
- `GET /api/songs/:id/analysis` - Get AI analysis
- `POST /api/songs` - Create new song entries
- `GET /health` - API health check

### Authentication

Requires an API key that you can obtain from the Resonance AI dashboard. The key is stored securely in Chrome's sync storage.

### Rate Limiting

The extension respects the following rate limits:
- General: 100 requests per 15 minutes
- Search: 20 requests per minute
- Analysis: 10 requests per 5 minutes

## File Structure

```
chrome-extension/
├── manifest.json              # Extension manifest
├── background/
│   ├── service-worker.js      # Background service worker
│   └── api-client.js          # API client
├── content/
│   ├── youtube-injector.js    # Main YouTube integration
│   ├── song-detector.js       # Song detection logic
│   └── ui-components.js       # UI components
├── popup/
│   ├── popup.html            # Extension popup
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup functionality
├── assets/
│   └── styles/
│       └── content.css       # Content script styles
├── utils/
│   ├── helpers.js            # Utility functions
│   └── cache.js              # Caching system
└── README.md                 # This file
```

## Development

### Prerequisites

- Chrome browser
- Resonance AI API running locally (http://localhost:3000)
- Valid API key

### Local Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the reload button on the Resonance AI extension card
4. Test changes on YouTube

### Debugging

- **Background Script**: Inspect the extension in `chrome://extensions/` > Details > Inspect views
- **Content Script**: Use Chrome DevTools on any YouTube page
- **Popup**: Right-click the extension icon > Inspect popup

## API Requirements

The extension connects to the Resonance AI API at https://resonanceaimusic.com with the following features:

1. **Authentication**: API key-based authentication
2. **CORS**: Configured to allow requests from Chrome extensions
3. **Endpoints**: All song-related endpoints available
4. **Rate Limiting**: Configured rate limits as documented

## Troubleshooting

### Common Issues

1. **"API key not configured"**: Enter your API key in the extension popup
2. **"Connection failed"**: Ensure the Resonance AI API is accessible at https://resonanceaimusic.com
3. **Songs not detected**: Try refreshing the page or clicking "Detect Song" manually
4. **Rate limit errors**: Wait a few minutes before trying again

### Debug Information

Access debug information via the browser console:
```javascript
// Check extension status
ResonanceAI.healthCheck()

// Get current song
ResonanceAI.getCurrentSong()

// Manually trigger detection
ResonanceAI.detectSong()

// Toggle UI
ResonanceAI.toggleUI()
```

## Privacy

- Only accesses YouTube pages as specified in permissions
- API key is stored locally in Chrome's secure storage
- No data is shared with third parties
- Song analysis is cached locally to minimize API calls

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly on various YouTube videos
4. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support, please:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure the Resonance AI API is running and accessible
4. Report issues with detailed reproduction steps