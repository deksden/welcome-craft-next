/**
 * @file tests/unit/artifacts/tools/artifactUpdate.test.ts
 * @description Юнит-тесты для AI-инструмента artifactUpdate.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики обновления артефактов.
 * @version 0.2.0
 */

/** HISTORY:
 * v0.2.0 (2025-06-13): Обновлен тест на проверку прав доступа.
 * v0.1.0 (2025-06-13): Начальные тесты для успешного обновления и обработки ошибок.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactUpdate } from '@/artifacts/tools/artifactUpdate'
import { getArtifactById, saveArtifact } from '@/lib/db/queries'
import { artifactTools } from '@/artifacts/kinds/artifact-tools'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'
import { createLogger } from '@fab33/fab-logger'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import type { Session } from 'next-auth'
import type { Artifact } from '@/lib/db/schema'

const logger = createLogger('test:artifactUpdate')

// --- Мокирование зависимостей ---

vi.mock('@/lib/db/queries', () => ({
  getArtifactById: vi.fn(),
  saveArtifact: vi.fn(),
}))

vi.mock('@/lib/ai/summarizer', () => ({
  generateAndSaveSummary: vi.fn(),
}))

vi.mock('@/artifacts/kinds/artifact-tools', () => ({
  artifactTools: [
    {
      kind: 'text',
      update: vi.fn().mockResolvedValue('Обновленный контент'),
    },
  ],
}))

// --- Тесты ---

describe('AI Tool - artifactUpdate', () => {
  const mockSession: Session = {
    user: { id: 'test-user-123', email: 'test@test.com', type: 'regular' },
    expires: new Date(Date.now() + 86400 * 1000).toISOString(),
  }

  const mockExistingArtifact: { doc: Artifact; totalVersions: number } = {
    doc: {
      id: 'existing-artifact-id',
      title: 'Старый заголовок',
      kind: 'text',
      content_text: 'старый контент',
      content_url: null,
      content_site_definition: null,
      userId: 'test-user-123',
      createdAt: new Date(),
      authorId: 'test-user-123',
      deletedAt: null,
      summary: 'старое саммари',
    },
    totalVersions: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully update a text artifact', async () => {
    const args = {
      id: 'existing-artifact-id',
      prompt: 'Сделай этот текст более формальным',
    }
    logger.trace({ test: 'artifactUpdate-happy-path', session: mockSession, args }, 'Preparing test data')
    vi.mocked(getArtifactById).mockResolvedValue(mockExistingArtifact)

    const updateTool = artifactUpdate({ session: mockSession })
    const result = await updateTool.execute(args, {
      toolCallId: 'test-tool-call-id-update',
      messages: [],
    })

    logger.info({ result }, 'artifactUpdate.execute returned result')

    if ('error' in result) {
      throw new Error(`Expected success, but got error: ${result.error}`)
    }

    // 1. Проверяем вызовы моков
    expect(getArtifactById).toHaveBeenCalledTimes(1)
    const textToolHandler = (artifactTools as any[]).find(t => t.kind === 'text')
    expect(textToolHandler.update).toHaveBeenCalledTimes(1)
    expect(saveArtifact).toHaveBeenCalledTimes(1)
    expect(generateAndSaveSummary).toHaveBeenCalledTimes(1)

    // 2. Проверяем аргументы вызова saveArtifact
    const saveArgs = vi.mocked(saveArtifact).mock.calls[0][0]
    expect(saveArgs.id).toBe('existing-artifact-id')
    expect(saveArgs.content).toBe('Обновленный контент')
    expect(saveArgs.userId).toBe(mockSession.user?.id)

    // 3. Проверяем структуру возвращаемого объекта
    expect(result.toolName).toBe(AI_TOOL_NAMES.ARTIFACT_UPDATE)
    expect(result.artifactId).toBe('existing-artifact-id')
    expect(result.version).toBe(2)
    expect(result.totalVersions).toBe(2)
    expect(result.description).toContain('has been updated')
  })

  it('should return an error if artifact does not exist', async () => {
    const args = { id: 'non-existent-id', prompt: '... ' }
    logger.trace({ test: 'artifactUpdate-not-found' }, 'Preparing test data')
    vi.mocked(getArtifactById).mockResolvedValue(undefined)

    const updateTool = artifactUpdate({ session: mockSession })
    const result = await updateTool.execute(args, {
      toolCallId: 'test-tool-call-id-notfound',
      messages: [],
    })

    logger.info({ result }, 'artifactUpdate.execute returned result for non-existent artifact')

    expect('error' in result).toBe(true)
    if (!('error' in result)) {
      throw new Error('Expected error result, but got success')
    }
    expect(result.error).toContain('not found or you do not have permission to update it.')

    // Проверяем, что лишние вызовы не были сделаны
    expect(saveArtifact).not.toHaveBeenCalled()
    const textToolHandler = (artifactTools as any[]).find(t => t.kind === 'text')
    expect(textToolHandler.update).not.toHaveBeenCalled()
  })

  it('should return an error if user tries to update another user\'s artifact', async () => {
    const foreignArtifact = {
      ...mockExistingArtifact,
      doc: { ...mockExistingArtifact.doc, userId: 'another-user-id' }
    }
    const args = { id: 'existing-artifact-id', prompt: '... ' }
    logger.trace({ test: 'artifactUpdate-permission-denied' }, 'Preparing test data')
    vi.mocked(getArtifactById).mockResolvedValue(foreignArtifact)

    const updateTool = artifactUpdate({ session: mockSession })
    const result = await updateTool.execute(args, {
      toolCallId: 'test-tool-call-id-forbidden',
      messages: [],
    })

    logger.info({ result }, 'artifactUpdate.execute returned result for permission denied')

    expect('error' in result).toBe(true)
    if (!('error' in result)) {
      throw new Error('Expected error result, but got success')
    }
    expect(result.error).toContain('not found or you do not have permission to update it.')

    const textToolHandler = (artifactTools as any[]).find(t => t.kind === 'text')
    expect(textToolHandler.update).not.toHaveBeenCalled()
    expect(saveArtifact).not.toHaveBeenCalled()
  })
})

// END OF: tests/unit/artifacts/tools/artifactUpdate.test.ts
