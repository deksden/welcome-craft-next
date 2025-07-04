/**
 * @file tests/unit/artifacts/tools/artifactContent.test.ts
 * @description Юнит-тесты для AI-инструмента artifactContent.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики получения контента артефакта.
 * @version 0.2.0
 */

/** HISTORY:
 * v0.2.0 (2025-06-13): Исправлена ошибка TS2554: добавлен второй аргумент в execute.
 * v0.1.0 (2025-06-13): Начальный тест для успешного получения контента.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactContent } from '@/artifacts/tools/artifactContent'
import { getArtifactById } from '@/lib/db/queries'
import { getDisplayContent } from '@/lib/artifact-content-utils'
import type { Artifact } from '@/lib/db/schema'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
// Simple mock artifact helper instead of UC-08 artifact-factory

vi.mock('@/lib/db/queries', () => ({
  getArtifactById: vi.fn(),
}))

vi.mock('@/lib/artifact-content-utils', () => ({
  getDisplayContent: vi.fn(),
}))

describe('AI Tool - artifactContent', () => {
  const mockExistingArtifact: { doc: Artifact; totalVersions: number } = {
    doc: {
      id: 'existing-artifact-id',
      title: 'Тестовый документ',
      kind: 'text',
      // UC-10: Sparse columns удалены из основной таблицы Artifact
      userId: 'test-user-123',
      authorId: 'test-user-123',
      summary: 'Тест',
      createdAt: new Date(),
      deletedAt: null,
      publication_state: [],
      world_id: null,
    },
    totalVersions: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully retrieve artifact content', async () => {
    const args = { artifactId: 'existing-artifact-id', version: 1 }
    vi.mocked(getArtifactById).mockResolvedValue(mockExistingArtifact)
    vi.mocked(getDisplayContent).mockReturnValue('Это тестовый контент.')

    const result = await artifactContent.execute(args, {
      toolCallId: 'test-id',
      messages: [],
    })

    expect(getArtifactById).toHaveBeenCalledTimes(1)
    expect(getArtifactById).toHaveBeenCalledWith({ id: args.artifactId, version: args.version })

    if ('error' in result) {
      throw new Error(`Expected success, but got error: ${result.error}`)
    }

    expect(result.toolName).toBe(AI_TOOL_NAMES.ARTIFACT_CONTENT)
    expect(result.artifactId).toBe(mockExistingArtifact.doc.id)
    expect(result.content).toBe('Это тестовый контент.')
    expect(result.version).toBe(1)
    expect(result.totalVersions).toBe(1)
  })
})

// END OF: tests/unit/artifacts/tools/artifactContent.test.ts
