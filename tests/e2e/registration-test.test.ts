import { test, expect } from '@playwright/test';

test.describe('Registration Test', () => {
  test('user can register successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://app.localhost:3000/register');
    
    // Wait for form to load
    await page.waitForSelector('[data-testid="auth-email-input"]');
    
    // Fill registration form
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    await page.fill('[data-testid="auth-email-input"]', email);
    await page.fill('[data-testid="auth-password-input"]', 'testpassword123');
    
    // Add console listener to catch browser logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    
    // Submit form
    await page.click('[data-testid="auth-submit-button"]');
    
    // Wait for either success toast or error toast
    try {
      console.log('⏳ Waiting for toast or redirect...');
      
      // First wait for any toast to appear (success or error)
      await page.waitForSelector('[data-testid="toast"]', { timeout: 8000 });
      
      // Give a moment for the toast to render
      await page.waitForTimeout(500);
      
      const toastElement = page.locator('[data-testid="toast"]').first();
      const toastText = await toastElement.textContent();
      console.log('📨 Toast message:', toastText);
      
      if (toastText?.includes('Account created successfully')) {
        console.log('✅ Success toast appeared!');
        
        // Now wait for redirect (setTimeout delay is 1000ms)
        console.log('⏳ Waiting for redirect...');
        await page.waitForURL('http://app.localhost:3000/', { timeout: 3000 });
        console.log('✅ Successfully redirected to main page');
        
        // Check if chat interface is available (user is logged in)
        try {
          console.log('⏳ Waiting for chat interface to load...');
          await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
          console.log('✅ Chat interface loaded - user is logged in');
          console.log('✅ Registration completely successful!');
        } catch (chatError) {
          console.log('❌ Chat input not found, capturing page state...');
          
          // Let's see what's on the page
          const currentTitle = await page.title();
          const currentUrl = page.url();
          console.log('🔍 Page title:', currentTitle);
          console.log('🔍 Current URL:', currentUrl);
          
          // Look for any form of chat interface
          const hasChatContainer = await page.locator('[class*="chat"]').count();
          const hasTextarea = await page.locator('textarea').count(); 
          const hasInput = await page.locator('input[type="text"]').count();
          
          console.log('🔍 Chat containers found:', hasChatContainer);
          console.log('🔍 Textareas found:', hasTextarea);
          console.log('🔍 Text inputs found:', hasInput);
          
          // Try to find any data-testid elements
          const testIds = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-testid]');
            return Array.from(elements).map(el => el.getAttribute('data-testid'));
          });
          console.log('🔍 Available data-testids:', testIds);
          
          throw new Error('Redirected but user not properly logged in');
        }
      } else {
        console.log('❌ Error toast appeared:', toastText);
        throw new Error(`Registration failed: ${toastText}`);
      }
    } catch (error) {
      console.log('❌ Registration test failed:', error.message);
      throw error;
    }
  });
});