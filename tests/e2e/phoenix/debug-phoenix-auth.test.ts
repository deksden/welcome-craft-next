import { test, } from '@playwright/test';
import { universalAuthentication } from '../../helpers/auth.helper';

test.describe('Debug Phoenix Authentication', () => {
  test('debug admin authentication and session data', async ({ page }) => {
    console.log('🔍 DEBUG: Starting comprehensive Phoenix authentication debugging')
    
    // Set up console log listener
    page.on('console', msg => {
      console.log(`🖥️ BROWSER LOG [${msg.type()}]:`, msg.text())
    })
    
    // Authenticate admin user
    await universalAuthentication(page, {
      email: `debug-admin-${Date.now()}@test.com`,
      id: crypto.randomUUID(),
      type: 'admin'
    }, {
      targetPath: '/',
      skipNavigation: true
    })
    
    console.log('✅ Authentication completed, now debugging session data...')
    
    // Navigate to admin area
    await page.goto('http://app.localhost:3000/')
    await page.waitForTimeout(3000)
    
    // Check cookies
    const cookies = await page.context().cookies()
    console.log('🍪 All cookies:', cookies.map(c => ({ name: c.name, value: `${c.value.slice(0, 50)}...`, domain: c.domain })))
    
    // Check test-session cookies specifically
    const testSessionCookie = cookies.find(c => c.name === 'test-session')
    if (testSessionCookie) {
      console.log('🍪 Found test-session cookie:', `${testSessionCookie.value.slice(0, 100)}...`)
      try {
        const sessionData = JSON.parse(decodeURIComponent(testSessionCookie.value))
        console.log('🔍 Session data parsed:', sessionData)
        console.log('🔍 User type in session:', sessionData.user?.type)
      } catch (e) {
        console.error('❌ Failed to parse session cookie:', e)
      }
    } else {
      console.log('❌ No test-session cookie found!')
    }
    
    // Navigate to Phoenix users page
    console.log('🔍 Going to Phoenix users page...')
    await page.goto('/phoenix/users')
    
    // Check if page actually navigated
    const currentUrl = page.url()
    console.log(`🔍 Current URL after navigation: ${currentUrl}`)
    
    // Check page title
    const pageTitle = await page.title()
    console.log(`🔍 Page title: ${pageTitle}`)
    
    // Check for any server errors or redirects
    const responseStatus = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        url: window.location.href,
        hasError: document.querySelector('body')?.textContent?.includes('Admin privileges'),
        bodyText: document.querySelector('body')?.textContent?.slice(0, 200)
      }
    })
    console.log(`🔍 Page response:`, responseStatus)
    
    await page.waitForTimeout(10000) // Wait longer for session to be fully established
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'test-results/debug-phoenix-auth.png', fullPage: true })
    console.log('📸 Screenshot saved: test-results/debug-phoenix-auth.png')
    
    // Check page content
    const pageText = await page.textContent('body')
    console.log(`📄 Page contains "Admin privileges": ${pageText?.includes('Admin privileges') || false}`)
    console.log(`📄 Page contains "User Management": ${pageText?.includes('User Management') || false}`)
    console.log(`📄 Page contains "Error": ${pageText?.includes('Error') || false}`)
    
    // Check if FastSessionProvider logs are appearing
    console.log('✅ Debug test completed')
  });
});