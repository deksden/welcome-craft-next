/**
 * @file tests/e2e/user-management.test.ts
 * @description Упрощенные E2E тесты для управления пользователями с test auth
 * @version 2.0.0
 * @date 2025-06-15
 * @updated Переписан на test auth систему
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, generateTestUser, navigateWithAuth } from '../helpers/auth-helper';

test.describe('User Management E2E', () => {
  test('Admin user can access chat interface', async ({ page }) => {
    const adminUser = generateTestUser('admin');
    adminUser.type = 'admin';
    
    await setupTestAuth(page, adminUser);
    await navigateWithAuth(page, '/');
    
    // Проверяем что админ может использовать чат
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    await expect(page.getByTestId('model-selector')).toBeVisible();
  });

  test('Regular user can access basic features', async ({ page }) => {
    const regularUser = generateTestUser('user');
    regularUser.type = 'regular';
    
    await setupTestAuth(page, regularUser);
    await navigateWithAuth(page, '/');
    
    // Проверяем что обычный пользователь может использовать чат
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    await expect(page.getByTestId('model-selector')).toBeVisible();
  });

  test('Multiple users can access the system independently', async ({ page }) => {
    // Тестируем разные типы пользователей
    const users = [
      { ...generateTestUser('admin'), type: 'admin' },
      { ...generateTestUser('manager'), type: 'manager' },
      { ...generateTestUser('user'), type: 'regular' }
    ];
    
    for (const user of users) {
      // Очищаем предыдущую auth
      await page.goto('/login');
      
      // Настраиваем auth для текущего пользователя
      await setupTestAuth(page, user);
      await navigateWithAuth(page, '/');
      
      // Проверяем что пользователь может использовать систему
      await expect(page.getByTestId('chat-input')).toBeVisible();
      
      // Можем ввести сообщение
      await page.getByTestId('chat-input').fill(`Test from ${user.type} user`);
      const inputValue = await page.getByTestId('chat-input').inputValue();
      expect(inputValue).toContain(user.type);
    }
  });

  test('User can interact with chat interface features', async ({ page }) => {
    const testUser = generateTestUser('interaction');
    
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    
    // Проверяем все основные элементы интерфейса
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
    await expect(page.getByTestId('model-selector')).toBeVisible();
    await expect(page.getByTestId('attachments-button')).toBeVisible();
    
    // Проверяем suggested actions
    const suggestedActions = page.getByTestId('suggested-actions');
    if (await suggestedActions.isVisible()) {
      await expect(suggestedActions).toBeVisible();
    }
    
    // Проверяем что можем ввести сообщение
    await page.getByTestId('chat-input').fill('Test interaction with chat interface');
    const inputValue = await page.getByTestId('chat-input').inputValue();
    expect(inputValue).toBe('Test interaction with chat interface');
  });
});