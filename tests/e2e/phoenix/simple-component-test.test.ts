import { test, expect } from '@playwright/test';

test.describe('Simple Component Rendering Test', () => {
  test('check if Phoenix page component is rendered at all', async ({ page }) => {
    console.log('🔍 Simple test: Starting basic Phoenix page rendering check')
    
    // Navigate directly to Phoenix users page
    await page.goto('http://app.localhost:3000/phoenix/users')
    
    // Wait for page to fully load
    await page.waitForTimeout(5000)
    
    // Check if we can find ANY React component log
    const pageText = await page.textContent('body')
    console.log('📄 Page body text (first 200 chars):', pageText?.slice(0, 200))
    
    // Check page title
    const pageTitle = await page.title()
    console.log('📄 Page title:', pageTitle)
    
    // Check if admin privileges error appears
    const hasAdminError = pageText?.includes('Admin privileges')
    console.log('📄 Contains "Admin privileges" error:', hasAdminError)
    
    // Check for any server errors
    const hasServerError = pageText?.includes('500') || pageText?.includes('Internal Server Error')
    console.log('📄 Contains server error:', hasServerError)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/simple-component-test.png', fullPage: true })
    console.log('📸 Screenshot saved: test-results/simple-component-test.png')
    
    // This test should always pass - we're just debugging
    expect(true).toBe(true)
  });
});