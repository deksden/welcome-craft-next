/**
 * @file tests/api-fixtures.ts  
 * @description API-only fixtures for testing API endpoints without UI dependencies
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - исправление проблемы с fixtures для API тестов
 */

import { expect as baseExpect, test as baseTest } from '@playwright/test';
import type { APIRequestContext, Browser, BrowserContext } from '@playwright/test';
import { getUnixTime } from 'date-fns';
import { generateId } from 'ai';

export type APIUserContext = {
  context: BrowserContext;
  request: APIRequestContext;
  email: string;
  password: string;
};

interface APIFixtures {
  adaContext: APIUserContext;
  babbageContext: APIUserContext;
  curieContext: APIUserContext;
}

/**
 * Создает аутентифицированный API контекст без использования UI
 */
async function createAPIAuthenticatedContext({
  browser,
  name,
}: {
  browser: Browser;
  name: string;
}): Promise<APIUserContext> {
  const context = await browser.newContext();
  
  const timestamp = getUnixTime(new Date());
  const email = `test-${name}-${timestamp}@playwright.com`;
  const password = generateId(16);

  // Создаем пользователя напрямую в базе данных через утилиты проекта
  const { createUser } = await import('@/lib/db/queries');
  await createUser(email, password);

  // Теперь входим через NextAuth API
  const request = context.request;
  
  const loginResponse = await request.post('http://app.localhost:3000/api/auth/callback/credentials', {
    data: {
      email,
      password,
      redirect: false,
    },
  });

  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }

  return {
    context,
    request,
    email,
    password,
  };
}

export const apiTest = baseTest.extend<APIFixtures>({
  adaContext: async ({ browser }, use, workerInfo) => {
    const ada = await createAPIAuthenticatedContext({
      browser,
      name: `ada-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
    });

    await use(ada);
    await ada.context.close();
  },
  
  babbageContext: async ({ browser }, use, workerInfo) => {
    const babbage = await createAPIAuthenticatedContext({
      browser,
      name: `babbage-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
    });

    await use(babbage);
    await babbage.context.close();
  },
  
  curieContext: async ({ browser }, use, workerInfo) => {
    const curie = await createAPIAuthenticatedContext({
      browser,
      name: `curie-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
    });

    await use(curie);
    await curie.context.close();
  },
});

export const expect = baseExpect;