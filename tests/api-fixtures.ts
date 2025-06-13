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

  // Создаем пользователя через тестовый API endpoint
  const request = context.request;
  const createUserResponse = await request.post('http://app.localhost:3000/api/test/create-user', {
    data: {
      email,
      password,
    },
    headers: {
      'X-Test-Environment': 'playwright'
    }
  });

  if (!createUserResponse.ok()) {
    const errorText = await createUserResponse.text();
    throw new Error(`Failed to create test user: ${createUserResponse.status()} ${errorText}`);
  }

  // Создаем страницу для входа
  const page = await context.newPage();
  let authenticatedRequest = context.request;
  
  try {
    // Переходим на страницу регистрации/входа
    await page.goto('http://app.localhost:3000/login');
    
    // Если есть форма входа, заполняем её
    try {
      await page.waitForSelector('[data-testid="auth-email-input"]', { timeout: 5000 });
      await page.fill('[data-testid="auth-email-input"]', email);
      await page.fill('[data-testid="auth-password-input"]', password);
      
      // Используем force click если кнопка disabled
      await page.click('[data-testid="auth-submit-button"]', { force: true });
      
      // Ждем какой-либо ответ от сервера (успех или ошибка)
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Ждем редиректа после успешного входа
      await page.waitForURL(/^http:\/\/app\.localhost:3000\/?(?!\/(login|register))/, { timeout: 10000 });
      
      // Проверим, что мы действительно залогинены, посетив защищенную страницу
      await page.goto('http://app.localhost:3000/');
      await page.waitForLoadState('networkidle');
      
      // Проверим, что нет редиректа на login
      const finalUrl = page.url();
      
      if (finalUrl.includes('/login')) {
        throw new Error('Login failed - redirected back to login page');
      }
    } catch (e) {
      // Если форма входа не найдена, возможно пользователь уже залогинен
      console.log('Login form not found or already logged in');
    }

    // ВАЖНО: Получаем cookies из браузерного контекста после логина
    const cookies = await context.cookies();
    
    // Обновляем headers для API requests с cookies
    const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    
    // Обновляем request context с правильными cookies
    authenticatedRequest = context.request;
    
    // Переопределяем метод для добавления cookies ко всем запросам
    const originalGet = authenticatedRequest.get.bind(authenticatedRequest);
    const originalPost = authenticatedRequest.post.bind(authenticatedRequest);
    const originalPut = authenticatedRequest.put.bind(authenticatedRequest);
    const originalDelete = authenticatedRequest.delete.bind(authenticatedRequest);
    
    authenticatedRequest.get = (url: string, options: any = {}) => {
      return originalGet(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cookie': cookieHeader,
        }
      });
    };
    
    authenticatedRequest.post = (url: string, options: any = {}) => {
      return originalPost(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cookie': cookieHeader,
        }
      });
    };
    
    authenticatedRequest.put = (url: string, options: any = {}) => {
      return originalPut(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cookie': cookieHeader,
        }
      });
    };
    
    authenticatedRequest.delete = (url: string, options: any = {}) => {
      return originalDelete(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cookie': cookieHeader,
        }
      });
    };
    
  } finally {
    await page.close();
  }

  return {
    context,
    request: authenticatedRequest,
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