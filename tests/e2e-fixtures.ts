/**
 * @file tests/e2e-fixtures.ts
 * @description E2E fixtures с предустановленными пользователями и storage state
 * @author Claude Code
 * @created 15.06.2025
 * @purpose Удобная система пользователей для E2E тестов
 */

import { test as baseTest, expect, type Page } from '@playwright/test';

// Предустановленные тестовые пользователи для разных сценариев
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'test-password',
    name: 'Admin User',
    role: 'admin',
    storageState: 'tests/.auth/admin.json'
  },
  user: {
    email: 'user@test.com', 
    password: 'test-password',
    name: 'Regular User',
    role: 'user',
    storageState: 'tests/.auth/user.json'
  },
  manager: {
    email: 'manager@test.com',
    password: 'test-password', 
    name: 'Manager User',
    role: 'manager',
    storageState: 'tests/.auth/manager.json'
  }
} as const;

export type TestUserRole = keyof typeof TEST_USERS;

// Расширенный test с пользователями
type TestFixtures = {
  adminPage: Page;
  userPage: Page;
  managerPage: Page;
  authenticatedPage: (role: TestUserRole) => Promise<Page>;
};

export const e2eTest = baseTest.extend<TestFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ 
      storageState: TEST_USERS.admin.storageState 
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({ 
      storageState: TEST_USERS.user.storageState 
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext({ 
      storageState: TEST_USERS.manager.storageState 
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  authenticatedPage: async ({ browser }, use) => {
    const createAuthenticatedPage = async (role: TestUserRole) => {
      const context = await browser.newContext({ 
        storageState: TEST_USERS[role].storageState 
      });
      return await context.newPage();
    };
    await use(createAuthenticatedPage);
  },
});

/**
 * Создает или обновляет пользователя в базе данных
 */
export async function ensureTestUser(role: TestUserRole, baseURL: string) {
  const user = TEST_USERS[role];
  
  const response = await fetch(`${baseURL}/api/test/ensure-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Environment': 'playwright'
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to ensure test user ${role}: ${await response.text()}`);
  }

  return await response.json();
}

/**
 * Авторизует пользователя и сохраняет storage state
 */
export async function setupUserAuth(role: TestUserRole, page: Page, baseURL: string) {
  const user = TEST_USERS[role];
  
  // Убеждаемся что пользователь существует в БД
  await ensureTestUser(role, baseURL);
  
  // Авторизуемся через форму
  await page.goto(`${baseURL}/login`);
  await page.fill('[data-testid="auth-email-input"]', user.email);
  await page.fill('[data-testid="auth-password-input"]', user.password);
  await page.click('[data-testid="auth-submit-button"]');
  
  // Ждем успешной авторизации
  await page.waitForURL(new RegExp(`^${baseURL}/?(?!/(login|register))`));
  await page.waitForLoadState('networkidle');
  
  // Сохраняем storage state
  await page.context().storageState({ path: user.storageState });
  
  console.log(`✅ Auth setup complete for ${role}: ${user.email}`);
}

export { expect };