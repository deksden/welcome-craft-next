/**
 * Базовый тест чата с простой аутентификацией
 * Для быстрой проверки функциональности с рабочей авторизацией
 */

import { test, expect } from '@playwright/test';
import { TestUtils } from '../helpers/test-utils';
import { logTestConfig } from '../helpers/test-config';

test.describe('Basic Chat with Simple Auth', () => {
  test('Chat input is visible and functional', async ({ page }) => {
    const testUtils = new TestUtils(page);
    
    // Логируем конфигурацию для отладки
    logTestConfig();
    
    try {
      // Используем новую auth систему
      const timestamp = Date.now();
      const email = `test-basic-${timestamp}@playwright.com`;
      const userId = `test-user-${timestamp}`;
      
      // Переходим на страницу приложения
      await page.goto('/');
      
      // Устанавливаем auth session через API
      console.log('🔐 Setting up auth session...');
      await testUtils.setAuthSession(email, userId);
      
      // Проверяем что session установлена
      const authStatus = await testUtils.checkAuthStatus();
      expect(authStatus.authenticated).toBe(true);
      
      // Переходим на главную страницу
      await page.goto('/');
      
      // Ждем чтобы страница загрузилась
      await page.waitForTimeout(1000);
      
      // Проверяем что мы на главной странице
      await page.waitForTimeout(2000);
      console.log('Current URL:', page.url());
      console.log('Page title:', await page.title());
      
      // Ищем поле ввода чата
      const chatInput = page.getByTestId('chat-input');
      
      // Ждем появления элемента
      await chatInput.waitFor({ timeout: 10000 });
      
      // Проверяем что элемент видим и функционален
      await expect(chatInput).toBeVisible();
      await chatInput.fill('Тест сообщения');
      expect(await chatInput.inputValue()).toBe('Тест сообщения');
      
      // Ищем кнопку отправки
      const sendButton = page.getByTestId('send-button');
      await expect(sendButton).toBeVisible();
      
    } catch (error) {
      console.error('Test error:', error);
      
      // Делаем скриншот для отладки
      await page.screenshot({ path: 'debug-basic-chat.png', fullPage: true });
      
      throw error;
    }
  });
  
  test('Page loads without authentication errors', async ({ page }) => {
    const testUtils = new TestUtils(page);
    
    // Логируем конфигурацию для отладки
    logTestConfig();
    
    try {
      // Используем новую auth систему
      const timestamp = Date.now();
      const email = `test-load-${timestamp}@playwright.com`;
      const userId = `test-user-${timestamp}`;
      
      // Переходим на страницу приложения  
      await page.goto('/');
      
      // Устанавливаем auth session через API
      console.log('🔐 Setting up auth session...');
      await testUtils.setAuthSession(email, userId);
      
      // Проверяем что session установлена
      const authStatus = await testUtils.checkAuthStatus();
      expect(authStatus.authenticated).toBe(true);
      
      // Переходим на главную страницу
      await page.goto('/');
      
      // Проверяем что не произошло редиректа на /login
      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      
      console.log('Final URL:', finalUrl);
      expect(finalUrl).not.toContain('/login');
      expect(finalUrl).not.toContain('/register');
      
      // Проверяем что страница содержит основные элементы
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeDefined();
      
      // Проверяем наличие чат-интерфейса
      const chatInput = page.getByTestId('chat-input');
      await expect(chatInput).toBeVisible();
      
    } catch (error) {
      console.error('Auth test error:', error);
      await page.screenshot({ path: 'debug-auth-error.png', fullPage: true });
      throw error;
    }
  });
});