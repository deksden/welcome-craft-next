import { test, expect } from '@playwright/test';

test.describe('Test Page Rendering', () => {
  test('verify React rendering works for minimal test page', async ({ page }) => {
    console.log('🔍 Test: Checking minimal test page rendering')
    
    // Set up console log listener for React component logs
    page.on('console', msg => {
      console.log(`🖥️ BROWSER LOG [${msg.type()}]:`, msg.text())
    })
    
    // Navigate to test page
    await page.goto('http://app.localhost:3000/test-page')
    
    // Wait for page to fully load
    await page.waitForTimeout(3000)
    
    // Check page content
    const pageText = await page.textContent('body')
    console.log('📄 Test page contains "Test Page":', pageText?.includes('Test Page'))
    console.log('📄 Test page contains "React rendering":', pageText?.includes('React rendering'))
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/test-page-rendering.png', fullPage: true })
    console.log('📸 Screenshot saved: test-results/test-page-rendering.png')
    
    // This test should pass if React is working
    expect(pageText?.includes('Test Page')).toBe(true)
  });
});