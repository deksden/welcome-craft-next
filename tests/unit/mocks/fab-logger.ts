/**
 * @file tests/unit/mocks/fab-logger.ts
 * @description Мок для библиотеки @fab33/fab-logger.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для изоляции тестов от реальной системы логирования.
 * @version 0.1.0
 */

/** HISTORY:
 * v0.1.0 (2025-06-13): Начальная версия мока с пустыми функциями.
 */

import { vi } from 'vitest'

// Мокируем функцию createLogger, чтобы она возвращала объект с мок-функциями
export const createLogger = vi.fn().mockReturnValue({
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(), // .child() возвращает тот же мок-логгер
})

// END OF: tests/unit/mocks/fab-logger.ts
