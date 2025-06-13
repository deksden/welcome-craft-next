/**
 * @file vitest.config.ts
 * @description Конфигурация для тестового фреймворка Vitest.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для настройки и запуска юнит-тестов.
 * @version 0.4.0
 */

/** HISTORY:
 * v0.4.0 (2025-06-13): Добавлен alias для мокирования @fab33/fab-logger.
 * v0.3.0 (2025-06-13): Добавлен alias для мокирования пакета 'server-only'.
 * v0.2.0 (2025-06-13): Заменен vitest-tsconfig-paths на vite-tsconfig-paths для исправления ошибки TS7016.
 * v0.1.0 (2025-06-13): Начальная конфигурация с поддержкой tsconfig-paths и jsdom.
 */

import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: [],
    alias: {
      // Мокируем 'server-only' для предотвращения ошибок в тестах
      'server-only': path.resolve(__dirname, 'tests/unit/mocks/server-only.ts'),
      // Мокируем логгер для изоляции
      '@fab33/fab-logger': path.resolve(
        __dirname,
        'tests/unit/mocks/fab-logger.ts',
      ),
    },
  },
})

// END OF: vitest.config.ts
