/**
 * @file tests/unit/artifacts/tools/artifactRestore.test.ts
 * @description Юнит-тесты для AI-инструмента artifactRestore.
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ПОСТОЯННЫЙ - для тестирования логики восстановления артефакта.
 * @version 0.2.0
 */

/** HISTORY:
 * v0.2.0 (2025-06-13): Исправлена ошибка TS2554: добавлен второй аргумент в execute.
 * v0.1.0 (2025-06-13): Начальный тест для успешного восстановления.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { artifactRestore } from '@/artifacts/tools/artifactRestore'
import { getArtifactById, restoreArtifactById } from '@/lib/db/queries'
import type { Session } from 'next-auth'
import type { Artifact } from '@/lib/db/schema'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'

vi.mock('@/lib/db/queries', () => ({
  getArtifactById: vi.fn(),
  restoreArtifactById: vi.fn(),
}))

describe('AI Tool - artifactRestore', () => {
  const mockSession: Session = {
    user: { id: 'test-user-123' },
  } as Session

  const mockRestoredArtifact: { doc: Artifact; totalVersions: number } = {
    doc: {
      id: 'existing-artifact-id',
      title: 'Восстановленный артефакт',
      kind: 'text',
      content_text: '...',
      content_url: null,
      content_site_definition: null,
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

  it('should successfully restore a soft-deleted artifact', async () => {
    const args = { id: 'existing-artifact-id' }
    vi.mocked(restoreArtifactById).mockResolvedValue({} as any)
    vi.mocked(getArtifactById).mockResolvedValue(mockRestoredArtifact)

    const restoreTool = artifactRestore({ session: mockSession })
    const result = await restoreTool.execute(args, {
      toolCallId: 'test-id',
      messages: [],
    })

    expect(restoreArtifactById).toHaveBeenCalledTimes(1)
    expect(restoreArtifactById).toHaveBeenCalledWith({
      artifactId: args.id,
      userId: mockSession.user.id,
    })

    if ('error' in result) {
      throw new Error(`Expected success, but got error: ${result.error}`)
    }

    expect(result.toolName).toBe(AI_TOOL_NAMES.ARTIFACT_RESTORE)
    expect(result.artifactId).toBe(args.id)
    expect(result.description).toContain('has been restored')
  })
})

// END OF: tests/unit/artifacts/tools/artifactRestore.test.ts
