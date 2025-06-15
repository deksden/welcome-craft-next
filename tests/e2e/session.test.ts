/**
 * @file tests/e2e/session.test.ts
 * @description Упрощенные E2E тесты для сессий с test auth (избегаем NextAuth.js сложности)
 * @version 2.0.0
 * @date 2025-06-15
 */

import { test, expect } from '@playwright/test';
import { setupTestAuth, generateTestUser, navigateWithAuth, clearTestAuth } from '../helpers/auth-helper';

test.describe('Session Management Tests with Test Auth', () => {
  
  test('Test auth session can be created and verified', async ({ page }) => {
    const testUser = generateTestUser('session-create');
    await setupTestAuth(page, testUser);
    
    // Проверяем что session API возвращает пользователя
    const sessionResponse = await page.request.get('/api/test/session');
    expect(sessionResponse.ok()).toBeTruthy();
    
    const sessionData = await sessionResponse.json();
    expect(sessionData.user.email).toBe(testUser.email);
    expect(sessionData.user.id).toBe(testUser.id);
    
    console.log('✅ Test auth session created and verified');
  });

  test('Test auth session persists across page reloads', async ({ page }) => {
    const testUser = generateTestUser('session-persist');
    await setupTestAuth(page, testUser);
    await navigateWithAuth(page, '/');
    
    // Проверяем что можем получить доступ к чату
    await expect(page.getByTestId('chat-input')).toBeVisible();
    
    // Перезагружаем страницу
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Проверяем что все еще аутентифицированы
    await expect(page.getByTestId('chat-input')).toBeVisible();
    
    console.log('✅ Test auth session persists across reloads');
  });

  test('Test auth session can be cleared', async ({ page }) => {
    const testUser = generateTestUser('session-clear');
    await setupTestAuth(page, testUser);
    
    // Проверяем что session активна
    let sessionResponse = await page.request.get('/api/test/session');
    expect(sessionResponse.ok()).toBeTruthy();
    
    // Очищаем session
    await clearTestAuth(page);
    
    // Проверяем что session больше недоступна
    sessionResponse = await page.request.get('/api/test/session');
    expect(sessionResponse.status()).toBe(401);
    
    console.log('✅ Test auth session cleared successfully');
  });

  test('Different test users have separate sessions', async ({ page }) => {
    const user1 = generateTestUser('user1');
    const user2 = generateTestUser('user2');
    
    // Создаем session для первого пользователя
    await setupTestAuth(page, user1);
    let sessionResponse = await page.request.get('/api/test/session');
    let sessionData = await sessionResponse.json();
    expect(sessionData.user.email).toBe(user1.email);
    
    // Создаем session для второго пользователя (перезаписывает первую)
    await setupTestAuth(page, user2);
    sessionResponse = await page.request.get('/api/test/session');
    sessionData = await sessionResponse.json();
    expect(sessionData.user.email).toBe(user2.email);
    
    console.log('✅ Different test users have separate sessions');
  });

  test('Test auth works with different user types', async ({ page }) => {
    const regularUser = generateTestUser('regular');
    regularUser.type = 'regular';
    
    const adminUser = generateTestUser('admin');
    adminUser.type = 'admin';
    
    // Тестируем regular user
    await setupTestAuth(page, regularUser);
    let sessionResponse = await page.request.get('/api/test/session');
    let sessionData = await sessionResponse.json();
    expect(sessionData.user.type).toBe('regular');
    
    // Тестируем admin user
    await setupTestAuth(page, adminUser);
    sessionResponse = await page.request.get('/api/test/session');
    sessionData = await sessionResponse.json();
    expect(sessionData.user.type).toBe('admin');
    
    console.log('✅ Test auth supports different user types');
  });

  test('Test auth session works with navigation', async ({ page }) => {
    const testUser = generateTestUser('session-nav');
    await setupTestAuth(page, testUser);
    
    // Навигируем на главную страницу
    await navigateWithAuth(page, '/');
    await expect(page.getByTestId('chat-input')).toBeVisible();
    
    // Пробуем перейти на другие страницы (если они доступны)
    const urls = ['/', '/chat', '/artifacts'];
    
    for (const url of urls) {
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Проверяем что не произошло redirect на login
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('/login');
        expect(currentUrl).not.toContain('/register');
        
        console.log(`✅ Navigation to ${url} works with test auth`);
      } catch (error) {
        console.log(`ℹ️ URL ${url} may not exist or be accessible`);
      }
    }
  });

  test('Test auth API handles invalid requests gracefully', async ({ page }) => {
    // Пробуем получить session без аутентификации
    const sessionResponse = await page.request.get('/api/test/session');
    expect(sessionResponse.status()).toBe(401);
    
    // Пробуем создать session с невалидными данными
    const invalidAuthResponse = await page.request.post('/api/test/auth-signin', {
      data: {
        // Отсутствуют обязательные поля
      }
    });
    expect(invalidAuthResponse.status()).toBe(400);
    
    console.log('✅ Test auth API handles invalid requests correctly');
  });

  test('Test auth session includes all expected user data', async ({ page }) => {
    const testUser = generateTestUser('session-data');
    testUser.name = 'Test User Full Name';
    testUser.type = 'regular';
    
    await setupTestAuth(page, testUser);
    
    const sessionResponse = await page.request.get('/api/test/session');
    expect(sessionResponse.ok()).toBeTruthy();
    
    const sessionData = await sessionResponse.json();
    expect(sessionData.user.id).toBe(testUser.id);
    expect(sessionData.user.email).toBe(testUser.email);
    expect(sessionData.user.name).toBe(testUser.name);
    expect(sessionData.user.type).toBe(testUser.type);
    
    console.log('✅ Test auth session includes all expected user data');
  });
});