/**
 * @file tests/integration/setup.ts
 * @description Setup для integration тестов - загрузка моков для внешних зависимостей
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Created integration setup with selective mocking
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Created integration setup - мокируем только внешние API, БД остается реальной
 */

import { vi } from 'vitest'

// Mock внешних сервисов (не БД!)
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://mock-blob-url.com/test' }),
  del: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue({ blobs: [] })
}))

// Mock AI сервисов
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn().mockReturnValue({
    generativeAI: vi.fn()
  })
}))

// Mock сетевых запросов fetch (если нужно)
vi.mock('node:fetch', () => ({
  default: vi.fn()
}))

// Mock процессов OS (если Phoenix тесты используют)
vi.mock('node:child_process', () => ({
  exec: vi.fn((cmd, callback) => callback(null, 'mocked output', '')),
  spawn: vi.fn().mockReturnValue({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event, callback) => {
      if (event === 'close') callback(0)
    })
  })
}))

console.log('🧪 Integration tests setup completed - external services mocked, DB real')

// END OF: tests/integration/setup.ts