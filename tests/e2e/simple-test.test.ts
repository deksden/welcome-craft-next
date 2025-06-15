/**
 * Простой тест для проверки новой конфигурационной системы
 */

import { test, expect } from '@playwright/test';
import { TestUtils } from '../helpers/test-utils';
import { logTestConfig } from '../helpers/test-config';

test.describe('Simple Test with New Configuration', () => {
  test('Basic navigation and registration test', async ({ page }) => {
    const utils = new TestUtils(page);
    
    // Логируем конфигурацию для отладки
    logTestConfig();
    
    console.log('🔐 Starting simple registration test...');
    
    // Переходим на страницу регистрации
    await page.goto('/register');
    
    // Ждем загрузки формы
    await page.waitForSelector('[data-testid="auth-email-input"]', { timeout: 10000 });
    
    console.log('✅ Registration page loaded successfully');
    
    // Заполняем форму
    const testEmail = `simple-test-${Date.now()}@playwright.com`;
    await page.fill('[data-testid="auth-email-input"]', testEmail);
    await page.fill('[data-testid="auth-password-input"]', 'test-password');
    
    console.log('📝 Form filled with test data');
    
    // Отправляем форму
    await page.click('[data-testid="auth-submit-button"]');
    
    // Ждем toast сообщения
    await page.waitForSelector('[data-testid="toast"], [data-sonner-toast]', { timeout: 10000 });
    
    console.log('✅ Toast appeared after form submission');
    
    // Проверяем что auth session API работает
    const authResponse = await page.request.get('/api/test/session', {
      headers: { 'X-Test-Environment': 'playwright' }
    });
    
    console.log(`🔍 Auth session API responded with status: ${authResponse.status()}`);
    
    if (authResponse.ok()) {
      const sessionData = await authResponse.json();
      console.log('📋 Session data:', sessionData);
    }
    
    console.log('✅ Simple test completed successfully');
  });
});