/**
 * @file tests/unit/mocks/auth.ts
 * @description Мок для системы аутентификации NextAuth.js в unit тестах
 * @version 1.0.0
 * @date 2025-06-20
 * @purpose ПОСТОЯННЫЙ - для мокирования auth в API route тестах
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Создан для поддержки unit тестирования API routes с аутентификацией
 */

import { vi } from 'vitest'

// Типы для мок сессии
export interface MockUser {
  id: string
  email: string
  name?: string
}

export interface MockSession {
  user: MockUser
  expires: string
}

// Создаем мок функции auth
export const mockAuth = vi.fn()

// Создаем мок функции getTestSession  
export const mockGetTestSession = vi.fn()

// Утилита для установки аутентифицированного пользователя
export function setAuthenticatedUser(user: MockUser): void {
  const mockSession: MockSession = {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
  }
  mockAuth.mockResolvedValue(mockSession)
  mockGetTestSession.mockResolvedValue(null) // Test session не используется
}

// Утилита для установки тестового пользователя
export function setTestUser(user: MockUser): void {
  const mockSession: MockSession = {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
  mockAuth.mockResolvedValue(null) // Auth session не используется
  mockGetTestSession.mockResolvedValue(mockSession)
}

// Утилита для установки неаутентифицированного пользователя
export function setUnauthenticatedUser(): void {
  mockAuth.mockResolvedValue(null)
  mockGetTestSession.mockResolvedValue(null)
}

// Сброс всех моков
export function resetAuthMocks(): void {
  mockAuth.mockReset()
  mockGetTestSession.mockReset()
}

// Экспорт для замены в vi.mock
export const auth = mockAuth
export const getTestSession = mockGetTestSession

// END OF: tests/unit/mocks/auth.ts