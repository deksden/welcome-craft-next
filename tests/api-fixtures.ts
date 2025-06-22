/**
 * @file tests/api-fixtures.ts
 * @description API-only fixtures for testing API endpoints without UI dependencies.
 * @author Claude Code
 * @created 13.06.2025
 * @version 2.0.0
 * @date 2025-06-14
 */

/** HISTORY:
 * v2.0.0 (2025-06-14): Reverted to version 2.0.0. This version correctly gets the baseURL from the test's `page` object, which is the right approach with an async config.
 * v3.0.0 (2025-06-14): Simplified to use baseURL directly from the test config.
 * v1.1.0 (2025-06-14): Used PLAYWRIGHT_PORT environment variable for dynamic URLs.
 * v1.0.0 (2025-06-13): Initial version.
 */

import type { APIRequestContext, Browser, BrowserContext } from '@playwright/test'
import { expect as baseExpect, test as baseTest } from '@playwright/test'
import { getUnixTime } from 'date-fns'

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
 * Creates an authenticated API context using the test's pre-configured baseURL.
 */
async function createAPIAuthenticatedContext ({
  browser,
  baseURL,
  name,
}: {
  browser: Browser;
  baseURL: string;
  name: string;
}): Promise<APIUserContext> {

  const url = new URL(baseURL)
  const port = url.port
  
  // For API tests, use app.localhost for EVERYTHING to avoid cross-domain cookie issues
  const appURL = `http://app.localhost:${port}`
  
  // Set the correct NEXTAUTH_URL for the test environment
  process.env.NEXTAUTH_URL = appURL

  const context = await browser.newContext()

  const timestamp = getUnixTime(new Date())
  const email = `test-${name}-${timestamp}@playwright.com`
  const password = 'test-password' // Use standard test password

  // Create user via a test-only API endpoint using app.localhost (same domain as login)
  const request = context.request
  const createUserResponse = await request.post(`${appURL}/api/test/create-user`, {
    data: { email, password },
    headers: { 'X-Test-Environment': 'playwright' },
  })

  if (!createUserResponse.ok()) {
    const errorText = await createUserResponse.text()
    throw new Error(`Failed to create test user: ${createUserResponse.status()} ${errorText}`)
  }

  const createUserData = await createUserResponse.json()
  const userId = createUserData.userId
  
  if (!userId) {
    throw new Error(`Failed to get userId from create-user response: ${JSON.stringify(createUserData)}`)
  }

  // Простой подход: создаем test session данные напрямую без страницы
  const authResponse = await request.post(`${appURL}/api/test/auth-signin`, {
    data: { email, password, userId },
    headers: { 'X-Test-Environment': 'playwright' },
  })

  if (!authResponse.ok()) {
    const errorText = await authResponse.text()
    throw new Error(`Failed to authenticate: ${authResponse.status()} ${errorText}`)
  }

  const authData = await authResponse.json()
  console.log(`Authentication successful for user: ${authData.user.email}`)
  
  // Создаем test session cookie данные напрямую
  const sessionData = {
    user: {
      id: userId,
      email,
      name: email,
      type: 'regular'
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
  
  const cookieValue = JSON.stringify(sessionData)
  console.log(`${name} email: ${email}`)
  
  // Создаем новый контекст с test session cookie в заголовках
  await context.request.dispose()
  const newContext = await browser.newContext({
    baseURL: appURL,
    extraHTTPHeaders: {
      'Cookie': `test-session-fallback=${encodeURIComponent(cookieValue)}`,
      'X-Test-Environment': 'playwright',
    },
  })
  const authenticatedRequest = newContext.request

  return {
    context,
    request: authenticatedRequest,
    email,
    password,
  }
}

export const apiTest = baseTest.extend<APIFixtures>({
  // Use the 'page' fixture which has access to the correct baseURL
  adaContext: async ({ browser, page }, use, workerInfo) => {
    const baseURL = (page.context() as any)._options.baseURL // Get baseURL from the test context
    if (!baseURL) throw new Error('baseURL is not available in the test context.')
    const ada = await createAPIAuthenticatedContext({
      browser,
      baseURL,
      name: `ada-${workerInfo.workerIndex}`,
    })
    await use(ada)
    await ada.context.close()
  },

  babbageContext: async ({ browser, page }, use, workerInfo) => {
    const baseURL = (page.context() as any)._options.baseURL
    if (!baseURL) throw new Error('baseURL is not available in the test context.')
    const babbage = await createAPIAuthenticatedContext({
      browser,
      baseURL,
      name: `babbage-${workerInfo.workerIndex}`,
    })
    await use(babbage)
    await babbage.context.close()
  },

  curieContext: async ({ browser, page }, use, workerInfo) => {
    const baseURL = (page.context() as any)._options.baseURL
    if (!baseURL) throw new Error('baseURL is not available in the test context.')
    const curie = await createAPIAuthenticatedContext({
      browser,
      baseURL,
      name: `curie-${workerInfo.workerIndex}`,
    })
    await use(curie)
    await curie.context.close()
  },
})

export const expect = baseExpect

// END OF: tests/api-fixtures.ts
