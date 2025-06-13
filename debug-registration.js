import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the app
  await page.goto('http://app.localhost:3000');
  
  console.log('Page loaded, current URL:', page.url());
  
  // Try to find and fill the registration form
  try {
    await page.waitForSelector('[data-testid="auth-email-input"]', { timeout: 10000 });
    console.log('Email input found');
    
    await page.fill('[data-testid="auth-email-input"]', 'test@example.com');
    await page.fill('[data-testid="auth-password-input"]', 'testpassword123');
    
    console.log('Form filled, clicking submit');
    await page.click('[data-testid="auth-submit-button"]');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check for any toast messages
    const toastMessages = await page.locator('.sonner-toast').allTextContents();
    console.log('Toast messages:', toastMessages);
    
    console.log('Current URL after registration:', page.url());
    
  } catch (error) {
    console.error('Error during registration:', error.message);
    
    // Try to get page content for debugging
    const content = await page.content();
    console.log('Page content length:', content.length);
  }
  
  await browser.close();
})();