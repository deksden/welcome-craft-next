/**
 * @file tests/unit/artifacts/tools/artifactCreate.test.ts
 * @description UC-10 SCHEMA-DRIVEN CMS - Юнит-тесты для AI-инструмента artifactCreate под новой архитектурой.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики создания артефактов с диспетчером artifact-tools.
 * @version 2.0.0
 */

/** HISTORY:
 * v2.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Переписано под новую архитектуру с artifact-tools диспетчером. Мокирование saveArtifact функции вместо старых separate tools.
 * v0.3.0 (2025-06-13): Исправлена ошибка TS2551. Заменен test.fail на throw new Error.
 * v0.2.0 (2025-06-13): Исправлены ошибки типизации (TS2339) через type narrowing.
 * v0.1.0 (2025-06-13): Начальные тесты для успешного создания и обработки ошибок.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactCreate } from '@/artifacts/tools/artifactCreate'
import { saveArtifact as dbSaveArtifact } from '@/lib/db/queries'
import { saveArtifact as artifactSaverDispatcher } from '@/artifacts/kinds/artifact-tools'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'
import { generateUUID } from '@/lib/utils'
import { createLogger } from '@fab33/fab-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import type { Session } from 'next-auth'

const logger = createLogger('test:artifactCreate')

// --- UC-10 SCHEMA-DRIVEN CMS: Мокирование зависимостей под новую архитектуру ---

// Мокируем старую функцию сохранения (в lib/db/queries)
vi.mock('@/lib/db/queries', () => ({
  saveArtifact: vi.fn(),
}))

// Мокируем новый диспетчер artifact-tools
vi.mock('@/artifacts/kinds/artifact-tools', () => ({
  saveArtifact: vi.fn().mockResolvedValue(undefined),
  artifactTools: [
    { 
      kind: 'text', 
      create: vi.fn().mockResolvedValue('Generated text content'),
      save: vi.fn()
    },
    { 
      kind: 'code', 
      create: vi.fn().mockResolvedValue('Generated code content'),
      save: vi.fn()
    }
  ]
}))

vi.mock('@/lib/ai/summarizer', () => ({
  generateAndSaveSummary: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>()
  return {
    ...original,
    generateUUID: vi.fn(),
  }
})

// UC-10: Мокируем AI генераторы (заменяем старые artifact-tools)
vi.mock('@/lib/ai/content-generators', () => ({
  generateTextContent: vi.fn().mockResolvedValue('Сгенерированный AI текст'),
  generateCodeContent: vi.fn().mockResolvedValue('console.log("Hello, World!");'),
  generateImageContent: vi.fn().mockResolvedValue('https://example.com/generated-image.jpg'),
}))

// --- Тесты ---

describe('AI Tool - artifactCreate', () => {
  const mockSession: Session = {
    user: { id: 'test-user-123', email: 'test@test.com', type: 'user' },
    expires: new Date(Date.now() + 86400 * 1000).toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateUUID).mockReturnValue('mock-uuid-12345')
  })

  it('should successfully create a text artifact (happy path)', async () => {
    const args = {
      title: 'Тестовый артефакт',
      kind: 'text' as const,
      prompt: 'Напиши тестовый текст',
    }
    
    // UC-10: Настраиваем мок для dbSaveArtifact чтобы возвращал массив артефактов
    const mockSavedArtifact = {
      id: 'mock-uuid-12345',
      title: args.title,
      kind: args.kind,
      userId: mockSession.user?.id,
      authorId: null,
      createdAt: new Date(),
      summary: null as any, // Allow null for testing
      deletedAt: null,
      publication_state: [],
      world_id: null
    }
    vi.mocked(dbSaveArtifact).mockResolvedValue([mockSavedArtifact])
    
    logger.trace({ test: 'artifactCreate-happy-path', session: mockSession, args }, 'Preparing test data')

    const createTool = artifactCreate({ session: mockSession })
    const result = await createTool.execute(args, {
      toolCallId: 'test-tool-call-id',
      messages: [],
    })

    logger.info({ result }, 'artifactCreate.execute returned result')

    // Проверяем, что результат не содержит ошибки (type guard)
    if ('error' in result) {
      throw new Error(`Expected success, but got error: ${result.error}`)
    }

    // 1. UC-10: Проверяем вызовы новых моков
    expect(dbSaveArtifact).toHaveBeenCalledTimes(1) // Сохранение в основную таблицу Artifact
    expect(artifactSaverDispatcher).toHaveBeenCalledTimes(1) // Сохранение через диспетчер
    expect(generateAndSaveSummary).toHaveBeenCalledTimes(1)

    // 2. UC-10: Проверяем аргументы вызова основного сохранения
    const dbSaveArgs = vi.mocked(dbSaveArtifact).mock.calls[0][0]
    expect(dbSaveArgs.id).toBe('mock-uuid-12345')
    expect(dbSaveArgs.title).toBe(args.title)
    expect(dbSaveArgs.kind).toBe(args.kind)
    expect(dbSaveArgs.userId).toBe(mockSession.user?.id)
    
    // 3. UC-10: Проверяем аргументы вызова диспетчера
    const saverArgs = vi.mocked(artifactSaverDispatcher).mock.calls[0]
    const saverArtifact = saverArgs[0]
    expect(saverArtifact.id).toBe('mock-uuid-12345') // ID артефакта совпадает
    expect(saverArtifact.title).toBe(args.title) // Заголовок артефакта совпадает
    expect(saverArtifact.kind).toBe(args.kind) // Тип артефакта совпадает
    expect(saverArgs[1]).toBe('Generated text content') // Контент для специализированной таблицы

    // 4. UC-10: Проверяем структуру возвращаемого объекта (остается той же)
    expect(result.toolName).toBe(AI_TOOL_NAMES.ARTIFACT_CREATE)
    expect(result.artifactId).toBe('mock-uuid-12345')
    expect(result.artifactKind).toBe('text')
    expect(result.description).toContain(`A new text artifact titled "${args.title}" was created.`)
    expect(result.version).toBe(1)
    expect(result.totalVersions).toBe(1)
    expect(result.summary).toBeNull()
  })

  it('should return an error for an unsupported artifact kind', async () => {
    const args = {
      title: 'Тестовое видео',
      kind: 'video' as any, // Используем as any для тестирования невалидного значения
      prompt: 'Создай видео',
    }
    logger.trace({ test: 'artifactCreate-unsupported-kind', session: mockSession, args }, 'Preparing test data')

    const createTool = artifactCreate({ session: mockSession })
    const result = await createTool.execute(args, {
      toolCallId: 'test-tool-call-id',
      messages: [],
    })

    logger.info({ result }, 'artifactCreate.execute returned result')

    // 1. Проверяем, что вернулась ошибка (type guard)
    expect('error' in result).toBe(true)
    if (!('error' in result)) {
      throw new Error('Expected error result, but got success')
    }
    expect(result.error).toContain('Create operation for artifact of kind \'video\' is not supported.')

    // 2. UC-10: Убедимся, что никакие важные операции не были вызваны
    expect(dbSaveArtifact).not.toHaveBeenCalled() // Основное сохранение
    expect(artifactSaverDispatcher).not.toHaveBeenCalled() // Диспетчер
    expect(generateAndSaveSummary).not.toHaveBeenCalled()
  })
})

// END OF: tests/unit/artifacts/tools/artifactCreate.test.ts
