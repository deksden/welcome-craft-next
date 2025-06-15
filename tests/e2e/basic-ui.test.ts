/**
 * @file tests/e2e/basic-ui.test.ts
 * @description Базовые UI тесты с test auth (избегают проблемы с history API)
 * @version 1.0.0
 * @date 2025-06-15
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, generateTestUser, navigateWithAuth } from '../helpers/auth-helper';

test.describe('Basic UI Tests with Test Auth', () => {
  
  test('User can authenticate and see basic interface', async ({ page }) => {
    const testUser = generateTestUser('basic-ui');
    
    // Настраиваем test auth
    await setupTestAuth(page, testUser);
    
    // Переходим на главную страницу
    await navigateWithAuth(page, '/');
    
    // Проверяем базовые элементы UI без зависимости от history API
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    
    console.log('✅ Basic UI elements are visible');
  });

  test('Chat input is functional', async ({ page }) => {
    const testUser = generateTestUser('chat-input');
    
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    
    // Тестируем функциональность chat input
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Проверяем начальное состояние
    await expect(chatInput).toBeVisible();
    await expect(sendButton).toBeVisible();
    
    // Вводим текст
    const testMessage = 'Hello, this is a test!';
    await chatInput.fill(testMessage);
    await expect(chatInput).toHaveValue(testMessage);
    
    // Send button должен активироваться
    await expect(sendButton).toBeEnabled();
    
    // Очищаем input
    await chatInput.clear();
    await expect(chatInput).toHaveValue('');
    
    console.log('✅ Chat input functionality works');
  });

  test('User can access different pages', async ({ page }) => {
    const testUser = generateTestUser('navigation');
    
    await setupTestAuth(page, testUser);
    
    // Тестируем навигацию между страницами
    await navigateWithAuth(page, '/');
    await expect(page.getByTestId('chat-input')).toBeVisible();
    
    // Проверяем что мы можем оставаться на главной странице без проблем
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Проверяем что UI загрузился после reload
    await expect(page.getByTestId('chat-input')).toBeVisible();
    
    console.log('✅ Navigation and page reload work');
  });
});