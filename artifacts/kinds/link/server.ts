/**
 * @file artifacts/kinds/link/server.ts
 * @description Серверный обработчик для артефактов типа "ссылка".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Spectrum SCHEMA-DRIVEN CMS - Создан новый тип артефакта для ссылок с метаданными.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactLink } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactLink } from '@/lib/db/schema'
import type { ArtifactLinkData } from '@/lib/types'
import type { Session } from 'next-auth'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const logger = createLogger('artifacts:kinds:link:server')

// =============================================================================
// Zod Schema for AI Generation
// =============================================================================

const LinkSchema = z.object({
  title: z.string().describe('Название ссылки'),
  url: z.string().describe('URL адрес'),
  description: z.string().describe('Описание ресурса'),
  category: z.string().optional().describe('Категория ссылки'),
  iconName: z.string().optional().describe('Название иконки')
})

// =============================================================================
// AI OPERATION: Create Link
// =============================================================================

/**
 * @description AI-генерация ссылки на основе промпта пользователя
 * @param props - Параметры создания (id, title, prompt, session)
 * @returns Promise<string> - JSON строка с данными ссылки
 */
export async function createLinkArtifact(props: {
  id: string;
  title: string;
  prompt: string;
  session: Session;
}): Promise<string> {
  const childLogger = logger.child({ artifactId: props.id, kind: 'link' })
  
  try {
    childLogger.info({ prompt: props.prompt }, 'AI создание ссылки')
    
    const result = await generateObject({
      model: google('gemini-1.5-flash'),
      system: `Ты - эксперт по созданию полезных ссылок для корпоративного онбординга.
      Создай структурированную ссылку на основе запроса пользователя.
      
      Правила:
      - Создай реалистичный URL (может быть example.com для демо)
      - Добавь краткое описание того, что пользователь найдет по ссылке
      - Используй подходящую категорию
      - Убедись что название ясно описывает ресурс`,
      prompt: `Создай ссылку на ресурс: ${props.prompt}`,
      schema: LinkSchema
    })
    
    const linkData = {
      title: result.object.title,
      url: result.object.url,
      description: result.object.description,
      category: result.object.category || 'Resource',
      iconName: result.object.iconName || 'link'
    }
    
    childLogger.info({ 
      title: linkData.title,
      url: linkData.url,
      category: linkData.category
    }, 'Ссылка успешно создана AI')
    
    return JSON.stringify(linkData)
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Ошибка AI создания ссылки')
    
    throw error
  }
}

// =============================================================================
// Spectrum SCHEMA-DRIVEN CMS: Функции для работы с A_Link таблицей
// =============================================================================

export async function saveLinkArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let linkData: ArtifactLinkData
    
    try {
      linkData = { ...JSON.parse(content), ...metadata }
    } catch {
      // Используем content как URL
      linkData = {
        url: content || 'https://example.com',
        title: artifact.title,
        ...metadata
      }
    }
    
    if (!linkData.url || !linkData.title) {
      throw new Error('Link URL and title are required')
    }
    
    childLogger.info({ 
      url: linkData.url,
      title: linkData.title,
      category: linkData.category,
      isInternal: linkData.isInternal
    }, 'Saving link artifact to A_Link table')
    
    await db.insert(artifactLink).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      url: linkData.url,
      title: linkData.title,
      description: linkData.description,
      category: linkData.category,
      iconUrl: linkData.iconUrl,
      isInternal: linkData.isInternal || false
    }).onConflictDoUpdate({
      target: [artifactLink.artifactId, artifactLink.createdAt],
      set: {
        url: linkData.url,
        title: linkData.title,
        description: linkData.description,
        category: linkData.category,
        iconUrl: linkData.iconUrl,
        isInternal: linkData.isInternal || false,
        updatedAt: new Date()
      }
    })
    
    childLogger.info('Link artifact saved successfully to A_Link table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to save link artifact to A_Link table')
    throw error
  }
}

export async function loadLinkArtifact(artifactId: string, createdAt: Date): Promise<ArtifactLink | null> {
  const result = await db.select().from(artifactLink)
    .where(and(
      eq(artifactLink.artifactId, artifactId),
      eq(artifactLink.createdAt, createdAt)
    ))
    .limit(1)
  return result[0] || null
}

export async function deleteLinkArtifact(artifactId: string, createdAt: Date): Promise<void> {
  await db.delete(artifactLink)
    .where(and(
      eq(artifactLink.artifactId, artifactId),
      eq(artifactLink.createdAt, createdAt)
    ))
}

/**
 * @description Link artifact tool с поддержкой AI + Spectrum schema-driven операций
 * @feature AI create + save/load/delete операции
 */
export const linkTool = {
  kind: 'link' as const,
  // AI операции
  create: createLinkArtifact,
  // Spectrum Schema-Driven операции
  save: saveLinkArtifact,
  load: loadLinkArtifact,
  delete: deleteLinkArtifact,
}

// END OF: artifacts/kinds/link/server.ts