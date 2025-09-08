# Add this section after creating the app bundle but before creating the DMG

# Find the Developer ID certificate
DEVELOPER_ID=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | grep -o '"[^"]*"' | sed 's/"//g')
if [ -z "$DEVELOPER_ID" ]; then
    echo "❌ Error: No Developer ID Application certificate found!"
    echo "Available certificates:"
    security find-identity -v -p codesigning
    exit 1
fi

echo "🔐 Code signing with: $DEVELOPER_ID"

# Code sign the app bundle with hardened runtime and timestamp
codesign --force --verbose --options runtime --timestamp \
    --entitlements "MacOS/Sources/Mattato/Resources/Mattato.entitlements" \
    --sign "$DEVELOPER_ID" \
    "${APP_BUNDLE}"

# Verify code signing
echo "✅ Verifying code signature..."
codesign --verify --verbose=2 "${APP_BUNDLE}"
spctl --assess --verbose --type execute "${APP_BUNDLE}"

# ... (keep your existing DMG creation code) ...

# After creating the DMG, add this:

# Code sign the DMG
echo "🔐 Code signing DMG..."
codesign --force --sign "$DEVELOPER_ID" --timestamp "${DMG_NAME}.dmg"

# Submit for notarization if credentials are available
if [ -n "$APPLE_ID_EMAIL" ] && [ -n "$APPLE_ID_PASSWORD" ] && [ -n "$APPLE_TEAM_ID" ]; then
    echo "📤 Submitting for notarization..."
    
    # Create a temporary keychain for the app-specific password
    echo "$APPLE_ID_PASSWORD" | xcrun notarytool store-credentials \
        --apple-id "$APPLE_ID_EMAIL" \
        --team-id "$APPLE_TEAM_ID" \
        --password "@env:APPLE_ID_PASSWORD" \
        "AC_PASSWORD"
    
    # Submit for notarization
    echo "⏳ Uploading to Apple for notarization..."
    xcrun notarytool submit "${DMG_NAME}.dmg" \
        --keychain-profile "AC_PASSWORD" \
        --wait \
        --timeout 300
    
    # Check if notarization was successful
    if [ $? -eq 0 ]; then
        echo "✅ Notarization successful! Stapling ticket..."
        xcrun stapler staple "${DMG_NAME}.dmg"
        echo "🎉 DMG is now notarized and ready for distribution!"
    else
        echo "⚠️  Notarization failed, but DMG is still code-signed"
    fi
else
    echo "⚠️  Skipping notarization (missing credentials)"
fi