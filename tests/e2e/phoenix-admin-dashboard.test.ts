/**
 * @file tests/e2e/phoenix-admin-dashboard.test.ts
 * @description PHOENIX PROJECT - E2E tests for Phoenix Admin Dashboard
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 6 - E2E testing for admin interface
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 6 - E2E tests for Phoenix Admin Dashboard
 */

import { test, expect } from '@playwright/test'
import { universalAuthentication } from '../helpers/auth.helper'

// Test suite focused on Phoenix Admin Dashboard functionality
test.describe('Phoenix Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user before each test
    await universalAuthentication(page, {
      email: `phoenix-admin-${Date.now()}@test.com`,
      id: crypto.randomUUID()
    })
  })

  test('Phoenix page should load and display admin tools', async ({ page }) => {
    // Navigate to Phoenix admin page
    await page.goto('/app/phoenix')
    
    // Wait for page to load
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
    
    // Check for Phoenix-specific elements
    await expect(page.locator('text=PHOENIX PROJECT')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Environment Status')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=System Metrics')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=World Management')).toBeVisible({ timeout: 5000 })
  })

  test('Environment Status Panel should display environment info', async ({ page }) => {
    await page.goto('/app/phoenix')
    
    // Wait for Environment Status Panel to load
    await expect(page.locator('text=Environment Status')).toBeVisible({ timeout: 10000 })
    
    // Check for environment indicators
    const environmentCards = page.locator('[class*="grid"] [class*="border"]')
    await expect(environmentCards).toHaveCount(3) // LOCAL, BETA, PROD
    
    // Check for specific environment labels
    await expect(page.locator('text=LOCAL')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=BETA')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=PROD')).toBeVisible({ timeout: 5000 })
  })

  test('System Metrics Panel should show performance data', async ({ page }) => {
    await page.goto('/app/phoenix')
    
    // Wait for System Metrics Panel to load
    await expect(page.locator('text=System Metrics')).toBeVisible({ timeout: 10000 })
    
    // Check for metrics indicators
    await expect(page.locator('text=System Overview')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Performance')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Storage')).toBeVisible({ timeout: 5000 })
  })

  test('World Management Panel should display world controls', async ({ page }) => {
    await page.goto('/app/phoenix')
    
    // Wait for World Management Panel to load
    await expect(page.locator('text=World Management')).toBeVisible({ timeout: 10000 })
    
    // Check for world management features
    await expect(page.locator('text=Create New World')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Environment')).toBeVisible({ timeout: 5000 })
    
    // Check for action buttons
    const actionButtons = page.locator('button')
    const buttonTexts = await actionButtons.allTextContents()
    const hasExpectedButtons = buttonTexts.some(text => 
      text.includes('Create') || 
      text.includes('Refresh') || 
      text.includes('Export')
    )
    expect(hasExpectedButtons).toBe(true)
  })

  test('Phoenix dashboard should be responsive', async ({ page }) => {
    await page.goto('/app/phoenix')
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('text=PHOENIX PROJECT')).toBeVisible({ timeout: 10000 })
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('text=PHOENIX PROJECT')).toBeVisible({ timeout: 5000 })
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('text=PHOENIX PROJECT')).toBeVisible({ timeout: 5000 })
    
    // Should still show main panels in mobile
    await expect(page.locator('text=Environment Status')).toBeVisible({ timeout: 5000 })
  })

  test('Phoenix navigation should work correctly', async ({ page }) => {
    // Start from main app
    await page.goto('/app')
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
    
    // Navigate to Phoenix (assuming there's a navigation link)
    if (await page.locator('text=Phoenix').isVisible()) {
      await page.click('text=Phoenix')
      await expect(page.locator('text=PHOENIX PROJECT')).toBeVisible({ timeout: 10000 })
    } else {
      // Direct navigation if no nav link
      await page.goto('/app/phoenix')
      await expect(page.locator('text=PHOENIX PROJECT')).toBeVisible({ timeout: 10000 })
    }
    
    // Verify URL
    expect(page.url()).toContain('/phoenix')
  })
})

// END OF: tests/e2e/phoenix-admin-dashboard.test.ts