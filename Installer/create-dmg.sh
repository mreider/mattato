#!/bin/bash

# Mattato DMG Creation Script
# This script creates a DMG installer for the Mattato Pomodoro app

set -e

APP_NAME="Mattato"
VERSION="1.0.0"
DMG_NAME="${APP_NAME}-${VERSION}"
BUILD_DIR=".build/release"
TEMP_DIR="temp_dmg"
DMG_DIR="dmg_contents"

echo "🍅 Creating Mattato DMG Installer..."

# Clean up any previous builds
rm -rf "$TEMP_DIR" "$DMG_DIR" "${DMG_NAME}.dmg" 2>/dev/null || true

# Build the release version
echo "📦 Building release version..."
swift build -c release

# Check if the executable was built
if [ ! -f "${BUILD_DIR}/${APP_NAME}" ]; then
    echo "❌ Error: Release build not found at ${BUILD_DIR}/${APP_NAME}"
    exit 1
fi

# Create temporary directories
mkdir -p "$DMG_DIR"
mkdir -p "$TEMP_DIR"

# Create app bundle structure
APP_BUNDLE="${DMG_DIR}/${APP_NAME}.app"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# Copy the executable
cp "${BUILD_DIR}/${APP_NAME}" "${APP_BUNDLE}/Contents/MacOS/"

# Copy the app icon if it exists
if [ -f "Sources/Mattato/Resources/AppIcon.icns" ]; then
    echo "🎨 Adding app icon..."
    cp "Sources/Mattato/Resources/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/"
else
    echo "⚠️  Warning: App icon not found, run ./Installer/create-icons.sh first"
fi

# Create Info.plist
cat > "${APP_BUNDLE}/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.mattreider.mattato</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleDeveloperName</key>
    <string>Matthew Reider</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2025 Matthew Reider</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSUserNotificationAlertStyle</key>
    <string>alert</string>
</dict>
</plist>
EOF

# Create a simple app icon (text-based for now)
# In a real app, you'd want to create proper .icns files
echo "🎨 Creating app icon placeholder..."

# Make the executable... executable
chmod +x "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

# Create Applications symlink for easy installation
ln -s /Applications "${DMG_DIR}/Applications"

# Create a README for the DMG
cat > "${DMG_DIR}/README.txt" << EOF
Mattato 🍅 - Pomodoro Timer with Time Tracking

Installation:
1. Drag Mattato.app to the Applications folder
2. Launch Mattato from Applications or Spotlight
3. The timer will appear in your menu bar

Features:
• Menu bar Pomodoro timer
• Session tracking with descriptions
• Markdown export for time tracking
• Persistent history
• Native macOS notifications

Developer: Matthew Reider
Copyright © 2025 Matthew Reider
Version: ${VERSION}

For more information, visit:
https://github.com/mreider/mattato

System Requirements:
• macOS 13.0 or later
• Apple Silicon or Intel Mac
EOF

# Create the DMG
echo "💿 Creating DMG..."
hdiutil create -volname "${APP_NAME}" \
    -srcfolder "${DMG_DIR}" \
    -ov \
    -format UDZO \
    "${DMG_NAME}.dmg"

# Clean up
rm -rf "$TEMP_DIR" "$DMG_DIR"

echo "✅ DMG created successfully: ${DMG_NAME}.dmg"
echo ""
echo "To install:"
echo "1. Double-click ${DMG_NAME}.dmg"
echo "2. Drag Mattato.app to Applications"
echo "3. Launch from Applications or Spotlight"
echo ""
echo "The app will appear in your menu bar as a timer (25:00)"
