/**
 * @file lib/artifact-content-utils-client.ts
 * @description CLIENT-SAFE версия artifact-content-utils для исправления BUG-025
 * @version 1.0.0
 * @date 2025-06-23
 * @updated Создано для исправления server-only imports в client components
 */

import type { Artifact as ArtifactSchema } from '@/lib/db/schema'
import type { Artifact as ArtifactClient } from '@/lib/db/types'
import type { ArtifactApiResponse } from '@/lib/types'

/**
 * CLIENT-SAFE: Преобразует артефакт из БД в унифицированный формат для API
 * НЕ загружает контент - использует существующие данные или делает API вызов
 */
export function normalizeArtifactForAPI(dbArtifact: ArtifactSchema | ArtifactClient): ArtifactApiResponse {
  // CLIENT-SAFE: Возвращаем базовую структуру без server-side загрузки контента
  // Контент будет загружен отдельно через SWR/API вызовы
  
  // Handle both schema (snake_case) and client (camelCase) naming conventions
  const worldId = 'worldId' in dbArtifact ? dbArtifact.worldId : (dbArtifact as any).world_id
  const publicationState = 'publicationState' in dbArtifact 
    ? dbArtifact.publicationState 
    : (dbArtifact as any).publication_state || []
  
  return {
    id: dbArtifact.id,
    kind: dbArtifact.kind,
    title: dbArtifact.title,
    content: '', // Пустой контент, загружается отдельно
    createdAt: typeof dbArtifact.createdAt === 'string' 
      ? new Date(dbArtifact.createdAt) 
      : dbArtifact.createdAt,
    userId: dbArtifact.userId,
    authorId: dbArtifact.authorId || null,
    deletedAt: dbArtifact.deletedAt || null,
    summary: dbArtifact.summary || '',
    worldId: worldId || null,
    publicationState: publicationState
  }
}

/**
 * CLIENT-SAFE: Эмуляция getDisplayContent для совместимости
 */
export function getDisplayContent(artifact: ArtifactSchema): string {
  // CLIENT-SAFE: Возвращаем пустую строку, контент загружается через API
  return ''
}