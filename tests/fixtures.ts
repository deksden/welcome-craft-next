import { expect as baseExpect, test as baseTest } from '@playwright/test';
import { createAuthenticatedContext, type UserContext } from './helpers';
import { getUnixTime } from 'date-fns';
import { TestUtils } from './helpers/test-utils';
import { AIMockHelper } from './helpers/ai-mock';

interface Fixtures {
  adaContext: UserContext;
  babbageContext: UserContext;
  curieContext: UserContext;
  testUtils: TestUtils;
  aiMock: typeof AIMockHelper;
}

export const test = baseTest.extend<Fixtures>({
  adaContext: [
    async ({ browser }, use, workerInfo) => {
      const ada = await createAuthenticatedContext({
        browser,
        name: `ada-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(ada);
      await ada.context.close();
    },
    { scope: 'worker' },
  ],
  babbageContext: [
    async ({ browser }, use, workerInfo) => {
      const babbage = await createAuthenticatedContext({
        browser,
        name: `babbage-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
      });

      await use(babbage);
      await babbage.context.close();
    },
    { scope: 'worker' },
  ],
  curieContext: [
    async ({ browser }, use, workerInfo) => {
      const curie = await createAuthenticatedContext({
        browser,
        name: `curie-${workerInfo.workerIndex}-${getUnixTime(new Date())}`,
        chatModel: 'chat-model-reasoning',
      });

      await use(curie);
      await curie.context.close();
    },
    { scope: 'worker' },
  ],
  
  testUtils: async ({ page }, use) => {
    const testUtils = new TestUtils(page);
    await use(testUtils);
  },
  
  aiMock: async ({}, use) => {
    await use(AIMockHelper);
  },
});

export const expect = baseExpect;
