#!/bin/bash

set -e

echo "Building Mattato..."

rm -rf .build/app Mattato.app

swift build -c release

mkdir -p Mattato.app/Contents/MacOS
mkdir -p Mattato.app/Contents/Resources

cp .build/release/Mattato Mattato.app/Contents/MacOS/
cp MacOS/Sources/Mattato/Resources/Info.plist Mattato.app/Contents/

cp MacOS/Sources/Mattato/Resources/AppIcon.icns Mattato.app/Contents/Resources/ 2>/dev/null || true
cp MacOS/Sources/Mattato/Resources/tomato-512x512.png Mattato.app/Contents/Resources/ 2>/dev/null || true
cp MacOS/Sources/Mattato/Resources/bear-icon.png Mattato.app/Contents/Resources/ 2>/dev/null || true

codesign --force --options runtime --entitlements MacOS/Sources/Mattato/Resources/Mattato.entitlements --sign - Mattato.app

echo "Build complete: Mattato.app"
