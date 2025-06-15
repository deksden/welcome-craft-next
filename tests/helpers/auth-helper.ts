/**
 * Централизованный Auth Helper для E2E тестов
 * Использует test auth систему для быстрой и надежной аутентификации
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { getTestHeaders } from './test-config';

export interface TestUser {
  id: string;
  email: string;
  name?: string;
  type?: 'regular' | 'admin' | 'guest';
}

export function generateTestUser(prefix = 'test'): TestUser {
  const timestamp = Date.now();
  return {
    id: `test-user-${timestamp}`,
    email: `${prefix}-${timestamp}@playwright.com`,
    name: `Test User ${timestamp}`,
    type: 'regular'
  };
}

/**
 * Быстрая настройка аутентификации через test auth API
 * Обходит Auth.js redirect проблемы в мульти-доменной архитектуре
 */
export async function setupTestAuth(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || generateTestUser();
  
  console.log('🔐 Setting up test auth for:', testUser.email);
  
  // Используем test auth API для создания session
  const response = await page.request.post('/api/test/auth-signin', {
    data: {
      email: testUser.email,
      userId: testUser.id,
      userType: testUser.type || 'regular'
    },
    headers: getTestHeaders()
  });

  expect(response.ok()).toBeTruthy();
  
  const responseData = await response.json();
  console.log('✅ Test auth response:', responseData);
  
  // Проверяем что session установлена
  await verifyTestAuth(page);
  
  return testUser;
}

/**
 * Проверяет что тестовая аутентификация работает
 */
export async function verifyTestAuth(page: Page): Promise<void> {
  console.log('🔍 Verifying test auth...');
  
  const response = await page.request.get('/api/test/session', {
    headers: getTestHeaders()
  });

  expect(response.ok()).toBeTruthy();
  
  const session = await response.json();
  expect(session.user).toBeTruthy();
  expect(session.user.email).toBeTruthy();
  
  console.log('✅ Test auth verified for user:', session.user.email);
}

/**
 * Очищает тестовую аутентификацию
 */
export async function clearTestAuth(page: Page): Promise<void> {
  console.log('🧹 Clearing test auth...');
  
  // Очищаем test-session cookies
  const cookies = await page.context().cookies();
  const testCookies = cookies.filter(cookie => 
    cookie.name.includes('test-session')
  );
  
  if (testCookies.length > 0) {
    await page.context().clearCookies(...testCookies);
  }
  
  console.log('✅ Test auth cleared');
}

/**
 * Навигация на защищенную страницу с проверкой аутентификации
 */
export async function navigateWithAuth(page: Page, url: string = '/'): Promise<void> {
  console.log(`🧭 Navigating to ${url} with auth...`);
  
  await page.goto(url);
  
  // Ждем загрузки страницы и проверяем что не произошло redirect на login
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
    throw new Error(`Unexpected redirect to auth page: ${currentUrl}`);
  }
  
  console.log(`✅ Successfully navigated to ${currentUrl}`);
}

/**
 * Ожидание готовности чата после аутентификации (упрощенная версия)
 */
export async function waitForChatReady(page: Page, timeout = 10000): Promise<void> {
  console.log('⏳ Waiting for chat to be ready...');
  
  // Ждем появления chat input
  await page.waitForSelector('[data-testid="chat-input"]', { timeout });
  
  // Ждем появления send button
  await page.waitForSelector('[data-testid="send-button"]', { timeout });
  
  // Короткая пауза для стабилизации UI
  await page.waitForTimeout(1000);
  
  console.log('✅ Chat is ready');
}

/**
 * Полная настройка: auth + навигация + готовность чата
 */
export async function setupTestEnvironment(page: Page, user?: TestUser, url = '/'): Promise<TestUser> {
  const testUser = await setupTestAuth(page, user);
  await navigateWithAuth(page, url);
  await waitForChatReady(page);
  
  console.log('✅ Test environment fully setup');
  return testUser;
}