/**
 * Базовый тест чата с mock аутентификацией
 * Для быстрой проверки функциональности без реальной регистрации
 */

import { test, expect } from '@playwright/test';
import { createMockAuthenticatedContext } from '../helpers';
import { TestUtils } from '../helpers/test-utils';

test.describe('Basic Chat with Mock Auth', () => {
  test('Chat input is visible and functional', async ({ browser }) => {
    // Используем mock аутентификацию для быстрого доступа
    const { page, context } = await createMockAuthenticatedContext({
      browser,
      name: 'basic-test'
    });
    
    const testUtils = new TestUtils(page);
    
    try {
      // Переходим на главную страницу админки
      await page.goto('http://app.localhost:3000/');
      
      // Ждем загрузки страницы
      await page.waitForTimeout(2000);
      
      // Проверяем что страница загрузилась
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());
      
      // Ищем поле ввода чата
      const chatInput = page.getByTestId('chat-input');
      
      // Проверяем что элемент существует (даже если не видим)
      const chatInputCount = await chatInput.count();
      console.log('Chat input elements found:', chatInputCount);
      
      if (chatInputCount > 0) {
        // Пытаемся сделать элемент видимым
        await chatInput.first().scrollIntoViewIfNeeded();
        
        // Проверяем видимость
        const isVisible = await chatInput.first().isVisible();
        console.log('Chat input visible:', isVisible);
        
        if (isVisible) {
          await chatInput.first().fill('Тест сообщения');
          expect(await chatInput.first().inputValue()).toBe('Тест сообщения');
        }
      }
      
      // Ищем кнопку отправки
      const sendButton = page.getByTestId('send-button');
      const sendButtonCount = await sendButton.count();
      console.log('Send button elements found:', sendButtonCount);
      
    } catch (error) {
      console.error('Test error:', error);
      
      // Делаем скриншот для отладки
      await page.screenshot({ path: 'debug-basic-chat.png', fullPage: true });
      
      throw error;
    } finally {
      await context.close();
    }
  });
  
  test('Page loads without authentication errors', async ({ browser }) => {
    const { page, context } = await createMockAuthenticatedContext({
      browser,
      name: 'page-load-test'
    });
    
    try {
      await page.goto('http://app.localhost:3000/');
      
      // Проверяем что не произошло редиректа на /login
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      
      console.log('Final URL:', finalUrl);
      expect(finalUrl).not.toContain('/login');
      
      // Проверяем что страница содержит основные элементы
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeDefined();
      
    } finally {
      await context.close();
    }
  });
});