# Mattato TimeCockpit Bridge - Chrome Extension

**Internal use only** - This Chrome extension provides integration between Mattato and TimeCockpit for automated timesheet entry.

## Installation

### Development/Testing
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `chrome-extension` directory
4. The Mattato robot head icon should appear in your extensions toolbar

### Testing the Extension
1. Navigate to any TimeCockpit page (https://dynatrace.timecockpit.com)
2. You should see a green "🤖 Mattato Bridge Active" indicator for 3 seconds
3. Click the Mattato extension icon in the toolbar
4. The popup should show "Connected to TimeCockpit - Ready for integration"
5. Click "Test Integration" to verify the extension can read page data
6. Click "Page Info" to see current page details

## Files Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── content.js             # Page interaction script
├── background.js          # Background service worker
├── icons/                 # Extension icons (robot head)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Features

- **Page Detection**: Automatically detects TimeCockpit pages
- **Date Extraction**: Can read current week date from TimeCockpit calendar
- **Visual Feedback**: Shows active status on TimeCockpit pages
- **Test Interface**: Simple popup for testing functionality

## Build Integration

This extension is automatically packaged as part of the main Mattato build process and GitHub Actions for releases.

## Next Steps

This is a foundation for TimeCockpit integration. Additional functionality will be added as needed for automated timesheet entry from Mattato session data.