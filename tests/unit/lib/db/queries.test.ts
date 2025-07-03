/**
 * @file tests/unit/lib/db/queries.test.ts
 * @description UC-10 SCHEMA-DRIVEN CMS - Юнит-тесты для функций запросов к базе данных под новой архитектурой.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики `lib/db/queries.ts` с учетом специализированных таблиц артефактов.
 * @version 2.0.0
 */

/** HISTORY:
 * v2.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Переписано под новую схему БД со специализированными таблицами артефактов. Обновлены тесты getArtifactById для работы с диспетчером artifact-tools.
 * v1.0.0 (2025-06-18): TASK-03 ЭТАП 3 ЗАВЕРШЕН - добавлены полные тесты для getUser, getChatById, getArtifactById, saveMessages.
 * v0.3.0 (2025-06-13): Исправлена проверка вызова where на более надежную.
 * v0.2.0 (2025-06-13): Исправлен подход к мокированию через vi.mock('@/lib/db').
 * v0.1.0 (2025-06-13): Начальный тест для функции getChatsByUserId с моком Drizzle.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { 
  getChatsByUserId,
  getUser,
  getChatById,
  getArtifactById,
  saveMessages
} from '@/lib/db/queries'
import { db } from '@/lib/db'
import { chat, user, message } from '@/lib/db/schema'
import { desc, } from 'drizzle-orm'

// Мокируем модуль, экспортирующий 'db', чтобы контролировать его поведение
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
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

  /**
   * @description Тестирует основную функциональность получения чатов пользователя с пагинацией
   * @feature Использует limit + 1 для определения hasMore (наличие следующих страниц)
   * @feature Поддерживает world isolation через worldContext параметр
   * @feature Возвращает объект { chats: Chat[], hasMore: boolean } вместо простого массива
   */
  it('should call db methods with correct parameters and return chats', async () => {
    const mockChats = [
      { id: 'chat1', title: 'Chat 1', createdAt: new Date(), userId: 'user-123', published_until: null, deletedAt: null, world_id: null },
      { id: 'chat2', title: 'Chat 2', createdAt: new Date(), userId: 'user-123', published_until: null, deletedAt: null, world_id: null },
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

  /**
   * @description Тестирует логику пагинации и определения hasMore флага
   * @feature При получении limit + 1 записей, hasMore = true и возвращается только limit записей
   */
  it('should correctly handle pagination with hasMore = true', async () => {
    const mockChats = Array.from({ length: 11 }, (_, i) => ({
      id: `chat${i}`,
      title: `Chat ${i}`,
      createdAt: new Date(),
      userId: 'user-123',
      published_until: null,
      deletedAt: null,
      world_id: null,
      embedding: null
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

  /**
   * @description Тестирует поведение при отсутствии чатов у пользователя
   * @feature Возвращает пустой массив и hasMore = false при отсутствии данных
   */
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

describe('Database Queries - getUser', () => {
  let queryChainMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    queryChainMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // По умолчанию возвращаем пустой массив
    }
    mockedDb.select.mockReturnValue(queryChainMock)
  })

  /**
   * @description Тестирует получение пользователя по email адресу
   * @feature Функция принимает email (не ID!) как параметр
   * @feature Возвращает массив пользователей (хотя обычно один элемент)
   */
  it('should return user array when found', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      createdAt: new Date(),
      world_id: null,
      embedding: null
    }
    queryChainMock.where.mockResolvedValue([mockUser])

    const result = await getUser('test@example.com')

    expect(mockedDb.select).toHaveBeenCalled()
    expect(queryChainMock.from).toHaveBeenCalledWith(user)
    expect(queryChainMock.where).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockUser])
  })

  /**
   * @description Тестирует поведение при отсутствии пользователя с данным email
   * @feature Возвращает пустой массив (не undefined) при отсутствии пользователя
   */
  it('should return empty array when user not found', async () => {
    queryChainMock.where.mockResolvedValue([])

    const result = await getUser('non-existent@example.com')

    expect(result).toEqual([])
  })
})

describe('Database Queries - getChatById', () => {
  let queryChainMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    queryChainMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // По умолчанию возвращаем пустой массив
    }
    mockedDb.select.mockReturnValue(queryChainMock)
  })

  /**
   * @description Тестирует получение чата по ID с проверкой на мягкое удаление
   * @feature Функция принимает объект { id: string }, а не просто строку
   * @feature Автоматически фильтрует мягко удаленные чаты (deletedAt IS NULL)
   * @feature Возвращает первый элемент массива (деструктуризация [selectedChat])
   */
  it('should return chat when found', async () => {
    const mockChat = {
      id: 'chat-123',
      title: 'Test Chat',
      createdAt: new Date(),
      userId: 'user-123',
      published_until: null,
      deletedAt: null,
      world_id: null,
      embedding: null
    }
    queryChainMock.where.mockResolvedValue([mockChat])

    const result = await getChatById({ id: 'chat-123' })

    expect(mockedDb.select).toHaveBeenCalled()
    expect(queryChainMock.from).toHaveBeenCalledWith(chat)
    expect(queryChainMock.where).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockChat)
  })

  /**
   * @description Тестирует поведение при отсутствии чата или если чат мягко удален
   * @feature Возвращает undefined при отсутствии чата (деструктуризация пустого массива)
   */
  it('should return undefined when chat not found', async () => {
    queryChainMock.where.mockResolvedValue([])

    const result = await getChatById({ id: 'non-existent-chat' })

    expect(result).toBeUndefined()
  })
})

