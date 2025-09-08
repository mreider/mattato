#!/bin/bash

set -e

APP_NAME="Mattato"
VERSION="$(date +%Y.%m.%d.%H%M)"
DMG_NAME="${APP_NAME}-${VERSION}"
BUILD_DIR=".build/release"
TEMP_DIR="temp_dmg"
DMG_DIR="dmg_contents"
RELEASES_DIR="releases"

echo "Building Mattato v$VERSION..."

mkdir -p "$RELEASES_DIR"

# Clean up old DMG files first (even if build fails later)
echo "🧹 Cleaning up old DMG files..."
rm -f "$RELEASES_DIR"/*.dmg 2>/dev/null || true

rm -rf "$TEMP_DIR" "$DMG_DIR" 2>/dev/null || true

DEVELOPER_ID=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | grep -o '"[^"]*"' | sed 's/"//g')

if [ -z "$DEVELOPER_ID" ]; then
    echo "Error: No Developer ID certificate found"
    security find-identity -v -p codesigning
    exit 1
fi

echo "Using certificate: $DEVELOPER_ID"

swift build -c release

if [ ! -f "${BUILD_DIR}/${APP_NAME}" ]; then
    echo "Error: Build failed"
    exit 1
fi

if [ -f "Installer/create-icons.sh" ]; then
    chmod +x Installer/create-icons.sh
    ./Installer/create-icons.sh
fi

mkdir -p "$DMG_DIR"
mkdir -p "$TEMP_DIR"

APP_BUNDLE="${DMG_DIR}/${APP_NAME}.app"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

cp "${BUILD_DIR}/${APP_NAME}" "${APP_BUNDLE}/Contents/MacOS/"
chmod +x "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

if [ -f "MacOS/Sources/Mattato/Resources/AppIcon.icns" ]; then
    cp "MacOS/Sources/Mattato/Resources/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/"
fi

if [ -f "MacOS/Sources/Mattato/Resources/tomato-512x512.png" ]; then
    cp "MacOS/Sources/Mattato/Resources/tomato-512x512.png" "${APP_BUNDLE}/Contents/Resources/"
fi

if [ -d "MacOS/Sources/Mattato/Resources" ]; then
    find "MacOS/Sources/Mattato/Resources" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read file; do
        if [ "$file" != "MacOS/Sources/Mattato/Resources/tomato-512x512.png" ] && [ "$file" != "MacOS/Sources/Mattato/Resources/AppIcon.icns" ]; then
            cp "$file" "${APP_BUNDLE}/Contents/Resources/"
        fi
    done
fi

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

echo "Code signing..."
codesign --force --options runtime --timestamp \
    --entitlements "MacOS/Sources/Mattato/Resources/Mattato.entitlements" \
    --sign "$DEVELOPER_ID" \
    "${APP_BUNDLE}"

codesign --verify "${APP_BUNDLE}"
spctl --assess --type execute "${APP_BUNDLE}" 2>/dev/null || true

ln -sf /Applications "${DMG_DIR}/Applications"

cat > "${DMG_DIR}/README.txt" << EOF
Mattato - Pomodoro Timer

Installation:
1. Drag Mattato.app to Applications
2. Launch from Applications or Spotlight

Version: ${VERSION}
Developer: Matthew Reider
https://github.com/mreider/mattato
EOF

echo "Creating DMG..."
hdiutil create -volname "${APP_NAME}" -srcfolder "${DMG_DIR}" -ov -format UDZO "${DMG_NAME}.dmg"

if [ ! -f "${DMG_NAME}.dmg" ]; then
    echo "Error: DMG creation failed"
    exit 1
fi

codesign --force --sign "$DEVELOPER_ID" --timestamp "${DMG_NAME}.dmg"
codesign --verify "${DMG_NAME}.dmg"

read -p "Notarize DMG? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Apple ID [mreider@gmail.com]: " APPLE_ID_EMAIL
    APPLE_ID_EMAIL=${APPLE_ID_EMAIL:-mreider@gmail.com}
    
    read -s -p "App password: " APPLE_ID_PASSWORD
    echo
    
    read -p "Team ID [CZQ6J5YDFK]: " APPLE_TEAM_ID
    APPLE_TEAM_ID=${APPLE_TEAM_ID:-CZQ6J5YDFK}
    
    echo "Notarizing..."
    xcrun notarytool submit "${DMG_NAME}.dmg" \
        --apple-id "$APPLE_ID_EMAIL" \
        --team-id "$APPLE_TEAM_ID" \
        --password "$APPLE_ID_PASSWORD" \
        --wait
    
    if [ $? -eq 0 ]; then
        xcrun stapler staple "${DMG_NAME}.dmg"
        echo "Notarization complete"
    else
        echo "Notarization failed"
    fi
fi

mv "${DMG_NAME}.dmg" "$RELEASES_DIR/"
rm -rf "$TEMP_DIR" "$DMG_DIR"

echo "Build complete: ${RELEASES_DIR}/${DMG_NAME}.dmg"
