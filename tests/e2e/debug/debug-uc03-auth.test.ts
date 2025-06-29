/**
 * @file tests/e2e/debug/debug-uc03-auth.test.ts
 * @description Debug test for UC-03 authentication issue
 */

import { test, } from '@playwright/test'
import { universalAuthentication } from '../../helpers/auth.helper'

test.describe('UC-03 Authentication Debug', () => {
  test('Debug authentication flow', async ({ page }) => {
    console.log('🔍 Starting authentication debug...')
    
    const testUser = {
      email: `debug-${Date.now()}@test.com`,
      id: crypto.randomUUID()
    }
    
    try {
      await universalAuthentication(page, testUser)
      console.log('✅ Authentication completed')
      
      // Check if header is visible
      const headerVisible = await page.locator('[data-testid="header"]').isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`📍 Header visible: ${headerVisible}`)
      
      // Check current URL
      const currentUrl = page.url()
      console.log(`📍 Current URL: ${currentUrl}`)
      
      // Check if artifacts section exists
      const artifactsButton = await page.locator('[data-testid="sidebar-artifacts-button"]').isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`📍 Artifacts button visible: ${artifactsButton}`)
      
      // Check what sidebar elements do exist
      const sidebarElements = await page.locator('[data-testid^="sidebar-"]').count()
      console.log(`📍 Total sidebar elements: ${sidebarElements}`)
      
      // Try to get page content
      const bodyText = await page.textContent('body') || ''
      const hasContent = bodyText.length > 100
      console.log(`📍 Page has content: ${hasContent} (${bodyText.length} chars)`)
      
      if (bodyText.includes('auth') || bodyText.includes('login') || bodyText.includes('sign')) {
        console.log('⚠️ Page appears to show authentication UI')
      }
      
    } catch (error) {
      console.error('❌ Authentication failed:', error)
    }
  })
})