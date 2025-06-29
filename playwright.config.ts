/**
 * @file playwright.config.ts
 * @description Playwright test configuration with a unified "local-prod" testing mode.
 * @version 7.0.0
 * @date 2025-06-27
 */

import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
import { createServer } from 'node:http';
import { getTestUrls, getTestHeaders, getChromeConfig, logTestConfig } from './tests/helpers/test-config';

// 1. Загружаем переменные окружения. .env.test будет иметь приоритет.
dotenvConfig({ path: '.env.test' });
dotenvConfig({ path: '.env.local' });

/**
 * Finds an available port to run the server on.
 * @param basePort The starting port number.
 * @returns A promise that resolves to an available port number.
 */
function findAvailablePort(basePort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        server.close();
        resolve(findAvailablePort(basePort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(basePort, () => {
      server.close(() => {
        resolve(basePort);
      });
    });
  });
}

/**
 * Gets the port to use for testing.
 * Uses PLAYWRIGHT_PORT environment variable if set, otherwise finds an available port.
 */
async function getPort(): Promise<number> {
  if (process.env.PLAYWRIGHT_PORT) {
    const envPort = Number.parseInt(process.env.PLAYWRIGHT_PORT, 10);
    if (!Number.isNaN(envPort)) {
      console.log(`🔧 Using port ${envPort} from PLAYWRIGHT_PORT environment variable`);
      return envPort;
    }
  }
  
  const port = await findAvailablePort(3000);
  console.log(`🔧 Found available port ${port}`);
  
  // Set the environment variable so child processes use the same port
  process.env.PLAYWRIGHT_PORT = port.toString();
  
  return port;
}

export default (async () => {
  const port = await getPort();
  const isCI = !!process.env.CI;
  
  // Упрощенная логика таймаутов
  if (isCI) {
    process.env.PLAYWRIGHT_TIMEOUT_NAVIGATION = process.env.PLAYWRIGHT_TIMEOUT_NAVIGATION || '45000';
    process.env.PLAYWRIGHT_TIMEOUT_ELEMENT = process.env.PLAYWRIGHT_TIMEOUT_ELEMENT || '20000';
    console.log('⏱️ Using CI timeouts (45s navigation, 20s elements)');
  } else {
    process.env.PLAYWRIGHT_TIMEOUT_NAVIGATION = process.env.PLAYWRIGHT_TIMEOUT_NAVIGATION || '15000';
    process.env.PLAYWRIGHT_TIMEOUT_ELEMENT = process.env.PLAYWRIGHT_TIMEOUT_ELEMENT || '8000';
    console.log('⏱️ Using Local Production timeouts (15s navigation, 8s elements)');
  }

  const urls = getTestUrls();
  const headers = getTestHeaders();
  const chromeConfig = getChromeConfig();
  
  logTestConfig();

  return defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? '50%' : undefined,
    reporter: process.env.CI ? [['html'], ['github'], ['json', { outputFile: 'test-results.json' }]] : 'html',

    // ✅ Интеграция с эфемерной БД
    globalSetup: './tests/global-setup.ts',
    globalTeardown: './tests/global-teardown.ts',

    use: {
      baseURL: urls.publicBase,
      trace: 'retain-on-failure',
      extraHTTPHeaders: headers,
    },

    timeout: 60 * 1000,
    expect: {
      timeout: 30 * 1000,
    },

    projects: [
      {
        name: 'e2e',
        testMatch: /e2e\/.*.test.ts/,
        use: {
          ...devices['Desktop Chrome'],
          baseURL: urls.adminBase,
          launchOptions: chromeConfig,
        },
      },
      {
        name: 'routes',
        testMatch: /routes\/.*.test.ts/,
        use: {
          ...devices['Desktop Chrome'],
          baseURL: urls.publicBase,
        },
      },
    ],

    // 2. Безусловный запуск продакшн-сборки для всех тестов
    webServer: {
      command: `pnpm build && bash scripts/start-silent-server.sh pnpm start --port ${port}`,
      url: urls.ping,
      // 3. Увеличенный таймаут для сборки
      timeout: 180 * 1000, 
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      // 4. Подавление debug логов от webpack плагинов
      env: {
        ...process.env,
        DEBUG: '',
        WEBPACK_LOGGING: 'false',
        NEXT_TELEMETRY_DISABLED: '1',
        // Специально отключаем jsconfig-paths debug логи
        'DEBUG_COLORS': 'false',
        NODE_OPTIONS: '--no-deprecation',
      },
    },
  });
})();