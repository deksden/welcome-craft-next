/**
 * @file tests/e2e/regression/010-world-cookies-cleanup.test.ts
 * @description E2E тест для BUG-010: World cookies не сбрасываются при входе в PRODUCTION режим и при логауте
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Начальная версия для тестирования очистки world cookies
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная версия для тестирования очистки world cookies при PRODUCTION login и logout
 */

import { test, expect } from '@playwright/test';

test.describe('BUG-010: World cookies cleanup', () => {
  test( 'should clear world cookies when logging into PRODUCTION mode', async ({ page }) => {
    console.log('🧪 Testing world cookies cleanup on PRODUCTION login...');
    
    // Navigate to login page
    await page.goto('http://app.localhost:3001/login');
    
    // Set a test world cookie first to simulate previous test world usage
    await page.evaluate(() => {
      document.cookie = 'world_id=CLEAN_USER_WORKSPACE; path=/; domain=.localhost';
      document.cookie = 'world_id_fallback=CLEAN_USER_WORKSPACE; path=/';
    });
    
    console.log('🍪 Set initial test world cookies');
    
    // Verify world cookies are set (fallback cookie works in Playwright)
    const initialCookies = await page.evaluate(() => document.cookie);
    console.log('🍪 Initial cookies:', initialCookies);
    expect(initialCookies).toContain('world_id_fallback=CLEAN_USER_WORKSPACE');
    
    // Login with PRODUCTION mode (default)
    await page.fill('[data-testid="auth-email-input"]', 'test@test.com');
    await page.fill('[data-testid="auth-password-input"]', 'test-password');
    
    // Verify PRODUCTION is selected (should be default)
    const selectedOption = await page.inputValue('#world-select');
    expect(selectedOption).toBe('PRODUCTION');
    console.log('🌍 World selector shows PRODUCTION mode');
    
    // Submit login form
    await page.click('[data-testid="auth-submit-button"]');
    
    // Wait for redirect to main app
    await page.waitForURL('http://app.localhost:3001/');
    console.log('🔐 Login successful - redirected to main app');
    
    // Check that world cookies are cleared
    await page.waitForTimeout(1000); // Give time for cookies to be cleared
    const finalCookies = await page.evaluate(() => document.cookie);
    console.log('🍪 Final cookies after PRODUCTION login:', finalCookies);
    
    // Verify world cookies are cleared (check both possible cookie names)
    expect(finalCookies).not.toContain('world_id=CLEAN_USER_WORKSPACE');
    expect(finalCookies).not.toContain('world_id_fallback=CLEAN_USER_WORKSPACE');
    
    console.log('✅ World cookies successfully cleared on PRODUCTION login');
  });
  
  test('should clear world cookies on logout', async ({ page }) => {
    console.log('🧪 Testing world cookies cleanup on logout...');
    
    // Navigate to login page
    await page.goto('http://app.localhost:3001/login');
    
    // Login with a test world first
    await page.fill('[data-testid="auth-email-input"]', 'test@test.com');
    await page.fill('[data-testid="auth-password-input"]', 'test-password');
    
    // Select a test world
    await page.selectOption('#world-select', 'CLEAN_USER_WORKSPACE');
    console.log('🌍 Selected test world: CLEAN_USER_WORKSPACE');
    
    // Submit login form
    await page.click('[data-testid="auth-submit-button"]');
    
    // Wait for redirect to main app
    await page.waitForURL('http://app.localhost:3001/');
    console.log('🔐 Login successful with test world');
    
    // Verify world cookies are set  
    await page.waitForTimeout(1000); // Give time for cookies to be set
    const cookiesAfterLogin = await page.evaluate(() => document.cookie);
    console.log('🍪 Cookies after test world login:', cookiesAfterLogin);
    expect(cookiesAfterLogin).toContain('world_id_fallback=CLEAN_USER_WORKSPACE');
    
    // Logout via user menu
    await page.click('[data-testid="sidebar-user-button"]');
    await page.click('button:has-text("Sign out")');
    
    console.log('🔐 Logout clicked - waiting for redirect');
    
    // Wait for redirect to login page
    await page.waitForURL('http://app.localhost:3001/login');
    console.log('🔐 Logout successful - redirected to login');
    
    // Check that world cookies are cleared after logout
    await page.waitForTimeout(1000); // Give time for cookies to be cleared
    const cookiesAfterLogout = await page.evaluate(() => document.cookie);
    console.log('🍪 Cookies after logout:', cookiesAfterLogout);
    
    // Verify world cookies are cleared
    expect(cookiesAfterLogout).not.toContain('world_id=CLEAN_USER_WORKSPACE');
    expect(cookiesAfterLogout).not.toContain('world_id_fallback=CLEAN_USER_WORKSPACE');
    
    console.log('✅ World cookies successfully cleared on logout');
  });
  
  test('should ensure PRODUCTION mode after world cookies cleanup', async ({ page }) => {
    console.log('🧪 Testing that user gets true PRODUCTION mode after cleanup...');
    
    // Navigate to login page  
    await page.goto('http://app.localhost:3001/login');
    
    // Set test world cookies to simulate previous usage
    await page.evaluate(() => {
      document.cookie = 'world_id=ENTERPRISE_ONBOARDING; path=/; domain=.localhost';
      document.cookie = 'world_id_fallback=ENTERPRISE_ONBOARDING; path=/';
    });
    
    console.log('🍪 Set initial test world cookies (ENTERPRISE_ONBOARDING)');
    
    // Login with PRODUCTION mode
    await page.fill('[data-testid="auth-email-input"]', 'test@test.com');
    await page.fill('[data-testid="auth-password-input"]', 'test-password');
    
    // Explicitly select PRODUCTION
    await page.selectOption('#world-select', 'PRODUCTION');
    console.log('🌍 Explicitly selected PRODUCTION mode');
    
    // Submit login form
    await page.click('[data-testid="auth-submit-button"]');
    
    // Wait for redirect to main app
    await page.waitForURL('http://app.localhost:3001/');
    console.log('🔐 Login successful');
    
    // Wait for page to fully load and check world indicator
    await page.waitForTimeout(2000);
    
    // Verify no world indicator is shown (should be hidden for PRODUCTION)
    const worldIndicator = page.locator('[data-testid="world-indicator"]');
    await expect(worldIndicator).toHaveCount(0);
    console.log('✅ World indicator hidden - user is in true PRODUCTION mode');
    
    // Verify cookies are cleared
    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('world_id=ENTERPRISE_ONBOARDING');
    expect(cookies).not.toContain('world_id_fallback=ENTERPRISE_ONBOARDING');
    
    console.log('✅ No world isolation active - user is in true PRODUCTION environment');
  });
});

// END OF: tests/e2e/regression/010-world-cookies-cleanup.test.ts