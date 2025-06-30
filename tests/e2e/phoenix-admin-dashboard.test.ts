/**
 * @file tests/e2e/phoenix-admin-dashboard.test.ts
 * @description PHOENIX PROJECT - E2E tests for Phoenix Admin Dashboard
 * @version 2.3.0
 * @date 2025-06-30
 * @updated BUG-049 Complete Resolution - Fixed all strict mode violations with specific selectors for Environment and World Management tests
 */

/** HISTORY:
 * v2.3.0 (2025-06-30): BUG-049 Complete Resolution - Fixed remaining strict mode violations: Environment test uses h4.filter() and World Management uses label[for=] selectors
 * v2.2.0 (2025-06-30): BUG-049 Final Fix - Fixed strict mode violations in Environment test, updated World Management test with actual component content
 * v2.1.0 (2025-06-30): BUG-049 Complete Fix - Updated all test expectations to match actual Phoenix component content (Environment, Metrics, World Management, Navigation)
 * v2.0.0 (2025-06-30): BUG-049 Fix - Updated text expectations to match actual UI content in Phoenix page
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 6 - E2E tests for Phoenix Admin Dashboard
 */

import { test, expect } from '@playwright/test'
import { universalAuthentication } from '../helpers/auth.helper'

// Test suite focused on Phoenix Admin Dashboard functionality
test.describe('Phoenix Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user before each test and navigate to Phoenix page
    await universalAuthentication(page, {
      email: `phoenix-admin-${Date.now()}@test.com`,
      id: crypto.randomUUID()
    }, {
      targetPath: '/phoenix'
    })
  })

  test('Phoenix page should load and display admin tools', async ({ page }) => {
    // Page should already be on Phoenix from authentication
    // Wait for page to load
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
    
    // Check for Phoenix-specific elements (updated to match actual UI text)
    await expect(page.locator('text=PHOENIX Admin Dashboard')).toBeVisible({ timeout: 5000 })
    
    // Check for tab buttons specifically
    await expect(page.getByRole('tab', { name: 'Worlds' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('tab', { name: 'Environments' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('tab', { name: 'Metrics' })).toBeVisible({ timeout: 5000 })
  })

  test('Environment Status Panel should display environment info', async ({ page }) => {
    // Navigate to Environments tab
    await page.getByRole('tab', { name: 'Environments' }).click()
    
    // Wait for Environment Status Panel to load
    await expect(page.locator('text=Environment Status')).toBeVisible({ timeout: 10000 })
    
    // Wait for environment cards grid to load (more specific selector)
    await expect(page.locator('div.grid.grid-cols-1.md\\:grid-cols-3')).toBeVisible({ timeout: 10000 })
    
    // Check for environment status elements using unique text to avoid strict mode violations
    await expect(page.locator('text=Real-time monitoring of LOCAL, BETA, and PROD environments')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Auto-refresh')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=System Overview')).toBeVisible({ timeout: 5000 })
    
    // Check for specific environment features without ambiguous text - use more specific selectors
    await expect(page.locator('h4').filter({ hasText: 'Services' }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=CPU').first()).toBeVisible({ timeout: 5000 })
  })

  test('System Metrics Panel should show performance data', async ({ page }) => {
    // Navigate to Metrics tab
    await page.getByRole('tab', { name: 'Metrics' }).click()
    
    // Wait for System Metrics Panel to load
    await expect(page.locator('text=System Metrics')).toBeVisible({ timeout: 10000 })
    
    // Check for metrics panel content (based on actual SystemMetricsPanel component)
    await expect(page.locator('text=Performance Metrics')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Total Users')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Avg Response Time')).toBeVisible({ timeout: 5000 })
  })

  test('World Management Panel should display world controls', async ({ page }) => {
    // World Management is the default tab, should already be visible
    // Wait for World Management Panel to load
    await expect(page.locator('text=World Management')).toBeVisible({ timeout: 10000 })
    
    // Check for world management description
    await expect(page.locator('text=Create, manage and monitor dynamic test worlds across environments')).toBeVisible({ timeout: 5000 })
    
    // Check for search and filter controls using more specific selectors within the WorldManagementPanel
    await expect(page.locator('label[for="search"]').filter({ hasText: 'Search Worlds' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('label[for="environment"]').filter({ hasText: 'Environment' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('label[for="category"]').filter({ hasText: 'Category' })).toBeVisible({ timeout: 5000 })
    
    // Check for Create World button in the panel (not just header) - use first() to avoid strict mode
    await expect(page.locator('button', { hasText: 'Create World' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('Phoenix dashboard should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('text=PHOENIX Admin Dashboard')).toBeVisible({ timeout: 5000 })
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('text=PHOENIX Admin Dashboard')).toBeVisible({ timeout: 5000 })
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('text=PHOENIX Admin Dashboard')).toBeVisible({ timeout: 5000 })
    
    // Should still show main tabs in mobile (check for tab list instead of individual tabs)
    await expect(page.locator('[role="tablist"]')).toBeVisible({ timeout: 5000 })
    
    // Reset to desktop view for subsequent tests
    await page.setViewportSize({ width: 1200, height: 800 })
  })

  test('Phoenix navigation should work correctly', async ({ page }) => {
    // We're already on Phoenix page from beforeEach authentication
    // Verify we're on the correct page and URL
    expect(page.url()).toContain('/phoenix')
    await expect(page.locator('text=PHOENIX Admin Dashboard')).toBeVisible({ timeout: 10000 })
    
    // Test tab navigation within Phoenix dashboard
    await page.getByRole('tab', { name: 'Environments' }).click()
    await expect(page.locator('text=Environment Status')).toBeVisible({ timeout: 5000 })
    
    await page.getByRole('tab', { name: 'Metrics' }).click()
    await expect(page.locator('text=System Metrics')).toBeVisible({ timeout: 5000 })
    
    await page.getByRole('tab', { name: 'Worlds' }).click()
    await expect(page.locator('text=World Management')).toBeVisible({ timeout: 5000 })
    
    // Test that we can still see the header elements
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 5000 })
  })
})

// END OF: tests/e2e/phoenix-admin-dashboard.test.ts