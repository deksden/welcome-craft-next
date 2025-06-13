/**
 * @file tests/unit/lib/db/queries.test.ts
 * @description Юнит-тесты для функций запросов к базе данных.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики `lib/db/queries.ts`.
 * @version 0.3.0
 */

/** HISTORY:
 * v0.3.0 (2025-06-13): Исправлена проверка вызова where на более надежную.
 * v0.2.0 (2025-06-13): Исправлен подход к мокированию через vi.mock('@/lib/db').
 * v0.1.0 (2025-06-13): Начальный тест для функции getChatsByUserId с моком Drizzle.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getChatsByUserId } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { chat } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

// Мокируем модуль, экспортирующий 'db', чтобы контролировать его поведение
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

// Типизированный мок для db
const mockedDb = vi.mocked(db)

describe('Database Queries - getChatsByUserId', () => {
  let queryChainMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Настраиваем полную цепочку моков для Drizzle
    queryChainMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // По умолчанию возвращаем пустой массив
    }
    mockedDb.select.mockReturnValue(queryChainMock)
  })

  it('should call db methods with correct parameters and return chats', async () => {
    const mockChats = [
      { id: 'chat1', title: 'Chat 1', createdAt: new Date() },
      { id: 'chat2', title: 'Chat 2', createdAt: new Date() },
    ]
    // Настраиваем, что вернет финальный вызов в цепочке
    queryChainMock.limit.mockResolvedValue(mockChats)

    const userId = 'user-123'
    const result = await getChatsByUserId({
      id: userId,
      limit: 10,
      startingAfter: null,
      endingBefore: null,
    })

    // 1. Проверяем, что цепочка вызовов была инициирована
    expect(mockedDb.select).toHaveBeenCalled()
    expect(queryChainMock.from).toHaveBeenCalledWith(chat)

    // 2. Проверяем, что `.where` был вызван
    expect(queryChainMock.where).toHaveBeenCalledTimes(1)

    // 3. Проверяем сортировку
    expect(queryChainMock.orderBy).toHaveBeenCalledWith(desc(chat.createdAt))

    // 4. Проверяем лимит (limit + 1 для проверки hasMore)
    expect(queryChainMock.limit).toHaveBeenCalledWith(11)

    // 5. Проверяем финальный результат
    expect(result.chats).toEqual(mockChats)
    expect(result.hasMore).toBe(false)
  })

  it('should correctly handle pagination with hasMore = true', async () => {
    const mockChats = Array.from({ length: 11 }, (_, i) => ({
      id: `chat${i}`,
      title: `Chat ${i}`,
      createdAt: new Date(),
    }))
    queryChainMock.limit.mockResolvedValue(mockChats)

    const result = await getChatsByUserId({
      id: 'user-123',
      limit: 10,
      startingAfter: null,
      endingBefore: null,
    })

    expect(result.hasMore).toBe(true)
    expect(result.chats).toHaveLength(10)
    expect(result.chats[0]).toEqual(mockChats[0])
  })

  it('should return an empty array and hasMore = false if no chats are found', async () => {
    queryChainMock.limit.mockResolvedValue([])

    const result = await getChatsByUserId({
      id: 'user-not-found',
      limit: 10,
      startingAfter: null,
      endingBefore: null,
    })

    expect(result.chats).toEqual([])
    expect(result.hasMore).toBe(false)
  })
})

// END OF: tests/unit/lib/db/queries.test.ts
