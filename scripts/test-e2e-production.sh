#!/bin/bash

# Production E2E Testing Script
# This script runs E2E tests against a production build instead of dev server

echo "🚀 Starting Production E2E Tests for Artifact Editor"
echo "=================================="

# Set environment variable to use production server
export PLAYWRIGHT_USE_PRODUCTION=true
export NODE_ENV=production

echo "📍 Environment:"
echo "  - PLAYWRIGHT_USE_PRODUCTION: $PLAYWRIGHT_USE_PRODUCTION"
echo "  - NODE_ENV: $NODE_ENV"
echo ""

# Run artifact editor test with production server
echo "🧪 Running Artifact Editor test with production server..."
npx playwright test tests/e2e/components/artifact-editor-behavior.test.ts --project=e2e --reporter=list --grep="Scenario 1"

echo ""
echo "✅ Production E2E Tests completed"