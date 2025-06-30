/**
 * @file vitest.integration.config.ts
 * @description Vitest configuration for integration tests with ephemeral database
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Created integration test configuration with ephemeral DB setup
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Created Vitest config for integration tests with ephemeral DB
 */

import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'node',
    setupFiles: ['tests/integration/setup.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    testTimeout: 30000, // 30s для integration тестов
    hookTimeout: 30000,
    teardownTimeout: 30000,
    poolOptions: {
      threads: {
        singleThread: true // Один поток для стабильности БД
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})

// END OF: vitest.integration.config.ts