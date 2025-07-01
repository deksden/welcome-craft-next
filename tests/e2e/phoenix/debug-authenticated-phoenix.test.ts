import { test, expect } from '@playwright/test';
import { universalAuthentication } from '../../helpers/auth.helper';
import crypto from 'crypto';

test.describe('Debug Authenticated Phoenix Access', () => {
  test('authenticate first, then access Phoenix page', async ({ page }) => {
    console.log('🔍 Debug test: Authenticated Phoenix access')
    
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
      email: `debug-phoenix-admin-${Date.now()}@test.com`,
      id: crypto.randomUUID(),
      type: 'admin' as const
    }
    
    // Authenticate user
    await universalAuthentication(page, adminUser)
    
    console.log('✅ Step 1 completed: User authenticated')
    
    // Check cookies after authentication
    const cookies = await page.context().cookies()
    const testSessionCookie = cookies.find(c => c.name === 'test-session')
    
    if (testSessionCookie) {
      console.log('✅ Test session cookie found:', {
        domain: testSessionCookie.domain,
        path: testSessionCookie.path,
        value: testSessionCookie.value.slice(0, 50) + '...'
      })
      
      try {
        const sessionData = JSON.parse(decodeURIComponent(testSessionCookie.value))
        console.log('🔍 Session data:', {
          userEmail: sessionData.user?.email,
          userType: sessionData.user?.type,
          expires: sessionData.expires
        })
      } catch (e) {
        console.log('❌ Failed to parse session cookie:', e)
      }
    } else {
      console.log('❌ No test-session cookie found after authentication!')
    }
    
    console.log('🚀 Step 2: Navigating to Phoenix users page...')
    
    // Navigate to Phoenix users page with authentication
    await page.goto('http://app.localhost:3000/phoenix/users')
    
    console.log('⏳ Step 3: Waiting for page to load...')
    await page.waitForTimeout(5000)
    
    // Check page status
    const pageText = await page.textContent('body')
    console.log('📄 Page contains "Admin privileges":', pageText?.includes('Admin privileges'))
    console.log('📄 Page contains "404":', pageText?.includes('404'))
    console.log('📄 Page contains "User Management":', pageText?.includes('User Management'))
    console.log('📄 Page contains "Loading":', pageText?.includes('Loading'))
    console.log('📄 Page contains "Error":', pageText?.includes('Error'))
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/debug-authenticated-phoenix.png', 
      fullPage: true 
    })
    console.log('📸 Screenshot saved: test-results/debug-authenticated-phoenix.png')
    
    // This test is for debugging only
    expect(true).toBe(true)
  });
});