describe('Database Queries - getArtifactById', () => {
  let queryChainMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Мокируем полную цепочку для getArtifactsById (внутренний запрос)
    queryChainMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    }
    mockedDb.select.mockReturnValue(queryChainMock)
  })

  /**
   * @description Тестирует получение артефакта по ID с подсчетом общего количества версий
   * @feature Функция не делает прямых запросов к БД, а использует getArtifactsById 
   * @feature Возвращает последнюю версию по умолчанию, или конкретную версию по номеру/timestamp
   * @feature Подсчитывает общее количества версий для данного ID артефакта
   */
  it('should return artifact with version count when found', async () => {
    const mockArtifacts = [
      {
        id: 'artifact-123',
        title: 'Test Artifact v1',
        kind: 'text',
        // UC-10: Sparse columns удалены из основной таблицы Artifact
        createdAt: new Date('2025-06-14'),
        userId: 'user-123',
        authorId: 'user-123',
        deletedAt: null,
        summary: 'Version 1',
        publication_state: [],
        world_id: null,
      embedding: null
      },
      {
        id: 'artifact-123',
        title: 'Test Artifact v2',
        kind: 'text',
        content_text: 'Version 2 content',
        content_url: null,
        content_site_definition: null,
        createdAt: new Date('2025-06-15'),
        userId: 'user-123',
        authorId: 'user-123',
        deletedAt: null,
        summary: 'Version 2',
        publication_state: [],
        world_id: null,
      embedding: null
      }
    ]

    // Мокируем getArtifactsById чтобы вернуть наши тестовые данные
    queryChainMock.orderBy.mockResolvedValue(mockArtifacts)

    const result = await getArtifactById({
      id: 'artifact-123',
      version: null,
      versionTimestamp: null
    })

    expect(result).toEqual({
      doc: mockArtifacts[1], // Последняя версия (версия 2)
      totalVersions: 2
    })
  })

  /**
   * @description Тестирует поведение при отсутствии артефакта
   * @feature Возвращает undefined если артефакт не найден
   */
  it('should return undefined when artifact not found', async () => {
    queryChainMock.orderBy.mockResolvedValue([])

    const result = await getArtifactById({
      id: 'non-existent-artifact',
      version: null,
      versionTimestamp: null
    })

    expect(result).toBeUndefined()
  })

  /**
   * @description Тестирует получение конкретной версии по timestamp
   * @feature Ищет версию с точно совпадающим timestamp в миллисекундах
   */
  it('should handle specific version by timestamp', async () => {
    const v1Date = new Date('2025-06-14T10:00:00.000Z')
    const v2Date = new Date('2025-06-15T10:00:00.000Z')
    
    const mockArtifacts = [
      {
        id: 'artifact-123',
        title: 'Test Artifact v1',
        kind: 'text',
        // UC-10: Sparse columns удалены из основной таблицы Artifact
        createdAt: v1Date,
        userId: 'user-123',
        authorId: 'user-123',
        deletedAt: null,
        summary: 'Version 1',
        publication_state: [],
        world_id: null,
      embedding: null
      },
      {
        id: 'artifact-123',
        title: 'Test Artifact v2',
        kind: 'text',
        content_text: 'Version 2 content',
        content_url: null,
        content_site_definition: null,
        createdAt: v2Date,
        userId: 'user-123',
        authorId: 'user-123',
        deletedAt: null,
        summary: 'Version 2',
        publication_state: [],
        world_id: null,
      embedding: null
      }
    ]

    queryChainMock.orderBy.mockResolvedValue(mockArtifacts)

    const result = await getArtifactById({
      id: 'artifact-123',
      version: null,
      versionTimestamp: v1Date
    })

    expect(result).toEqual({
      doc: mockArtifacts[0], // Первая версия по timestamp
      totalVersions: 2
    })
  })

  /**
   * @description Тестирует получение конкретной версии по номеру
   * @feature Версии нумеруются от 1, но массив с индексом от 0
   */
  it('should handle specific version by number', async () => {
    const mockArtifacts = [
      {
        id: 'artifact-123',
        title: 'Test Artifact v1',
        kind: 'text',
        // UC-10: Sparse columns удалены из основной таблицы Artifact
        createdAt: new Date('2025-06-14'),
        userId: 'user-123',
        authorId: 'user-123',
        deletedAt: null,
        summary: 'Version 1',
        publication_state: [],
        world_id: null,
      embedding: null
      },
      {
        id: 'artifact-123',
        title: 'Test Artifact v2',
        kind: 'text',
        content_text: 'Version 2 content',
        content_url: null,
        content_site_definition: null,
        createdAt: new Date('2025-06-15'),
        userId: 'user-123',
        authorId: 'user-123',
        deletedAt: null,
        summary: 'Version 2',
        publication_state: [],
        world_id: null,
      embedding: null
      }
    ]

    queryChainMock.orderBy.mockResolvedValue(mockArtifacts)

    const result = await getArtifactById({
      id: 'artifact-123',
      version: 1, // Запрашиваем версию 1 (индекс 0 в массиве)
      versionTimestamp: null
    })

    expect(result).toEqual({
      doc: mockArtifacts[0], // Первая версия 
      totalVersions: 2
    })
  })
})

