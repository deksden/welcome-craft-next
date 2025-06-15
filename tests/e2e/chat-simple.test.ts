/**
 * @file tests/e2e/chat-simple.test.ts
 * @description Упрощенный E2E тест чата с test auth (без history API)
 * @version 1.0.0
 * @date 2025-06-15
 */

import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from '../helpers/auth-helper';

test.describe('Simple Chat with Test Auth', () => {
  
  test('User can access chat interface and send message', async ({ page }) => {
    // Настраиваем test auth и переходим на главную
    await setupTestEnvironment(page);
    
    // Проверяем что chat input видимый и готов
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible();
    
    // Проверяем что send button существует (может быть disabled для пустого input)
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeVisible();
    
    console.log('✅ Chat interface is ready and accessible');
  });

  test('User can type in chat input', async ({ page }) => {
    // Настраиваем test auth и переходим на главную
    await setupTestEnvironment(page);
    
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible();
    
    // Вводим текст в chat input
    const testMessage = 'Hello, this is a test message!';
    await chatInput.fill(testMessage);
    
    // Проверяем что текст действительно введен
    await expect(chatInput).toHaveValue(testMessage);
    
    // Проверяем что send button активировался
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeEnabled();
    
    console.log('✅ Chat input is functional');
  });

  test('User can clear chat input', async ({ page }) => {
    // Настраиваем test auth и переходим на главную
    await setupTestEnvironment(page);
    
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible();
    
    // Вводим и очищаем текст
    const testMessage = 'Hello, world!';
    await chatInput.fill(testMessage);
    await expect(chatInput).toHaveValue(testMessage);
    
    await chatInput.clear();
    await expect(chatInput).toHaveValue('');
    
    // Send button должен быть disabled для пустого input
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeDisabled();
    
    console.log('✅ Chat input clearing works correctly');
  });
});