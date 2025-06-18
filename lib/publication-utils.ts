/**
 * @file lib/publication-utils.ts
 * @description Утилиты для работы с системой публикации артефактов и чатов (server-only).
 * @version 1.1.0
 * @date 2025-06-18
 * @updated Добавлен server-only импорт для изоляции от клиентских компонентов.
 */

/** HISTORY:
 * v1.1.0 (2025-06-18): Добавлен server-only импорт для исправления client component ошибки.
 * v1.0.0 (2025-06-17): Создание helper utilities для проверки статуса публикации и загрузки данных.
 */

import 'server-only'
import { notFound } from 'next/navigation'
import { inArray, eq } from 'drizzle-orm'
import type { Artifact, Chat } from '@/lib/db/types'
import type { PublicationInfo } from '@/lib/types'
import { artifact } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { getDisplayContent } from '@/lib/artifact-content-utils'

/**
 * @description Проверяет, опубликован ли артефакт из любого источника
 * @param artifact Объект артефакта для проверки
 * @returns true если артефакт имеет активную публикацию
 * @feature Система публикации с поддержкой TTL
 */
export function isArtifactPublished(artifact: Artifact): boolean {
  if (!artifact.publication_state || artifact.publication_state.length === 0) {
    return false
  }

  const now = new Date()
  
  return artifact.publication_state.some((publication: PublicationInfo) => {
    // Если expiresAt null - публикация бессрочная
    if (publication.expiresAt === null) {
      return true
    }
    
    // Проверяем что публикация еще не истекла
    const expirationDate = new Date(publication.expiresAt)
    return expirationDate > now
  })
}

/**
 * @description Проверяет, опубликован ли сайт именно как сайт (не через чат)
 * @param siteArtifact Артефакт сайта для проверки
 * @returns true если сайт опубликован как сайт
 * @feature Система публикации с поддержкой TTL
 */
export function isSitePublished(siteArtifact: Artifact): boolean {
  if (siteArtifact.kind !== 'site' || !siteArtifact.publication_state) {
    return false
  }

  const now = new Date()
  
  return siteArtifact.publication_state.some((publication: PublicationInfo) => {
    // Проверяем что это публикация именно как сайт
    if (publication.source !== 'site') {
      return false
    }
    
    // Если expiresAt null - публикация бессрочная
    if (publication.expiresAt === null) {
      return true
    }
    
    // Проверяем что публикация еще не истекла
    const expirationDate = new Date(publication.expiresAt)
    return expirationDate > now
  })
}

/**
 * @description Проверяет, опубликован ли чат (TTL проверка)
 * @param chat Объект чата для проверки
 * @returns true если чат опубликован и срок не истек
 * @feature Система публикации с поддержкой TTL
 */
export function isChatPublished(chat: Chat): boolean {
  if (!chat.published_until) {
    return false
  }

  const now = new Date()
  return chat.published_until > now
}

/**
 * @description Структура данных для рендеринга публичного сайта
 */
export interface PublishedSiteData {
  siteArtifact: Artifact
  artifactContents: Map<string, string> // artifactId -> content
  siteDefinition: any // Parsed site definition
}

/**
 * @description Безопасная загрузка всех данных для рендеринга публичного сайта
 * @param siteId ID артефакта сайта
 * @returns Данные сайта или throws notFound()
 * @throws notFound() если сайт не найден или не опубликован
 * @feature Система публикации с поддержкой TTL
 */
export async function fetchPublishedSiteData(siteId: string): Promise<PublishedSiteData> {
  // 1. Получить артефакт сайта
  const siteResult = await db
    .select()
    .from(artifact)
    .where(eq(artifact.id, siteId))
    .orderBy(artifact.createdAt)
    .limit(1)

  if (siteResult.length === 0) {
    notFound()
  }

  const siteArtifact = siteResult[0] as Artifact

  // 2. Проверить что это сайт и он опубликован
  if (!isSitePublished(siteArtifact)) {
    notFound()
  }

  // 3. Распарсить site definition
  if (!siteArtifact.content_site_definition) {
    notFound()
  }

  const siteDefinition = siteArtifact.content_site_definition

  // 4. Собрать все artifact IDs из блоков сайта
  const artifactIds: string[] = []
  
  if (siteDefinition && typeof siteDefinition === 'object' && 'blocks' in siteDefinition) {
    const blocks = siteDefinition.blocks as any[]
    
    for (const block of blocks) {
      if (block.slots && typeof block.slots === 'object') {
        for (const slot of Object.values(block.slots)) {
          if (slot && typeof slot === 'object' && 'artifactId' in slot) {
            const artifactId = (slot as any).artifactId
            if (artifactId && !artifactIds.includes(artifactId)) {
              artifactIds.push(artifactId)
            }
          }
        }
      }
    }
  }

  // 5. Единый запрос для загрузки всех нужных артефактов
  const artifactContents = new Map<string, string>()
  
  if (artifactIds.length > 0) {
    const artifacts = await db
      .select()
      .from(artifact)
      .where(inArray(artifact.id, artifactIds))

    for (const art of artifacts) {
      const content = getDisplayContent(art as Artifact)
      artifactContents.set(art.id, content)
    }
  }

  return {
    siteArtifact,
    artifactContents,
    siteDefinition
  }
}

/**
 * @description Получает все активные публикации артефакта
 * @param artifact Артефакт для анализа
 * @returns Массив активных публикаций
 * @feature Система публикации с поддержкой TTL
 */
export function getActivePublications(artifact: Artifact): PublicationInfo[] {
  if (!artifact.publication_state) {
    return []
  }

  const now = new Date()
  
  return artifact.publication_state.filter((publication: PublicationInfo) => {
    // Если expiresAt null - публикация бессрочная
    if (publication.expiresAt === null) {
      return true
    }
    
    // Проверяем что публикация еще не истекла
    const expirationDate = new Date(publication.expiresAt)
    return expirationDate > now
  })
}

/**
 * @description Проверяет, опубликован ли артефакт из конкретного источника
 * @param artifact Артефакт для проверки
 * @param source Источник публикации
 * @param sourceId ID источника (опционально)
 * @returns true если артефакт опубликован из указанного источника
 * @feature Система публикации с поддержкой TTL
 */
export function isArtifactPublishedFromSource(
  artifact: Artifact, 
  source: PublicationInfo['source'],
  sourceId?: string
): boolean {
  const activePublications = getActivePublications(artifact)
  
  return activePublications.some(publication => {
    if (publication.source !== source) {
      return false
    }
    
    if (sourceId && publication.sourceId !== sourceId) {
      return false
    }
    
    return true
  })
}

// END OF: lib/publication-utils.ts