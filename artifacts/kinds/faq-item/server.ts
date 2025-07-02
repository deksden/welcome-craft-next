/**
 * @file artifacts/kinds/faq-item/server.ts
 * @description Серверный обработчик для артефактов типа "FAQ элемент".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Spectrum SCHEMA-DRIVEN CMS - Создан новый тип артефакта для FAQ элементов.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactFaqItem } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactFaqItem } from '@/lib/db/schema'
import type { ArtifactFaqItemData } from '@/lib/types'
import type { Session } from 'next-auth'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const logger = createLogger('artifacts:kinds:faq-item:server')

// =============================================================================
// Zod Schema for AI Generation
// =============================================================================

const FaqItemSchema = z.object({
  question: z.string().describe('Вопрос FAQ'),
  answer: z.string().describe('Ответ на вопрос'),
  category: z.string().optional().describe('Категория FAQ (опционально)'),
  priority: z.number().optional().describe('Приоритет отображения (1-10)')
})

// =============================================================================
// AI OPERATION: Create FAQ Item
// =============================================================================

/**
 * @description AI-генерация FAQ элемента на основе промпта пользователя
 * @param props - Параметры создания (id, title, prompt, session)
 * @returns Promise<string> - JSON строка с данными FAQ элемента
 */
export async function createFaqItemArtifact(props: {
  id: string;
  title: string;
  prompt: string;
  session: Session;
}): Promise<string> {
  const childLogger = logger.child({ artifactId: props.id, kind: 'faq-item' })
  
  try {
    childLogger.info({ prompt: props.prompt }, 'AI создание FAQ элемента')
    
    const result = await generateObject({
      model: google('gemini-1.5-flash'),
      system: `Ты - эксперт по созданию FAQ элементов для корпоративного онбординга.
      Создай полезный и информативный FAQ элемент на основе запроса пользователя.
      
      Правила:
      - Вопрос должен быть четким и конкретным
      - Ответ должен быть полным и полезным
      - Используй профессиональный тон
      - Если нужно, добавь категорию для группировки`,
      prompt: `Создай FAQ элемент: ${props.prompt}`,
      schema: FaqItemSchema
    })
    
    const faqData = {
      question: result.object.question,
      answer: result.object.answer,
      category: result.object.category || 'General',
      priority: result.object.priority || 5
    }
    
    childLogger.info({ 
      question: faqData.question.substring(0, 100),
      answerLength: faqData.answer.length,
      category: faqData.category
    }, 'FAQ элемент успешно создан AI')
    
    return JSON.stringify(faqData)
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Ошибка AI создания FAQ элемента')
    
    throw error
  }
}

// =============================================================================
// Spectrum SCHEMA-DRIVEN CMS: Функции для работы с A_FaqItem таблицей
// =============================================================================

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
 * @description FAQ item artifact tool с поддержкой AI + Spectrum schema-driven операций
 * @feature AI create + save/load/delete операции
 */
export const faqItemTool = {
  kind: 'faq-item' as const,
  // AI операции
  create: createFaqItemArtifact,
  // Spectrum Schema-Driven операции
  save: saveFaqItemArtifact,
  load: loadFaqItemArtifact,
  delete: deleteFaqItemArtifact,
}

// END OF: artifacts/kinds/faq-item/server.ts