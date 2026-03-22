# Chrome Extension Setup Guide

## Prerequisites

1. **Internet Connection**
   - Ensure you have a stable internet connection
   - The extension connects to `https://resonanceaimusic.com`

2. **API Key**
   - Obtain an API key from the Resonance AI dashboard at `https://resonanceaimusic.com`
   - You'll need this to configure the extension

## Installation Steps

### 1. Load the Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. The Resonance AI extension should appear in your extensions list

### 2. Configure the Extension

1. Click the Resonance AI icon in your browser toolbar
2. Enter your API key in the "API Key" field
3. Click "Save"
4. Click "Test Connection" to verify the setup
5. You should see "Connection successful! API is working."

### 3. Customize Settings (Optional)

- **Auto-show analysis panel**: Automatically display analysis when music is detected
- **Panel position**: Choose where the analysis panel appears
- **Detection sensitivity**: Adjust how strictly the extension detects music videos

## Testing the Extension

### Test on YouTube

1. Navigate to YouTube: `https://www.youtube.com`
2. Search for a music video (e.g., "Bohemian Rhapsody official video")
3. Click on a music video
4. Wait 2-3 seconds for the extension to analyze the video
5. The analysis panel should appear automatically (if auto-show is enabled)

### Manual Testing

If automatic detection doesn't work:

1. Click the Resonance AI icon in the toolbar
2. Click "Detect Song" in the popup
3. Or use keyboard shortcut: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### Expected Behavior

✅ **Working correctly:**
- Extension icon appears in toolbar
- Analysis panel appears on music videos
- Panel shows song title, artist, and AI analysis
- Tabs work (Meaning, Themes, Trivia, Process)
- Panel can be dragged around the screen

❌ **Common issues:**
- "API key not configured" → Configure API key in popup
- "Connection failed" → Check if Resonance AI server is running
- "Song not detected" → Try clicking "Detect Song" manually
- No panel appears → Check auto-show setting or use `Ctrl+Shift+R`

## Debugging

### Console Debugging

Open Chrome DevTools (F12) on a YouTube page and use these commands:

```javascript
// Check extension status
ResonanceAI.healthCheck()

// Get current song info
ResonanceAI.getCurrentSong()

// Manually trigger song detection
ResonanceAI.detectSong()

// Toggle the analysis panel
ResonanceAI.toggleUI()
```

### Extension Debugging

1. Go to `chrome://extensions/`
2. Find "Resonance AI" extension
3. Click "Details"
4. Click "Inspect views: background page" to debug the service worker
5. Check console for any errors

### Common Debug Information

- **Background script errors**: Check the service worker console
- **Content script errors**: Check the YouTube page console
- **API errors**: Look for HTTP error codes in network tab
- **Permission errors**: Ensure extension has required permissions

## Troubleshooting

### API Connection Issues

1. **"Connection failed"**
   - Verify internet connection and try visiting: `https://resonanceaimusic.com/health`
   - Check if API key is valid
   - Look for CORS issues in browser console

2. **"API key not configured"**
   - Open extension popup and enter your API key
   - Save and test the connection

3. **"Rate limit exceeded"**
   - Wait a few minutes before trying again
   - The extension respects API rate limits

### Detection Issues

1. **Songs not detected automatically**
   - Try refreshing the YouTube page
   - Use manual detection: click "Detect Song"
   - Check if the video is actually a music video
   - Adjust detection sensitivity in settings

2. **Wrong song detected**
   - YouTube video titles can be ambiguous
   - Try manual search in the popup
   - Report the issue for improvement

### UI Issues

1. **Panel not appearing**
   - Check auto-show setting
   - Use keyboard shortcut: `Ctrl+Shift+R`
   - Try clicking extension icon → "Toggle Panel"

2. **Panel appears in wrong position**
   - Drag the panel to desired location
   - Change panel position in settings

## Performance Tips

1. **Cache Management**
   - Clear cache regularly via extension popup
   - Cache helps reduce API calls

2. **Battery Optimization**
   - Disable auto-show if you don't need it
   - Extension uses minimal resources when idle

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Look at browser console for error messages
3. Verify Resonance AI server is running and accessible
4. Try reloading the extension at `chrome://extensions/`
5. Report specific issues with reproduction steps

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Resonance AI" extension
3. Click "Remove"
4. Confirm removal

This will also clear all stored settings and cache data.