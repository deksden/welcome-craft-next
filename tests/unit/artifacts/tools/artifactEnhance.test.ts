/**
 * @file tests/unit/artifacts/tools/artifactEnhance.test.ts
 * @description Юнит-тесты для AI-инструмента artifactEnhance.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики улучшения артефактов.
 * @version 0.2.0
 */

/** HISTORY:
 * v0.2.0 (2025-06-13): Исправлена ошибка TS2554: добавлен второй аргумент в execute.
 * v0.1.0 (2025-06-13): Начальный тест для успешного улучшения.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactEnhance } from '@/artifacts/tools/artifactEnhance'
import { getArtifactById, saveArtifact, saveSuggestions } from '@/lib/db/queries'
import { streamObject } from 'ai'
import type { Session } from 'next-auth'
import type { Artifact } from '@/lib/db/schema'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'

vi.mock('@/lib/db/queries', () => ({
  getArtifactById: vi.fn(),
  saveArtifact: vi.fn(),
  saveSuggestions: vi.fn(),
}))

vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>()
  return {
    ...original,
    streamObject: vi.fn(),
  }
})

describe('AI Tool - artifactEnhance', () => {
  const mockSession: Session = { user: { id: 'test-user-123' } } as Session
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
      publication_state: [],
    },
    totalVersions: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(streamObject).mockResolvedValue({
      object: Promise.resolve({
        suggestions: [
          { originalSentence: 'test', suggestedSentence: 'test!', description: 'add emphasis' }
        ]
      })
    } as any)
  })

  it('should successfully enhance an artifact', async () => {
    const args = { id: 'existing-artifact-id', recipe: 'suggest' as const }
    vi.mocked(getArtifactById).mockResolvedValue(mockExistingArtifact)

    const enhanceTool = artifactEnhance({ session: mockSession })
    const result = await enhanceTool.execute(args, {
      toolCallId: 'test-id',
      messages: [],
    })

    if ('error' in result) {
      throw new Error(`Expected success, but got error: ${result.error}`)
    }

    expect(getArtifactById).toHaveBeenCalledTimes(1)
    expect(saveArtifact).toHaveBeenCalledTimes(1) // Creates a new version
    expect(streamObject).toHaveBeenCalledTimes(1)
    expect(saveSuggestions).toHaveBeenCalledTimes(1)
    expect(vi.mocked(saveSuggestions).mock.calls[0][0].suggestions).toHaveLength(1)

    expect(result.toolName).toBe(AI_TOOL_NAMES.ARTIFACT_ENHANCE)
    expect(result.version).toBe(2)
    expect(result.description).toContain('Applied recipe "suggest"')
  })
})

// END OF: tests/unit/artifacts/tools/artifactEnhance.test.ts
