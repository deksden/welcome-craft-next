/**
 * @file lib/publication-utils.ts
 * @description Утилиты для работы с системой публикации артефактов и чатов (server-only).
 * @version 1.2.0
 * @date 2025-06-20
 * @updated Fixed BUG-017: Added public access logic for artifacts used in published sites.
 */

/** HISTORY:
 * v1.2.0 (2025-06-20): Fixed BUG-017: Added isArtifactUsedInPublishedSites и isArtifactPubliclyAccessible functions.
 * v1.1.0 (2025-06-18): Добавлен server-only импорт для исправления client component ошибки.
 * v1.0.0 (2025-06-17): Создание helper utilities для проверки статуса публикации и загрузки данных.
 */

import 'server-only'
import { notFound } from 'next/navigation.js'
import { inArray, eq } from 'drizzle-orm'
import type { Artifact, Chat } from '@/lib/db/schema'
import type { PublicationInfo } from '@/lib/types'
import { artifact } from '@/lib/db/schema'
import { db } from '@/lib/db'

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

  // 3. UC-10 SCHEMA-DRIVEN CMS: Load site definition from A_Site table
  let siteDefinition: any
  try {
    const { loadSiteArtifact } = await import('@/artifacts/kinds/site/server')
    const siteData = await loadSiteArtifact(siteId, siteArtifact.createdAt)
    if (!siteData?.siteDefinition) {
      notFound()
    }
    siteDefinition = siteData.siteDefinition
  } catch (error) {
    console.error('Failed to load site definition:', error)
    notFound()
  }

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
      // UC-10 TODO: Replace with artifact-tools.loadArtifact() 
      // For now return empty content during transition
      artifactContents.set(art.id, '')
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

/**
 * @description Проверяет, используется ли артефакт в каком-либо опубликованном сайте
 * @param artifactId ID артефакта для проверки
 * @returns Promise<boolean> true если артефакт используется в опубликованном сайте
 * @feature Публичный доступ через опубликованные сайты
 */
export async function isArtifactUsedInPublishedSites(artifactId: string): Promise<boolean> {
  // Находим все опубликованные сайты
  const publishedSites = await db
    .select()
    .from(artifact)
    .where(eq(artifact.kind, 'site'))

  const now = new Date()
  
  for (const siteArtifact of publishedSites) {
    // Проверяем что сайт опубликован
    if (!isSitePublished(siteArtifact as Artifact)) {
      continue
    }

    // UC-10 SCHEMA-DRIVEN CMS: Load site definition from A_Site table
    try {
      const { loadSiteArtifact } = await import('@/artifacts/kinds/site/server')
      const siteData = await loadSiteArtifact(siteArtifact.id, siteArtifact.createdAt)
      if (!siteData?.siteDefinition) {
        continue
      }
      const siteDefinition = siteData.siteDefinition as any
      
      if (siteDefinition?.blocks && Array.isArray(siteDefinition.blocks)) {
        for (const block of siteDefinition.blocks) {
          if (block.slots && typeof block.slots === 'object') {
            for (const slot of Object.values(block.slots)) {
              if (slot && typeof slot === 'object' && 'artifactId' in slot) {
                const slotArtifactId = (slot as any).artifactId
                if (slotArtifactId === artifactId) {
                  console.log(`🔍 Artifact ${artifactId} found in published site ${siteArtifact.id}`)
                  return true
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load site definition for ${siteArtifact.id}:`, error)
      continue
    }
  }

  return false
}

/**
 * @description Расширенная проверка доступности артефакта для публичного доступа
 * @param artifact Артефакт для проверки
 * @returns Promise<boolean> true если артефакт доступен публично
 * @feature Комбинированная проверка: прямая публикация ИЛИ использование в опубликованном сайте
 */
export async function isArtifactPubliclyAccessible(artifact: Artifact): Promise<boolean> {
  // 1. Прямая публикация артефакта
  if (isArtifactPublished(artifact)) {
    return true
  }

  // 2. Использование в опубликованном сайте
  return await isArtifactUsedInPublishedSites(artifact.id)
}

// END OF: lib/publication-utils.ts