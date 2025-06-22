/**
 * @file artifacts/kinds/faq-item/server.ts
 * @description Серверный обработчик для артефактов типа "FAQ элемент".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан новый тип артефакта для FAQ элементов.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactFaqItem } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactFaqItem } from '@/lib/db/schema'
import type { ArtifactFaqItemData } from '@/lib/types'

const logger = createLogger('artifacts:kinds:faq-item:server')

export async function saveFaqItemArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let faqData: ArtifactFaqItemData
    
    try {
      faqData = { ...JSON.parse(content), ...metadata }
    } catch {
      // Парсим из простого текста
      const lines = content.split('\n').map(line => line.trim()).filter(Boolean)
      faqData = {
        question: lines[0] || artifact.title,
        answer: lines.slice(1).join('\n') || artifact.title,
        ...metadata
      }
    }
    
    if (!faqData.question || !faqData.answer) {
      throw new Error('FAQ question and answer are required')
    }
    
    childLogger.info({ 
      question: faqData.question.substring(0, 100),
      answerLength: faqData.answer.length,
      category: faqData.category,
      priority: faqData.priority
    }, 'Saving FAQ item artifact to A_FaqItem table')
    
    await db.insert(artifactFaqItem).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category,
      priority: faqData.priority || 0,
      tags: faqData.tags || []
    }).onConflictDoUpdate({
      target: [artifactFaqItem.artifactId, artifactFaqItem.createdAt],
      set: {
        question: faqData.question,
        answer: faqData.answer,
        category: faqData.category,
        priority: faqData.priority || 0,
        tags: faqData.tags || [],
        updatedAt: new Date()
      }
    })
    
    childLogger.info('FAQ item artifact saved successfully to A_FaqItem table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to save FAQ item artifact to A_FaqItem table')
    throw error
  }
}

export async function loadFaqItemArtifact(artifactId: string, createdAt: Date): Promise<ArtifactFaqItem | null> {
  const result = await db.select().from(artifactFaqItem)
    .where(and(
      eq(artifactFaqItem.artifactId, artifactId),
      eq(artifactFaqItem.createdAt, createdAt)
    ))
    .limit(1)
  return result[0] || null
}

export async function deleteFaqItemArtifact(artifactId: string, createdAt: Date): Promise<void> {
  await db.delete(artifactFaqItem)
    .where(and(
      eq(artifactFaqItem.artifactId, artifactId),
      eq(artifactFaqItem.createdAt, createdAt)
    ))
}

/**
 * @description FAQ item artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Только save/load/delete операции, без AI create/update
 */
export const faqItemTool = {
  kind: 'faq-item' as const,
  save: saveFaqItemArtifact,
  load: loadFaqItemArtifact,
  delete: deleteFaqItemArtifact,
}

// END OF: artifacts/kinds/faq-item/server.ts