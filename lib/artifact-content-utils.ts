/**
 * @file lib/artifact-content-utils.ts
 * @description Утилиты для работы с типизированным контентом артефактов
 * @version 1.0.0
 * @date 2025-06-16
 * @created Utilities for handling sparse content columns
 */

import type { Artifact } from '@/lib/db/schema'
import type { ArtifactKind } from '@/lib/types'

/**
 * Получает отображаемый контент из типизированных колонок артефакта
 */
export function getDisplayContent(artifact: Artifact): string {
  switch (artifact.kind) {
    case 'text':
    case 'code':
    case 'sheet':
      return artifact.content_text || ''
    
    case 'image':
      return artifact.content_url || ''
    
    case 'site':
      return artifact.content_site_definition 
        ? JSON.stringify(artifact.content_site_definition, null, 2)
        : ''
    
    default:
      return ''
  }
}

/**
 * Подготавливает данные для сохранения в соответствующую колонку
 */
export function prepareContentForSave(content: string, kind: ArtifactKind) {
  const result = {
    content_text: null as string | null,
    content_url: null as string | null,
    content_site_definition: null as any
  }

  switch (kind) {
    case 'text':
    case 'code':
    case 'sheet':
      result.content_text = content
      break
    
    case 'image':
      result.content_url = content
      break
    
    case 'site':
      try {
        result.content_site_definition = typeof content === 'string' 
          ? JSON.parse(content) 
          : content
      } catch (error) {
        console.error('Failed to parse site content as JSON:', error)
        result.content_site_definition = null
      }
      break
  }

  return result
}

/**
 * Преобразует артефакт из БД в унифицированный формат для API
 */
export function normalizeArtifactForAPI(dbArtifact: Artifact): Omit<Artifact, 'content_text' | 'content_url' | 'content_site_definition'> & { content: string } {
  const { content_text, content_url, content_site_definition, ...baseArtifact } = dbArtifact
  
  return {
    ...baseArtifact,
    content: getDisplayContent(dbArtifact)
  }
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