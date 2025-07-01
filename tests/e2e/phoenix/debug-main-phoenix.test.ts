import { test, expect } from '@playwright/test';
import { universalAuthentication } from '../../helpers/auth.helper';
import crypto from 'crypto';

test.describe('Debug Main Phoenix Page Access', () => {
  test('test main Phoenix page instead of users page', async ({ page }) => {
    console.log('🔍 Debug test: Main Phoenix page access')
    
    // Capture console logs
    page.on('console', msg => {
      console.log(`🖥️ BROWSER [${msg.type()}]:`, msg.text())
    })
    
    // Capture page errors
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message)
    })
    
    // Capture failed requests
    page.on('requestfailed', request => {
      console.log('❌ REQUEST FAILED:', request.url(), '-', request.failure()?.errorText)
    })
    
    // Capture responses with error status
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()}:`, response.url())
      }
    })
    
    console.log('🚀 Step 1: Authenticating as admin user...')
    
    // Create unique admin user for this test
    const adminUser = {
      email: `debug-main-phoenix-admin-${Date.now()}@test.com`,
      id: crypto.randomUUID(),
      type: 'admin' as const
    }
    
    // Authenticate user
    await universalAuthentication(page, adminUser)
    
    console.log('✅ Step 1 completed: User authenticated')
    
    console.log('🚀 Step 2: Navigating to MAIN Phoenix page...')
    
    // Navigate to MAIN Phoenix page (server component, should work!)
    await page.goto('http://app.localhost:3000/phoenix')
    
    console.log('⏳ Step 3: Waiting for page to load...')
    await page.waitForTimeout(5000)
    
    // Check page status
    const pageText = await page.textContent('body')
    console.log('📄 Page contains "PHOENIX":', pageText?.includes('PHOENIX'))
    console.log('📄 Page contains "404":', pageText?.includes('404'))
    console.log('📄 Page contains "Admin Dashboard":', pageText?.includes('Admin Dashboard'))
    console.log('📄 Page contains "Authentication Required":', pageText?.includes('Authentication Required'))
    console.log('📄 Page contains "Access Denied":', pageText?.includes('Access Denied'))
    console.log('📄 Page contains "Loading":', pageText?.includes('Loading'))
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/debug-main-phoenix.png', 
      fullPage: true 
    })
    console.log('📸 Screenshot saved: test-results/debug-main-phoenix.png')
    
    // This test is for debugging only
    expect(true).toBe(true)
  });
});