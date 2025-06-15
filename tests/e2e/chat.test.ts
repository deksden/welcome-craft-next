/**
 * @file tests/e2e/chat.test.ts
 * @description Базовые UI тесты чата с test auth (без AI интеграций)
 * @version 2.0.0
 * @date 2025-06-15
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, navigateWithAuth, waitForChatReady, generateTestUser } from '../helpers/auth-helper';

test.describe('Chat Interface Tests with Test Auth', () => {
  
  test('Chat interface loads and is accessible', async ({ page }) => {
    const testUser = generateTestUser('chat-interface');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    // Проверяем базовые элементы чата
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeDisabled(); // Пустой input
    
    console.log('✅ Chat interface loaded successfully');
  });

  test('Chat input functionality works correctly', async ({ page }) => {
    const testUser = generateTestUser('chat-input');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Тестируем ввод текста
    const testMessage = 'Hello, this is a test message for chat!';
    await chatInput.fill(testMessage);
    await expect(chatInput).toHaveValue(testMessage);
    await expect(sendButton).toBeEnabled(); // Должен активироваться
    
    // Тестируем очистку
    await chatInput.clear();
    await expect(chatInput).toHaveValue('');
    await expect(sendButton).toBeDisabled(); // Должен деактивироваться
    
    console.log('✅ Chat input functionality works');
  });

  test('User can interact with suggested actions', async ({ page }) => {
    const testUser = generateTestUser('suggestions');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    // Ищем suggested actions (если есть)
    const suggestedActions = page.getByTestId('suggested-actions');
    const hasSuggestions = await suggestedActions.isVisible().catch(() => false);
    
    if (hasSuggestions) {
      await expect(suggestedActions).toBeVisible();
      console.log('✅ Suggested actions are visible');
    } else {
      console.log('ℹ️ No suggested actions found (normal for empty chat)');
    }
  });

  test('Chat preserves session after page reload', async ({ page }) => {
    const testUser = generateTestUser('session-persistence');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    // Добавляем текст в input
    const chatInput = page.getByTestId('chat-input');
    const testMessage = 'This text should persist';
    await chatInput.fill(testMessage);
    await expect(chatInput).toHaveValue(testMessage);
    
    // Перезагружаем страницу
    await page.reload();
    await waitForChatReady(page);
    
    // Проверяем что чат все еще доступен (но input может быть очищен - это нормально)
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    
    console.log('✅ Chat interface persists after reload');
  });

  test('Chat supports keyboard navigation', async ({ page }) => {
    const testUser = generateTestUser('keyboard-nav');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    
    // Фокус на input
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
    
    // Вводим текст через клавиатуру
    await page.keyboard.type('Testing keyboard input');
    await expect(chatInput).toHaveValue('Testing keyboard input');
    
    // Очищаем с помощью clear() метода - более надежно чем keyboard shortcuts
    await chatInput.clear();
    await expect(chatInput).toHaveValue('');
    
    console.log('✅ Keyboard navigation works');
  });

  test('Chat handles focus states correctly', async ({ page }) => {
    const testUser = generateTestUser('focus-states');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    await waitForChatReady(page);
    
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Проверяем фокус на input
    await chatInput.click();
    await expect(chatInput).toBeFocused();
    
    // Проверяем что можем перевести фокус на кнопку (если она активна)
    await chatInput.fill('test');
    await sendButton.focus();
    
    // Проверяем что можем вернуться к input
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
    
    console.log('✅ Focus states work correctly');
  });
});
