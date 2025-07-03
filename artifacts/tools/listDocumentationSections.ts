/**
 * @file artifacts/tools/listDocumentationSections.ts
 * @description AI инструмент для получения списка разделов документации проекта
 * @version 1.0.0
 * @date 2025-07-02
 * @updated TASK-AI-TOOLS-IMPLEMENTATION - RAG система для поиска и навигации по документации
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): TASK-AI-TOOLS-IMPLEMENTATION - Создан инструмент для семантического поиска разделов документации с поддержкой фильтрации
 */

import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'
import { embed } from 'ai'
import { google } from '@ai-sdk/google'
import { db } from '@/lib/db'
import { systemDocs } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

/**
 * @description Генерирует векторное эмбеддинг для поискового запроса по документации
 * @param query - Поисковый запрос
 * @returns Promise с массивом чисел (вектор) или null при ошибке
 */
async function generateDocSearchEmbedding(query: string): Promise<number[] | null> {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: query,
    })
    
    return embedding
  } catch (error) {
    console.error('DOC_SEARCH: Failed to generate search embedding', error)
    return null
  }
}

/**
 * @description Выполняет семантический поиск по документации
 * @param queryEmbedding - Векторное представление поискового запроса
 * @param limit - Максимальное количество результатов
 * @returns Promise с результатами поиска
 */
async function performDocumentationSearch(
  queryEmbedding: number[],
  limit = 10
): Promise<any[]> {
  try {
    const searchResults = await db
      .select({
        id: systemDocs.id,
        title: systemDocs.title,
        summary: systemDocs.summary,
        updatedAt: systemDocs.updatedAt,
        fileSize: systemDocs.fileSize,
        // Косинусное расстояние для семантического поиска (меньше = более похоже)
        similarity: sql<number>`1 - (${systemDocs.embedding} <=> ${queryEmbedding}::vector)`
      })
      .from(systemDocs)
      .where(sql`${systemDocs.embedding} IS NOT NULL`) // Только документы с эмбеддингами
      .orderBy(sql`${systemDocs.embedding} <=> ${queryEmbedding}::vector`)
      .limit(limit)
    
    return searchResults
  } catch (error) {
    console.error('DOC_SEARCH: Semantic search failed', error)
    return []
  }
}

/**
 * @description Получает все разделы документации без поиска
 * @param limit - Максимальное количество результатов
 * @returns Promise с результатами
 */
async function getAllDocumentationSections(limit = 20): Promise<any[]> {
  try {
    const allSections = await db
      .select({
        id: systemDocs.id,
        title: systemDocs.title,
        summary: systemDocs.summary,
        updatedAt: systemDocs.updatedAt,
        fileSize: systemDocs.fileSize,
      })
      .from(systemDocs)
      .orderBy(systemDocs.updatedAt)
      .limit(limit)
    
    return allSections
  } catch (error) {
    console.error('DOC_SEARCH: Failed to get all sections', error)
    return []
  }
}

/**
 * @description AI инструмент для поиска и получения списка разделов документации
 * @feature Семантический поиск по документации проекта
 * @feature Возвращает список релевантных разделов с summary
 * @feature Поддержка как поиска, так и просмотра всех разделов
 */
export const listDocumentationSectionsTool = tool({
  description: 'Ищет и возвращает список разделов документации проекта WelcomeCraft. Может искать по запросу или вернуть все разделы.',
  parameters: z.object({
    query: z.string().optional().describe('Поисковый запрос для поиска релевантных разделов документации. Если не указан, возвращает все разделы.'),
    limit: z.number().optional().default(10).describe('Максимальное количество разделов для возврата (максимум 50)'),
  }),
  execute: async ({ query, limit = 10 }) => {
    try {
      // Ограничиваем лимит
      const safeLimit = Math.min(limit, 50)
      
      let results: any[] = []
      let searchMethod = 'none'
      
      if (query?.trim()) {
        // Поиск по запросу
        const queryEmbedding = await generateDocSearchEmbedding(query.trim())
        
        if (queryEmbedding) {
          results = await performDocumentationSearch(queryEmbedding, safeLimit)
          searchMethod = 'semantic'
        } else {
          // Fallback: возвращаем все разделы
          results = await getAllDocumentationSections(safeLimit)
          searchMethod = 'fallback_all'
        }
      } else {
        // Возвращаем все разделы
        results = await getAllDocumentationSections(safeLimit)
        searchMethod = 'all_sections'
      }
      
      // Форматируем результаты для AI
      const formattedSections = results.map(section => ({
        id: section.id,
        title: section.title,
        summary: section.summary,
        lastUpdated: section.updatedAt,
        fileSizeKB: section.fileSize ? Math.round(section.fileSize / 1024) : null,
        similarity: section.similarity ? Number(section.similarity.toFixed(3)) : undefined
      }))
      
      return {
        sections: formattedSections,
        totalFound: results.length,
        searchMethod,
        hasMore: results.length === safeLimit,
        query: query || null
      }
    } catch (error) {
      console.error('DOC_SEARCH: Tool execution failed', error)
      return {
        sections: [],
        totalFound: 0,
        searchMethod: 'error',
        hasMore: false,
        error: 'Поиск по документации временно недоступен'
      }
    }
  },
})

// END OF: artifacts/tools/listDocumentationSections.ts