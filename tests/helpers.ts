import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from '@playwright/test';
import { generateId } from 'ai';
import { ChatPage } from './pages/chat';
import { getUnixTime } from 'date-fns';
import { mockAuthentication } from './helpers/auth-mock';

export type UserContext = {
  context: BrowserContext;
  page: Page;
  request: APIRequestContext;
};

export async function createAuthenticatedContext({
  browser,
  name,
  chatModel = 'chat-model',
}: {
  browser: Browser;
  name: string;
  chatModel?: 'chat-model' | 'chat-model-reasoning';
}): Promise<UserContext> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const directory = path.join(__dirname, '../playwright/.sessions');

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const storageFile = path.join(directory, `${name}.json`);

  const context = await browser.newContext();
  const page = await context.newPage();

  const timestamp = getUnixTime(new Date());
  const email = `test-${name}-${timestamp}@playwright.com`;
  const password = generateId(16);

  await page.goto('http://app.localhost:3000/register');
  
  // Ждем загрузки формы с новыми надежными селекторами
  await page.waitForSelector('[data-testid="auth-email-input"]', { timeout: 10000 });
  
  await page.getByTestId('auth-email-input').fill(email);
  await page.getByTestId('auth-password-input').fill(password);
  await page.getByTestId('auth-submit-button').click();

  await expect(page.getByTestId('toast')).toContainText(
    'Account created successfully!',
  );

  const chatPage = new ChatPage(page);
  await chatPage.createNewChat();
  await chatPage.chooseModelFromSelector('chat-model-reasoning');
  await expect(chatPage.getSelectedModel()).resolves.toEqual('Reasoning model');

  await page.waitForTimeout(1000);
  await context.storageState({ path: storageFile });
  await page.close();

  const newContext = await browser.newContext({ storageState: storageFile });
  const newPage = await newContext.newPage();

  return {
    context: newContext,
    page: newPage,
    request: newContext.request,
  };
}

export function generateRandomTestUser() {
  const email = `test-${getUnixTime(new Date())}@playwright.com`;
  const password = generateId(16);

  return {
    email,
    password,
  };
}

/**
 * Создает аутентифицированный контекст с mock сессией (быстрее для тестирования)
 */
export async function createMockAuthenticatedContext({
  browser,
  name,
}: {
  browser: Browser;
  name: string;
}): Promise<UserContext> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const timestamp = getUnixTime(new Date());
  const email = `test-${name}-${timestamp}@playwright.com`;

  // Используем mock аутентификацию вместо реальной регистрации
  await mockAuthentication(page, email);

  return {
    context,
    page,
    request: context.request,
  };
}
