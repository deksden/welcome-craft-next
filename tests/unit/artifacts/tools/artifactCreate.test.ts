/**
 * @file tests/unit/artifacts/tools/artifactCreate.test.ts
 * @description Юнит-тесты для AI-инструмента artifactCreate.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики создания артефактов.
 * @version 0.3.0
 */

/** HISTORY:
 * v0.3.0 (2025-06-13): Исправлена ошибка TS2551. Заменен test.fail на throw new Error.
 * v0.2.0 (2025-06-13): Исправлены ошибки типизации (TS2339) через type narrowing.
 * v0.1.0 (2025-06-13): Начальные тесты для успешного создания и обработки ошибок.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactCreate } from '@/artifacts/tools/artifactCreate'
import { saveArtifact } from '@/lib/db/queries'
import { artifactTools } from '@/artifacts/kinds/artifact-tools'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'
import { generateUUID } from '@/lib/utils'
import { createLogger } from '@fab33/fab-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import type { Session } from 'next-auth'

const logger = createLogger('test:artifactCreate')

// --- Мокирование зависимостей ---

vi.mock('@/lib/db/queries', () => ({
  saveArtifact: vi.fn(),
}))

vi.mock('@/lib/ai/summarizer', () => ({
  generateAndSaveSummary: vi.fn(),
}))

vi.mock('@/lib/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>()
  return {
    ...original,
    generateUUID: vi.fn(),
  }
})

// Мокируем только реестр инструментов, а не весь модуль
vi.mock('@/artifacts/kinds/artifact-tools', () => ({
  artifactTools: [
    {
      kind: 'text',
      create: vi.fn().mockResolvedValue('Сгенерированный AI контент'),
    },
  ],
}))

// --- Тесты ---

describe('AI Tool - artifactCreate', () => {
  const mockSession: Session = {
    user: { id: 'test-user-123', email: 'test@test.com', type: 'regular' },
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

    // 1. Проверяем вызовы моков
    const textToolHandler = (artifactTools as any[]).find(t => t.kind === 'text')
    expect(textToolHandler.create).toHaveBeenCalledTimes(1)
    expect(saveArtifact).toHaveBeenCalledTimes(1)
    expect(generateAndSaveSummary).toHaveBeenCalledTimes(1)

    // 2. Проверяем аргументы вызова saveArtifact
    const saveArtifactArgs = vi.mocked(saveArtifact).mock.calls[0][0]
    expect(saveArtifactArgs.id).toBe('mock-uuid-12345')
    expect(saveArtifactArgs.title).toBe(args.title)
    expect(saveArtifactArgs.kind).toBe(args.kind)
    expect(saveArtifactArgs.userId).toBe(mockSession.user?.id)
    expect(saveArtifactArgs.content).toBe('Сгенерированный AI контент')

    // 3. Проверяем структуру возвращаемого объекта
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

    // 2. Убедимся, что никакие важные операции не были вызваны
    expect(saveArtifact).not.toHaveBeenCalled()
    expect(generateAndSaveSummary).not.toHaveBeenCalled()
  })
})

// END OF: tests/unit/artifacts/tools/artifactCreate.test.ts
