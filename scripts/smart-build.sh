#!/bin/bash

# Smart build script for E2E tests
# Only rebuilds if .next directory is missing or package.json changed

BUILD_DIR=".next"
PACKAGE_JSON="package.json"
LOCK_FILE="pnpm-lock.yaml"

echo "🔍 Smart Build: Checking if rebuild is needed..."

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "📦 No build found - running full build..."
    pnpm build
    exit $?
fi

# Check if package.json or lock file changed
if [ "$PACKAGE_JSON" -nt "$BUILD_DIR" ] || [ "$LOCK_FILE" -nt "$BUILD_DIR" ]; then
    echo "📦 Dependencies changed - running full build..."
    pnpm build
    exit $?
fi

echo "✅ Using existing build (no changes detected)"
exit 0