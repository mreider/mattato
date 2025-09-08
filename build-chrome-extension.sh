#!/bin/bash

# Build Chrome Extension for Mattato
set -e

EXTENSION_DIR="chrome-extension"
BUILD_DIR="releases"
VERSION="$(date +%Y.%m.%d.%H%M)"
EXTENSION_NAME="mattato-timecockpit-bridge"

echo "📦 Building Chrome extension v$VERSION..."

# Create releases directory if it doesn't exist
mkdir -p "$BUILD_DIR"

# Clean up old extension files first (even if build fails later)
echo "🧹 Cleaning up old extension files..."
rm -f "$BUILD_DIR"/${EXTENSION_NAME}-*.zip 2>/dev/null || true

# Create temporary directory for packaging
TEMP_DIR="temp_extension"
rm -rf "$TEMP_DIR" 2>/dev/null || true
mkdir -p "$TEMP_DIR"

# Copy extension files
echo "📋 Copying extension files..."
cp -r "$EXTENSION_DIR"/* "$TEMP_DIR/"

# Update version in manifest.json
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$TEMP_DIR/manifest.json"
else
    # Linux
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$TEMP_DIR/manifest.json"
fi

echo "📝 Updated manifest.json version to $VERSION"

# Create ZIP file for Chrome Web Store
EXTENSION_ZIP="$BUILD_DIR/${EXTENSION_NAME}-${VERSION}.zip"
echo "🗜️ Creating extension package..."

cd "$TEMP_DIR"
zip -r "../$EXTENSION_ZIP" . -x "README.md" "*.DS_Store"
cd ..

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Chrome extension built successfully!"
echo "📄 Package: $EXTENSION_ZIP"
echo ""
echo "To install for testing:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Extract the ZIP file and click 'Load unpacked'"
echo "4. Or drag the ZIP file to install as unpacked"
echo ""

# List the package contents for verification
echo "📋 Package contents:"
unzip -l "$EXTENSION_ZIP"