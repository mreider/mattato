# Mattato Electron - Cross-Platform Pomodoro Timer

A cross-platform version of the Mattato Pomodoro timer built with Electron.

## Features

- **System Tray Integration** - Timer lives in your system tray
- **Floating Timer Widget** - Draggable tomato-themed timer window
- **Session Management** - Full history with search, filter, and export
- **Cross-Platform** - Runs on Windows, macOS, and Linux
- **Data Persistence** - Sessions saved automatically
- **Export Options** - JSON and CSV formats (PDF and ICS coming soon)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   # Build for current platform
   npm run build
   
   # Build for specific platforms
   npm run build-win    # Windows
   npm run build-mac    # macOS
   npm run build-linux  # Linux
   ```

## Usage

### Timer Controls
- **Start Timer**: Click play button after setting duration and description
- **Pause/Resume**: Click pause button during active session
- **Stop Timer**: Click X button to cancel current session
- **Edit Session**: Click gear button to modify duration and details

### Session Management
- **View Sessions**: Access from system tray menu or main window
- **Search & Filter**: Find sessions by description, customer, or project
- **Export Data**: Choose from JSON, CSV formats
- **Import Data**: Restore session data from exported files

### System Tray
- **Right-click**: Access full application menu
- **Double-click**: Show/hide floating timer

## Development

The application structure:
- `src/main.js` - Main Electron process (system tray, windows, IPC)
- `src/timer.html/js` - Floating timer widget UI and logic
- `src/index.html` - Session management interface
- `src/sessions.js` - Session data handling and export logic
- `assets/` - Icons and resources

## Data Storage

Sessions are stored using `electron-store` in:
- **Windows**: `%APPDATA%/mattato-electron/config.json`
- **macOS**: `~/Library/Preferences/mattato-electron/config.json`
- **Linux**: `~/.config/mattato-electron/config.json`

## Coming Soon

- PDF export with customer invoicing
- ICS calendar export
- Project and customer management
- Settings configuration
- Sound notifications
- Bulk session editing tools
- Bear notes integration (macOS)

## Migration from Swift Version

The Electron version replicates all core functionality from the Swift macOS app:
- System tray integration matches menu bar behavior
- Floating timer widget replaces the "Robot" timer
- Session management UI mirrors the Swift interface
- Data export maintains compatibility with existing workflows