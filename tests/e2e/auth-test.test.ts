/**
 * @file tests/e2e/auth-test.test.ts
 * @description Тесты для проверки test auth системы
 * @version 2.0.0
 * @date 2025-06-15
 * @updated Переписан для новой test auth системы
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, generateTestUser, clearTestAuth, navigateWithAuth } from '../helpers/auth-helper';

test.describe('Auth System Test', () => {
  test('Test auth session setup and verification', async ({ page }) => {
    const testUser = generateTestUser('auth-test');
    
    console.log('🔐 Starting test auth verification...');
    console.log(`📧 Test user: ${testUser.email}`);
    
    // Очищаем предыдущие auth sessions
    await clearTestAuth(page);
    
    // Настраиваем test auth
    await setupTestAuth(page, testUser);
    
    // Проверяем что можем перейти на главную страницу
    await navigateWithAuth(page, '/');
    
    // Проверяем что пользователь аутентифицирован (есть доступ к чату)
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    
    console.log('✅ Test auth successfully verified!');
  });
  
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    // Очищаем все auth sessions
    await clearTestAuth(page);
    
    // Пытаемся перейти на главную страницу без auth
    await page.goto('/');
    
    // Проверяем что перенаправлены на login
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    console.log('✅ Redirect to login works correctly!');
  });
  
  test('Different user types can authenticate', async ({ page }) => {
    const userTypes = ['regular', 'admin', 'manager'];
    
    for (const userType of userTypes) {
      console.log(`🔐 Testing auth for user type: ${userType}`);
      
      const testUser = generateTestUser(`${userType}-test`);
      testUser.type = userType;
      
      // Очищаем предыдущие sessions
      await clearTestAuth(page);
      
      // Настраиваем auth для текущего типа
      await setupTestAuth(page, testUser);
      await navigateWithAuth(page, '/');
      
      // Проверяем что аутентификация работает
      await expect(page.getByTestId('chat-input')).toBeVisible();
      
      console.log(`✅ Auth successful for ${userType} user`);
    }
  });
});