describe('Database Queries - saveMessages', () => {
  let insertChainMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    insertChainMock = {
      values: vi.fn().mockReturnThis(),
    }
    ;(mockedDb.insert as any).mockReturnValue(insertChainMock)
  })

  /**
   * @description Тестирует сохранение массива сообщений в базу данных
   * @feature Функция принимает объект { messages: Array<DBMessage> }, а не просто массив
   * @feature Использует простой INSERT без onConflictDoNothing (в отличие от других функций)
   */
  it('should save messages to database', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        parts: [{ type: 'text', text: 'Hello' }],
        attachments: [],
        chatId: 'chat-123',
        createdAt: new Date('2025-06-18T10:00:00Z'),
        world_id: null,
      embedding: null
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        parts: [{ type: 'text', text: 'Hi there!' }],
        attachments: [],
        chatId: 'chat-123',
        createdAt: new Date('2025-06-18T10:01:00Z'),
        world_id: null,
      embedding: null
      }
    ]

    await saveMessages({ messages: mockMessages })

    // Проверяем, что была вызвана корректная цепочка методов
    expect(mockedDb.insert).toHaveBeenCalledWith(message)
    expect(insertChainMock.values).toHaveBeenCalledWith(mockMessages)
  })

  /**
   * @description Тестирует обработку пустого массива сообщений
   * @feature Должен корректно обрабатывать пустой массив без ошибок
   */
  it('should handle empty messages array', async () => {
    await saveMessages({ messages: [] })

    expect(mockedDb.insert).toHaveBeenCalledWith(message)
    expect(insertChainMock.values).toHaveBeenCalledWith([])
  })

  /**
   * @description Тестирует сохранение сложных сообщений с parts и attachments
   * @feature Поддерживает сложные структуры данных: tool-invocation, attachments, world_id
   */
  it('should save messages with complex parts and attachments', async () => {
    const mockMessages = [
      {
        id: 'msg-complex',
        role: 'user',
        content: 'Text with attachment',
        parts: [
          { type: 'text', text: 'Check this out:' },
          { type: 'tool-invocation', toolInvocation: { toolName: 'artifactCreate', toolCallId: 'call-123', state: 'result' } }
        ],
        attachments: [{ name: 'file.pdf', url: 'blob://123' }],
        chatId: 'chat-456',
        createdAt: new Date('2025-06-18T11:00:00Z'),
        world_id: 'test-world'
      }
    ]

    await saveMessages({ messages: mockMessages })

    expect(insertChainMock.values).toHaveBeenCalledWith(mockMessages)
  })
})

// END OF: tests/unit/lib/db/queries.test.ts
