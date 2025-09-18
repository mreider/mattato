# Mattato 🍅

A macOS menu bar Pomodoro timer with session tracking

## Installation

### Download DMG

Download the latest release from the [mattato.com](https://mreider.github.io/mattato/):

## Data Storage

- All data is stored locally on your Mac
- Session history: `~/Documents/Mattato/sessions.json`
- User preferences: `~/Documents/Mattato/preferences.json`
- No cloud sync or external data transmission

## Build from Source

1. **Prerequisites**: Ensure you have Xcode or Xcode Command Line Tools installed
   ```bash
   xcode-select --install
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/mreider/mattato.git
   cd mattato
   ```

3. **Build the application**:
   ```bash
   swift build -c release
   ```

4. **Run the application**:
   ```bash
   swift run
   ```

## Project Structure
```
mattato/
├── Sources/Mattato/
│   ├── App.swift                 # Main application entry point
│   ├── MenuBarController.swift   # Menu bar integration
│   ├── TimerManager.swift        # Timer logic and state
│   ├── HistoryManager.swift      # Data persistence
│   ├── Models/
│   │   └── Session.swift         # Data models
│   └── Views/
│       ├── MenuPopupView.swift   # Main control panel
│       └── HistoryWindowView.swift # History browser
└── Package.swift                 # Swift Package Manager config
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
