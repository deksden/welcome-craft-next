/**
 * @file tests/unit/artifacts/tools/artifactDelete.test.ts
 * @description Юнит-тесты для AI-инструмента artifactDelete.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики мягкого удаления.
 * @version 0.2.0
 */

/** HISTORY:
 * v0.2.0 (2025-06-13): Исправлена ошибка TS2554: добавлен второй аргумент в execute.
 * v0.1.0 (2025-06-13): Начальный тест для успешного удаления артефакта.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactDelete } from '@/artifacts/tools/artifactDelete'
import { deleteArtifactSoftById, getArtifactById } from '@/lib/db/queries'
import type { Session } from 'next-auth'
import type { Artifact } from '@/lib/db/schema'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'

vi.mock('@/lib/db/queries', () => ({
  getArtifactById: vi.fn(),
  deleteArtifactSoftById: vi.fn(),
}))

describe('AI Tool - artifactDelete', () => {
  const mockSession: Session = {
    user: { id: 'test-user-123' },
  } as Session

  const mockExistingArtifact: { doc: Artifact; totalVersions: number } = {
    doc: {
      id: 'existing-artifact-id',
      title: 'Артефакт для удаления',
      kind: 'text',
      content: '...',
      userId: 'test-user-123',
      createdAt: new Date(),
      authorId: 'test-user-123',
      deletedAt: null,
      summary: '...',
    },
    totalVersions: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully soft-delete an artifact', async () => {
    const args = { id: 'existing-artifact-id' }
    vi.mocked(getArtifactById).mockResolvedValue(mockExistingArtifact)
    vi.mocked(deleteArtifactSoftById).mockResolvedValue({} as any)

    const deleteTool = artifactDelete({ session: mockSession })
    const result = await deleteTool.execute(args, {
      toolCallId: 'test-id',
      messages: [],
    })

    expect(getArtifactById).toHaveBeenCalledTimes(1)
    expect(deleteArtifactSoftById).toHaveBeenCalledTimes(1)
    expect(deleteArtifactSoftById).toHaveBeenCalledWith({
      artifactId: args.id,
      userId: mockSession.user.id,
    })

    if ('error' in result) {
      throw new Error(`Expected success, but got error: ${result.error}`)
    }

    expect(result.toolName).toBe(AI_TOOL_NAMES.ARTIFACT_DELETE)
    expect(result.artifactId).toBe(args.id)
    expect(result.description).toContain('moved to the trash')
  })
})

// END OF: tests/unit/artifacts/tools/artifactDelete.test.ts
