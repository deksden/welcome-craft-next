/**
 * @file lib/artifact-content-utils.ts
 * @description UC-10 COMPATIBILITY LAYER - Временные утилиты для совместимости со старым API во время переходного периода
 * @version 2.0.1
 * @date 2025-06-28
 * @updated BUG-043 FIX: Улучшен error handling в normalizeArtifactForAPI + добавлена отладочная информация для диагностики undefined kind
 */

import type { Artifact as ArtifactSchema } from '@/lib/db/schema'
import type { Artifact as ArtifactClient } from '@/lib/db/types'
import type { ArtifactKind, ArtifactApiResponse } from '@/lib/types'

/**
 * BACKWARD COMPATIBILITY: Эмуляция getDisplayContent для старых sparse columns
 * TODO: После завершения UC-10 удалить этот файл и заменить на artifact-tools.ts
 */
export function getDisplayContent(artifact: ArtifactSchema): string {
  // В UC-10 контент хранится в специализированных таблицах, но для совместимости
  // возвращаем пустую строку, так как actual content загружается через artifact-tools
  return ''
}

/**
 * BACKWARD COMPATIBILITY: Преобразует артефакт из БД в унифицированный формат для API
 * В UC-10 архитектуре content загружается отдельно через artifact-tools
 */
export async function normalizeArtifactForAPI(dbArtifact: ArtifactSchema | ArtifactClient): Promise<ArtifactApiResponse> {
  let content = ''
  
  try {
    // UC-10: Загружаем контент из специализированной таблицы
    const { loadArtifact } = await import('@/artifacts/kinds/artifact-tools')
    const loadedContent = await loadArtifact(dbArtifact.kind, dbArtifact.id, dbArtifact.createdAt)
    
    if (loadedContent) {
      // Для разных типов артефактов content может быть в разных полях
      switch (dbArtifact.kind) {
        case 'text':
          // textTool.load возвращает объект с полем content
          content = loadedContent.content || ''
          break
        case 'code':
          // codeTool.load возвращает строку напрямую
          content = typeof loadedContent === 'string' ? loadedContent : ''
          break
        case 'image':
          content = loadedContent.url || ''
          break
        case 'site':
          content = JSON.stringify(loadedContent.siteDefinition || {})
          break
        case 'sheet':
          content = loadedContent.content || ''
          break
        default:
          // Для новых типов артефактов пока возвращаем JSON
          content = typeof loadedContent === 'string' ? loadedContent : JSON.stringify(loadedContent)
      }
    } else {
      console.warn(`🔍 BUG-043 DEBUG: No content found for artifact ${dbArtifact.id} (${dbArtifact.kind}), but continuing with empty content`)
      content = ''
    }
  } catch (error) {
    console.error(`🔍 BUG-043 DEBUG: Error loading artifact content for ${dbArtifact.id} (${dbArtifact.kind}):`, error)
    // CRITICAL: Fallback с пустым контентом, но ОБЯЗАТЕЛЬНО сохраняем все metadata включая kind
    content = ''
  }
  
  // Handle both schema (snake_case) and client (camelCase) types
  const worldId = 'worldId' in dbArtifact ? dbArtifact.worldId : (dbArtifact as any).world_id
  const publicationState = 'publicationState' in dbArtifact ? dbArtifact.publicationState : (dbArtifact as any).publication_state || []
  
  const result = {
    id: dbArtifact.id,
    createdAt: dbArtifact.createdAt,
    title: dbArtifact.title,
    summary: dbArtifact.summary,
    kind: dbArtifact.kind,
    userId: dbArtifact.userId,
    authorId: dbArtifact.authorId,
    deletedAt: dbArtifact.deletedAt,
    worldId,
    publicationState,
    content
  }
  
  console.log(`🔍 BUG-043 DEBUG: normalizeArtifactForAPI returning:`, {
    id: result.id,
    title: result.title,
    kind: result.kind,
    hasContent: !!result.content,
    allKeys: Object.keys(result)
  })
  
  return result
}

/**
 * Валидирует контент в зависимости от типа артефакта
 */
export function validateArtifactContent(content: string, kind: ArtifactKind): {
  isValid: boolean
  error?: string
} {
  if (!content) {
    return { isValid: false, error: 'Content is required' }
  }

  switch (kind) {
    case 'text':
    case 'code':
    case 'sheet':
      return { isValid: true }
    
    case 'image':
      // Базовая валидация URL
      try {
        new URL(content)
        return { isValid: true }
      } catch {
        // Проверяем data: URL для base64 изображений
        if (content.startsWith('data:image/')) {
          return { isValid: true }
        }
        return { 
          isValid: false, 
          error: 'Image content must be a valid URL or data URI' 
        }
      }
    
    case 'site':
      try {
        JSON.parse(content)
        return { isValid: true }
      } catch {
        return { 
          isValid: false, 
          error: 'Site content must be valid JSON' 
        }
      }
    
    default:
      return { isValid: false, error: `Unknown artifact kind: ${kind}` }
  }
}