import { test, expect } from '@playwright/test';

test.describe('Debug Browser Logs', () => {
  test('capture browser console logs and network errors', async ({ page }) => {
    console.log('🔍 Debug test: Starting browser log capture')
    
    // Capture all console logs
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
    
    console.log('📍 Navigating to Phoenix users page...')
    await page.goto('http://app.localhost:3000/phoenix/users')
    
    // Wait for page to load
    console.log('⏳ Waiting for page to load...')
    await page.waitForTimeout(5000)
    
    // Get page content for analysis
    const pageText = await page.textContent('body')
    console.log('📄 Page contains "Admin privileges":', pageText?.includes('Admin privileges'))
    console.log('📄 Page contains "500":', pageText?.includes('500'))
    console.log('📄 Page contains "Error":', pageText?.includes('Error'))
    
    // Check if there's any visible error message
    const errorElement = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-destructive').first()
    if (await errorElement.count() > 0) {
      const errorText = await errorElement.textContent()
      console.log('🔍 Found error element:', errorText)
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/debug-browser-logs.png', fullPage: true })
    console.log('📸 Screenshot saved: test-results/debug-browser-logs.png')
    
    // This test is for debugging only
    expect(true).toBe(true)
  });
});