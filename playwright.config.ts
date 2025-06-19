/**
 * @file playwright.config.ts
 * @description Playwright test configuration with environment variable for consistent port detection.
 * @version 6.0.0
 * @date 2025-06-14
 */

/** HISTORY:
 * v6.0.0 (2025-06-14): Simplified approach using PLAYWRIGHT_PORT environment variable that can be set externally or defaults to available port.
 * v5.0.0 (2025-06-14): Fixed async config issue by using globalSetup and reading port from file. This ensures port is detected once and reused consistently.
 * v4.0.0 (2025-06-14): Re-implemented async config export. This is the canonical way to handle async setup in Playwright, ensuring the port is resolved once. Removed globalSetup.
 * v3.2.0 (2025-06-14): Replaced require.resolve with a simple relative path for ES Module compatibility.
 * v3.1.0 (2025-06-14): Fixed __dirname not defined in ES module scope error.
 * v3.0.0 (2025-06-14): Refactored to use globalSetup for one-time port detection.
 */

import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'
import { createServer } from 'node:http'
import { getTestUrls, getTestHeaders, getChromeConfig, logTestConfig } from './tests/helpers/test-config'

// Load environment variables from .env.local
dotenvConfig({ path: '.env.local' })

/**
 * Finds an available port to run the server on.
 * @param basePort The starting port number.
 * @returns A promise that resolves to an available port number.
 */
function findAvailablePort(basePort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        server.close()
        resolve(findAvailablePort(basePort + 1))
      } else {
        reject(err)
      }
    })
    server.listen(basePort, () => {
      server.close(() => {
        resolve(basePort)
      })
    })
  })
}

/**
 * Gets the port to use for testing.
 * Uses PLAYWRIGHT_PORT environment variable if set, otherwise finds an available port.
 */
async function getPort(): Promise<number> {
  if (process.env.PLAYWRIGHT_PORT) {
    const envPort = Number.parseInt(process.env.PLAYWRIGHT_PORT, 10)
    if (!Number.isNaN(envPort)) {
      console.log(`🔧 Using port ${envPort} from PLAYWRIGHT_PORT environment variable`)
      return envPort
    }
  }
  
  const port = await findAvailablePort(3000)
  console.log(`🔧 Found available port ${port}`)
  
  // Set the environment variable so child processes use the same port
  process.env.PLAYWRIGHT_PORT = port.toString()
  
  return port
}

export default (async () => {
  const port = await getPort()
  
  // Используем централизованную конфигурацию
  const urls = getTestUrls()
  const headers = getTestHeaders()
  const chromeConfig = getChromeConfig()
  
  // Выводим конфигурацию для отладки
  logTestConfig()

  return defineConfig({
    testDir: './tests',
    // 🚀 СИСТЕМНАЯ ОПТИМИЗАЦИЯ: Включаем полный параллелизм с изолированными мирами
    fullyParallel: true, 
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0, // Увеличиваем retries для стабильности
    // 🚀 ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ: Динамическое количество workers
    workers: process.env.CI 
      ? '50%' // В CI используем 50% от доступных ядер для экономии ресурсов
      : undefined, // Локально - автоматическое определение оптимального количества
    reporter: process.env.CI 
      ? [['html'], ['github'], ['json', { outputFile: 'test-results.json' }]]
      : 'html',
    // globalSetup: './tests/global-setup.ts', // Пока отключаем для API тестов

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
          // Используем централизованную конфигурацию Chrome
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

    webServer: {
      command: `pnpm dev --port ${port}`,
      url: urls.ping,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  })
})()
