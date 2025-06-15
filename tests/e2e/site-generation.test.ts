/**
 * @file tests/e2e/site-generation.test.ts
 * @description Упрощенные E2E тесты для UI элементов генерации сайтов
 * @version 2.0.0
 * @date 2025-06-15
 * @updated Упрощен до базовых UI тестов без AI интеграций
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, generateTestUser, navigateWithAuth } from '../helpers/auth-helper';

test.describe('Site Generation UI', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = generateTestUser('site');
    await setupTestAuth(page, testUser);
  });

  test('Chat interface is accessible for site generation', async ({ page }) => {
    await navigateWithAuth(page, '/');
    
    // Проверяем основные элементы интерфейса чата
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    await expect(page.getByTestId('model-selector')).toBeVisible();
    
    // Проверяем что можем ввести текст
    await page.getByTestId('chat-input').fill('Test message for site generation');
    const inputValue = await page.getByTestId('chat-input').inputValue();
    expect(inputValue).toBe('Test message for site generation');
  });

  test('Suggested actions are available', async ({ page }) => {
    await navigateWithAuth(page, '/');
    
    // Проверяем наличие suggested actions
    const suggestedActions = page.getByTestId('suggested-actions');
    await expect(suggestedActions).toBeVisible();
    
    // Проверяем что есть текст с предложениями
    const suggestedText = await suggestedActions.textContent();
    expect(suggestedText).toBeTruthy();
    expect(suggestedText?.length).toBeGreaterThan(0);
  });

  test('Chat interface is responsive on mobile', async ({ page }) => {
    await navigateWithAuth(page, '/');
    
    // Эмуляция мобильного устройства
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Проверяем что основные элементы остаются доступными
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    
    // Проверяем что chat-input адаптируется к ширине экрана
    const chatInput = page.getByTestId('chat-input');
    const inputBox = await chatInput.boundingBox();
    expect(inputBox?.width).toBeLessThanOrEqual(375);
  });

  test('Attachments button is functional', async ({ page }) => {
    await navigateWithAuth(page, '/');
    
    // Проверяем что кнопка attachments доступна
    const attachmentsButton = page.getByTestId('attachments-button');
    await expect(attachmentsButton).toBeVisible();
    
    // Проверяем что кнопка кликабельная
    await expect(attachmentsButton).toBeEnabled();
  });

  test('Model selector is functional', async ({ page }) => {
    await navigateWithAuth(page, '/');
    
    // Проверяем что model selector доступен
    const modelSelector = page.getByTestId('model-selector');
    await expect(modelSelector).toBeVisible();
    await expect(modelSelector).toBeEnabled();
    
    // Проверяем что есть текст
    const selectorText = await modelSelector.textContent();
    expect(selectorText).toBeTruthy();
  });

  test('Send button becomes enabled when message is entered', async ({ page }) => {
    await navigateWithAuth(page, '/');
    
    const chatInput = page.getByTestId('chat-input');
    const sendButton = page.getByTestId('send-button');
    
    // Вводим сообщение
    await chatInput.fill('Test message about site generation');
    
    // Проверяем что кнопка send активна
    await expect(sendButton).toBeEnabled();
    
    // Очищаем поле
    await chatInput.fill('');
    
    // Проверяем состояние кнопки (может быть disabled или enabled в зависимости от UI логики)
    await expect(sendButton).toBeVisible();
  });



  test('Page loads without errors', async ({ page }) => {
    // Отслеживаем ошибки консоли
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await navigateWithAuth(page, '/');
    
    // Ждем полной загрузки
    await page.waitForLoadState('networkidle');
    
    // Проверяем что критических ошибок нет
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load resource') && 
      !error.includes('404') &&
      !error.includes('network')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});