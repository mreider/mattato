#!/bin/bash

set -e

APP_NAME="Mattato"
VERSION="$(date +%Y.%m.%d.%H%M)"
DMG_NAME="${APP_NAME}-${VERSION}"
BUILD_DIR=".build/release"
TEMP_DIR="temp_dmg"
DMG_DIR="dmg_contents"
RELEASES_DIR="releases"
APPSTORE_DIR="appstore_build"

# Bundle ID must match your App Store configuration
BUNDLE_ID="com.mattreider.mattato"

echo "Building Mattato v$VERSION..."

# Parse build type from command line
BUILD_TYPE="${1:-dmg}"  # Default to DMG if not specified

mkdir -p "$RELEASES_DIR"
rm -rf "$TEMP_DIR" "$DMG_DIR" "$APPSTORE_DIR" 2>/dev/null || true

# Find appropriate certificate based on build type
if [ "$BUILD_TYPE" = "appstore" ]; then
    # For App Store, use Mac App Distribution certificate
    CERT_TYPE="3rd Party Mac Developer Application"
    INSTALLER_CERT_TYPE="3rd Party Mac Developer Installer"
    
    APP_CERT=$(security find-identity -v -p codesigning | grep "$CERT_TYPE" | head -1 | grep -o '"[^"]*"' | sed 's/"//g')
    INSTALLER_CERT=$(security find-identity -v -p codesigning | grep "$INSTALLER_CERT_TYPE" | head -1 | grep -o '"[^"]*"' | sed 's/"//g')
    
    if [ -z "$APP_CERT" ] || [ -z "$INSTALLER_CERT" ]; then
        echo "Error: App Store certificates not found"
        echo "Need: $CERT_TYPE and $INSTALLER_CERT_TYPE"
        security find-identity -v -p codesigning
        exit 1
    fi
    
    echo "Using App Store certificates:"
    echo "  App: $APP_CERT"
    echo "  Installer: $INSTALLER_CERT"
else
    # For direct distribution, use Developer ID certificate
    DEVELOPER_ID=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | grep -o '"[^"]*"' | sed 's/"//g')
    
    if [ -z "$DEVELOPER_ID" ]; then
        echo "Error: No Developer ID certificate found"
        security find-identity -v -p codesigning
        exit 1
    fi
    
    echo "Using Developer ID: $DEVELOPER_ID"
fi

# Build the app
swift build -c release

if [ ! -f "${BUILD_DIR}/${APP_NAME}" ]; then
    echo "Error: Build failed"
    exit 1
fi

# Create icons if script exists
if [ -f "Installer/create-icons.sh" ]; then
    chmod +x Installer/create-icons.sh
    ./Installer/create-icons.sh
fi

# Function to create app bundle
create_app_bundle() {
    local OUTPUT_DIR="$1"
    local IS_APPSTORE="$2"
    
    APP_BUNDLE="${OUTPUT_DIR}/${APP_NAME}.app"
    mkdir -p "${APP_BUNDLE}/Contents/MacOS"
    mkdir -p "${APP_BUNDLE}/Contents/Resources"
    
    cp "${BUILD_DIR}/${APP_NAME}" "${APP_BUNDLE}/Contents/MacOS/"
    chmod +x "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"
    
    # Copy resources
    if [ -f "Sources/Mattato/Resources/AppIcon.icns" ]; then
        cp "Sources/Mattato/Resources/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/"
    fi
    
    if [ -f "Sources/Mattato/Resources/tomato-512x512.png" ]; then
        cp "Sources/Mattato/Resources/tomato-512x512.png" "${APP_BUNDLE}/Contents/Resources/"
    fi
    
    # Copy provisioning profile for App Store builds
    if [ "$IS_APPSTORE" = "true" ]; then
        PROFILE_PATH="$HOME/Library/MobileDevice/Provisioning Profiles"
        # Find the most recent .provisionprofile file
        PROVISION_PROFILE=$(find "$PROFILE_PATH" -name "*.provisionprofile" -print0 | xargs -0 ls -t | head -1)
        
        if [ -n "$PROVISION_PROFILE" ]; then
            cp "$PROVISION_PROFILE" "${APP_BUNDLE}/Contents/embedded.provisionprofile"
        else
            echo "Warning: No provisioning profile found"
        fi
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
    <string>${BUNDLE_ID}</string>
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
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.productivity</string>
EOF
    
    # Add App Store specific keys
    if [ "$IS_APPSTORE" = "true" ]; then
        cat >> "${APP_BUNDLE}/Contents/Info.plist" << EOF
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
EOF
    fi
    
    cat >> "${APP_BUNDLE}/Contents/Info.plist" << EOF
</dict>
</plist>
EOF
    
    echo "$APP_BUNDLE"
}

# Build based on type
if [ "$BUILD_TYPE" = "appstore" ]; then
    echo "Building for App Store..."
    
    mkdir -p "$APPSTORE_DIR"
    APP_BUNDLE=$(create_app_bundle "$APPSTORE_DIR" "true")
    
    # Create App Store entitlements (more restrictive)
    cat > "${APPSTORE_DIR}/AppStore.entitlements" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
EOF
    
    # Sign the app with App Store certificate
    echo "Signing app for App Store..."
    codesign --force --options runtime --timestamp \
        --entitlements "${APPSTORE_DIR}/AppStore.entitlements" \
        --sign "$APP_CERT" \
        "${APP_BUNDLE}"
    
    # Verify signing
    codesign --verify --deep --strict "${APP_BUNDLE}"
    
    # Create PKG for App Store
    PKG_NAME="${APP_NAME}-AppStore-${VERSION}.pkg"
    echo "Creating App Store PKG..."
    
    productbuild --component "${APP_BUNDLE}" /Applications \
        --sign "$INSTALLER_CERT" \
        --product "${APP_BUNDLE}/Contents/Info.plist" \
        "${RELEASES_DIR}/${PKG_NAME}"
    
    echo "App Store package created: ${RELEASES_DIR}/${PKG_NAME}"
    echo ""
    echo "Next steps:"
    echo "1. Open Transporter app (download from Mac App Store)"
    echo "2. Sign in with your Apple ID"
    echo "3. Drag ${PKG_NAME} to Transporter"
    echo "4. Click 'Deliver'"
    echo "5. Go to App Store Connect to submit for review"
    
else
    echo "Building for direct distribution..."
    
    mkdir -p "$DMG_DIR"
    APP_BUNDLE=$(create_app_bundle "$DMG_DIR" "false")
    
    # Sign with Developer ID
    echo "Code signing..."
    codesign --force --options runtime --timestamp \
        --entitlements "Sources/Mattato/Resources/Mattato.entitlements" \
        --sign "$DEVELOPER_ID" \
        "${APP_BUNDLE}"
    
    codesign --verify "${APP_BUNDLE}"
    spctl --assess --type execute "${APP_BUNDLE}" 2>/dev/null || true
    
    # Create DMG
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
    
    codesign --force --sign "$DEVELOPER_ID" --timestamp "${DMG_NAME}.dmg"
    codesign --verify "${DMG_NAME}.dmg"
    
    # Optional notarization
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
        fi
    fi
    
    mv "${DMG_NAME}.dmg" "$RELEASES_DIR/"
    echo "Build complete: ${RELEASES_DIR}/${DMG_NAME}.dmg"
fi

# Cleanup
rm -rf "$TEMP_DIR" "$DMG_DIR" "$APPSTORE_DIR"