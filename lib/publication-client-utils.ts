/**
 * @file lib/publication-client-utils.ts
 * @description Клиентские утилиты для работы с системой публикации (без server-only зависимостей).
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создан для разделения client/server логики публикации.
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Извлечены чистые функции проверки статуса публикации для клиентских компонентов.
 */

import type { Artifact, Chat } from '@/lib/db/types'
import type { PublicationInfo } from '@/lib/types'

/**
 * @description Проверяет, опубликован ли артефакт из любого источника (клиентская версия)
 * @param artifact Объект артефакта для проверки
 * @returns true если артефакт имеет активную публикацию
 * @feature Система публикации с поддержкой TTL
 */
export function isArtifactPublished(artifact: Artifact): boolean {
  if (!artifact.publication_state || artifact.publication_state.length === 0) {
    return false
  }

  const now = new Date()
  
  return artifact.publication_state.some((pub: PublicationInfo) => {
    // Если expiresAt null - публикация бессрочная
    if (pub.expiresAt === null) {
      return true
    }
    
    // Проверяем что публикация еще не истекла
    const expirationDate = new Date(pub.expiresAt)
    return expirationDate > now
  })
}

/**
 * @description Проверяет, опубликован ли сайт-артефакт как сайт (клиентская версия)
 * @param siteArtifact Объект сайт-артефакта для проверки
 * @returns true если сайт опубликован из источника 'site'
 * @feature Система публикации сайтов
 */
export function isSitePublished(siteArtifact: Artifact): boolean {
  if (siteArtifact.kind !== 'site') {
    return false
  }

  if (!siteArtifact.publication_state || siteArtifact.publication_state.length === 0) {
    return false
  }

  const now = new Date()
  
  return siteArtifact.publication_state.some((pub: PublicationInfo) => {
    // Проверяем что это публикация именно как сайт
    if (pub.source !== 'site') {
      return false
    }
    
    // Если expiresAt null - публикация бессрочная
    if (pub.expiresAt === null) {
      return true
    }
    
    // Проверяем что публикация еще не истекла
    const expirationDate = new Date(pub.expiresAt)
    return expirationDate > now
  })
}

/**
 * @description Проверяет, опубликован ли чат (клиентская версия)
 * @param chat Объект чата для проверки
 * @returns true если чат опубликован (published_until в будущем или null для бессрочного)
 * @feature Система публикации чатов
 */
export function isChatPublished(chat: Chat): boolean {
  if (!chat.published_until) {
    return false
  }

  const now = new Date()
  const publishedUntil = new Date(chat.published_until)
  
  return publishedUntil > now
}

/**
 * @description Получает активные публикации артефакта (клиентская версия)
 * @param artifact Объект артефакта для анализа
 * @returns Массив активных публикаций
 * @feature Система публикации с множественными источниками
 */
export function getActivePublications(artifact: Artifact): PublicationInfo[] {
  if (!artifact.publication_state || artifact.publication_state.length === 0) {
    return []
  }

  const now = new Date()
  
  return artifact.publication_state.filter((pub: PublicationInfo) => {
    // Если expiresAt null - публикация бессрочная
    if (pub.expiresAt === null) {
      return true
    }
    
    // Проверяем что публикация еще не истекла
    const expirationDate = new Date(pub.expiresAt)
    return expirationDate > now
  })
}

// END OF: lib/publication-client-utils.ts