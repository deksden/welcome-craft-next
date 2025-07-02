import { expect as baseExpect, test as baseTest, type BrowserContext, type APIRequestContext } from '@playwright/test';
import { universalAuthentication, type AuthUser } from './helpers/auth.helper';
import { TestUtils } from './helpers/test-utils';
// AI Fixtures system automatically handles mocking - no manual imports needed

// Define UserContext based on what universalAuthentication provides and what tests might need.
// Note: universalAuthentication does not directly return a password, as it's fixed ('test-password')
// and used internally during the creation/authentication process.
export interface UserContext {
  context: BrowserContext; // The browser context, useful for page operations if needed later
  request: APIRequestContext; // The API request context, authenticated
  email: string; // User's email
  userId: string; // User's ID
  // password is not directly part of this context as it's used internally by universalAuthentication
}

interface Fixtures {
  adaContext: UserContext;
  babbageContext: UserContext;
  curieContext: UserContext;
  testUtils: TestUtils;
  // AI Fixtures system handles mocking automatically
}

const createAuthenticatedApiContext = async (
  browser: any, // Playwright's Browser type
  userNamePrefix: string,
  workerInfo: any, // Playwright's WorkerInfo type
  userType?: 'user' | 'admin' // Optional user type for universalAuthentication
): Promise<UserContext> => {
  const browserContext = await browser.newContext({ baseURL: 'http://localhost:3000' }); // Ensure baseURL matches your app
  const uniqueId = crypto.randomUUID();
  const testUser: AuthUser = {
    email: `${userNamePrefix}-${workerInfo.workerIndex}-${Date.now()}@test.com`,
    id: uniqueId, // Provide a UUID for the user
    type: userType || 'user',
  };

  // universalAuthentication for APIRequestContext does not navigate or use Page
  // It directly makes API calls to create user and sign in.
  await universalAuthentication(browserContext.request, testUser, { skipNavigation: true });

  return {
    context: browserContext,
    request: browserContext.request,
    email: testUser.email,
    userId: testUser.id ?? '', // id is assigned crypto.randomUUID() before calling universalAuthentication.
                          // universalAuthentication also ensures user.id is set if it was initially missing,
                          // based on the response from /api/test/create-user.
                          // So, testUser.id is guaranteed to be a string here.
  };
};

export const test = baseTest.extend<Fixtures>({
  adaContext: async ({ browser }, use, workerInfo) => {
    const ada = await createAuthenticatedApiContext(browser, 'ada', workerInfo);
    await use(ada);
    await ada.context.close();
  },

  babbageContext: async ({ browser }, use, workerInfo) => {
    const babbage = await createAuthenticatedApiContext(browser, 'babbage', workerInfo);
    await use(babbage);
    await babbage.context.close();
  },

  curieContext: async ({ browser }, use, workerInfo) => {
    // Assuming curie might need special handling or is an admin, for example.
    // If 'chatModel' was significant, that logic needs to be re-evaluated
    // as universalAuthentication doesn't handle 'chatModel'.
    // For now, treating curie as a regular user. If admin rights are needed, pass 'admin' as userType.
    const curie = await createAuthenticatedApiContext(browser, 'curie', workerInfo);
    await use(curie);
    await curie.context.close();
  },

  testUtils: async ({ page }, use) => {
    const testUtils = new TestUtils(page);
    await use(testUtils);
  },
});

export const expect = baseExpect;
