#!/bin/bash

# Mattato Icon Generation Script
# Converts the tomato PNG to all required sizes and creates .icns file

set -e

SOURCE_PNG="docs/tomato-512x512.png"
ICONSET_DIR="MacOS/Sources/Mattato/Resources/AppIcon.iconset"
ICNS_FILE="MacOS/Sources/Mattato/Resources/AppIcon.icns"

echo "🍅 Creating Mattato app icons..."

# Check if source PNG exists
if [ ! -f "$SOURCE_PNG" ]; then
    echo "❌ Error: Source PNG not found at $SOURCE_PNG"
    exit 1
fi

# Clean up any existing iconset
rm -rf "$ICONSET_DIR" "$ICNS_FILE" 2>/dev/null || true

# Create iconset directory
mkdir -p "$ICONSET_DIR"

echo "📐 Generating icon sizes..."

# Generate all required icon sizes
sips -z 16 16     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_16x16.png"
sips -z 32 32     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_16x16@2x.png"
sips -z 32 32     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_32x32.png"
sips -z 64 64     "$SOURCE_PNG" --out "$ICONSET_DIR/icon_32x32@2x.png"
sips -z 128 128   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_128x128.png"
sips -z 256 256   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_128x128@2x.png"
sips -z 256 256   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_256x256.png"
sips -z 512 512   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_256x256@2x.png"
sips -z 512 512   "$SOURCE_PNG" --out "$ICONSET_DIR/icon_512x512.png"
cp "$SOURCE_PNG" "$ICONSET_DIR/icon_512x512@2x.png"

echo "🔧 Converting to .icns format..."

# Convert iconset to .icns file
iconutil -c icns "$ICONSET_DIR" -o "$ICNS_FILE"

# Clean up iconset directory
rm -rf "$ICONSET_DIR"

echo "✅ App icon created: $ICNS_FILE"

# Verify the .icns file was created
if [ -f "$ICNS_FILE" ]; then
    echo "📊 Icon file size: $(ls -lh "$ICNS_FILE" | awk '{print $5}')"
else
    echo "❌ Error: Failed to create .icns file"
    exit 1
fi
