// Simple registration test script
import { test, expect } from '@playwright/test';

test.describe('Registration Debug', () => {
  test('minimal registration test', async ({ page }) => {
    console.log('Starting test...');
    
    // Go to registration page
    await page.goto('http://app.localhost:3000/register');
    console.log('Page loaded');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="auth-email-input"]');
    console.log('Form found');
    
    // Fill form
    await page.fill('[data-testid="auth-email-input"]', 'debug@test.com');
    await page.fill('[data-testid="auth-password-input"]', 'testpassword123');
    console.log('Form filled');
    
    // Submit form
    await page.click('[data-testid="auth-submit-button"]');
    console.log('Form submitted');
    
    // Wait for any toast messages and log them
    try {
      const toast = await page.waitForSelector('.sonner-toast', { timeout: 10000 });
      const toastText = await toast.textContent();
      console.log('Toast message:', toastText);
    } catch (e) {
      console.log('No toast found or timeout:', e.message);
    }
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Wait a bit more to see what happens
    await page.waitForTimeout(3000);
  });
});