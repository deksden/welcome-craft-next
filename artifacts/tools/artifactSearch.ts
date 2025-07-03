/**
 * @file artifacts/tools/artifactSearch.ts
 * @description AI инструмент для семантического поиска артефактов по векторным эмбеддингам
 * @version 1.0.0
 * @date 2025-07-02
 * @updated TASK-AI-TOOLS-IMPLEMENTATION - Реализация семантического поиска с pgvector поддержкой
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): TASK-AI-TOOLS-IMPLEMENTATION - Создан инструмент семантического поиска артефактов с гибридным поиском (векторный + текстовый fallback)
 */

import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'
import { embed } from 'ai'
import { google } from '@ai-sdk/google'
import { db } from '@/lib/db'
import { artifact } from '@/lib/db/schema'
import { eq, sql, and, isNull } from 'drizzle-orm'
import { getCurrentWorldContextSync } from '@/lib/db/world-context'

/**
 * @description Типы артефактов для фильтрации
 */
const artifactKinds = [
  'text', 'code', 'image', 'sheet', 'site', 
  'person', 'address', 'faq-item', 'link', 
  'set-definition', 'set'
] as const

/**
 * @description Генерирует векторное эмбеддинг для поискового запроса
 * @param query - Поисковый запрос
 * @returns Promise с массивом чисел (вектор) или null при ошибке
 */
async function generateSearchEmbedding(query: string): Promise<number[] | null> {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: query,
    })
    
    return embedding
  } catch (error) {
    console.error('ARTIFACT_SEARCH: Failed to generate search embedding', error)
    return null
  }
}

/**
 * @description Выполняет семантический поиск артефактов по векторным эмбеддингам
 * @param queryEmbedding - Векторное представление поискового запроса
 * @param options - Опции поиска (фильтры, пагинация)
 * @returns Promise с результатами поиска
 */
async function performSemanticSearch(
  queryEmbedding: number[],
  options: {
    kind?: typeof artifactKinds[number]
    tags?: string[]
    page: number
    pageSize: number
    worldId?: string | null
  }
): Promise<any[]> {
  try {
    const offset = (options.page - 1) * options.pageSize
    
    // Строим WHERE условие
    const whereConditions = [
      isNull(artifact.deletedAt), // Исключаем удаленные артефакты
    ]
    
    // Фильтр по world_id (изоляция миров)
    if (options.worldId !== undefined) {
      if (options.worldId === null) {
        whereConditions.push(isNull(artifact.world_id))
      } else {
        whereConditions.push(eq(artifact.world_id, options.worldId))
      }
    }
    
    // Фильтр по типу артефакта
    if (options.kind) {
      whereConditions.push(eq(artifact.kind, options.kind))
    }
    
    // Основной запрос с векторным поиском
    const searchResults = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
        summary: artifact.summary,
        kind: artifact.kind,
        userId: artifact.userId,
        authorId: artifact.authorId,
        world_id: artifact.world_id,
        // Косинусное расстояние для семантического поиска (меньше = более похоже)
        similarity: sql<number>`1 - (${artifact.embedding} <=> ${queryEmbedding}::vector)`
      })
      .from(artifact)
      .where(and(...whereConditions))
      .orderBy(sql`${artifact.embedding} <=> ${queryEmbedding}::vector`)
      .limit(options.pageSize)
      .offset(offset)
    
    return searchResults
  } catch (error) {
    console.error('ARTIFACT_SEARCH: Semantic search failed', error)
    return []
  }
}

/**
 * @description Выполняет текстовый поиск как fallback для семантического поиска
 * @param query - Поисковый запрос
 * @param options - Опции поиска (фильтры, пагинация)
 * @returns Promise с результатами поиска
 */
async function performTextSearch(
  query: string,
  options: {
    kind?: typeof artifactKinds[number]
    tags?: string[]
    page: number
    pageSize: number
    worldId?: string | null
  }
): Promise<any[]> {
  try {
    const offset = (options.page - 1) * options.pageSize
    
    // Строим WHERE условие
    const whereConditions = [
      isNull(artifact.deletedAt), // Исключаем удаленные артефакты
    ]
    
    // Фильтр по world_id (изоляция миров)
    if (options.worldId !== undefined) {
      if (options.worldId === null) {
        whereConditions.push(isNull(artifact.world_id))
      } else {
        whereConditions.push(eq(artifact.world_id, options.worldId))
      }
    }
    
    // Фильтр по типу артефакта
    if (options.kind) {
      whereConditions.push(eq(artifact.kind, options.kind))
    }
    
    // Текстовый поиск по title и summary
    const searchPattern = `%${query}%`
    const textSearchCondition = sql`(${artifact.title} ILIKE ${searchPattern} OR ${artifact.summary} ILIKE ${searchPattern})`
    whereConditions.push(textSearchCondition)
    
    const searchResults = await db
      .select({
        id: artifact.id,
        createdAt: artifact.createdAt,
        title: artifact.title,
        summary: artifact.summary,
        kind: artifact.kind,
        userId: artifact.userId,
        authorId: artifact.authorId,
        world_id: artifact.world_id,
        similarity: sql<number>`NULL` // Для fallback поиска similarity не вычисляется
      })
      .from(artifact)
      .where(and(...whereConditions))
      .orderBy(artifact.createdAt) // Сортировка по дате создания
      .limit(options.pageSize)
      .offset(offset)
    
    return searchResults
  } catch (error) {
    console.error('ARTIFACT_SEARCH: Text search failed', error)
    return []
  }
}

/**
 * @description AI инструмент для семантического поиска артефактов
 * @feature Векторный поиск по эмбеддингам с текстовым fallback
 * @feature Поддержка фильтрации по типу и тегам
 * @feature World isolation для тестового окружения
 * @feature Пагинация результатов
 */
export const artifactSearchTool = tool({
  description: 'Ищет артефакты по семантическому значению запроса. Может фильтровать по типу и тегам.',
  parameters: z.object({
    query: z.string().optional().describe('Текст для семантического поиска (необязательно если используются только фильтры)'),
    kind: z.enum(artifactKinds).optional().describe('Фильтр по типу артефакта'),
    tags: z.array(z.string()).optional().describe('Фильтр по тегам (пока не реализован)'),
    page: z.number().optional().default(1).describe('Номер страницы для пагинации'),
    pageSize: z.number().optional().default(10).describe('Количество результатов на странице (максимум 50)'),
  }),
  execute: async ({ query, kind, tags, page = 1, pageSize = 10 }) => {
    try {
      // Ограничиваем размер страницы
      const limitedPageSize = Math.min(pageSize, 50)
      
      // Получаем контекст текущего мира для изоляции
      const worldContext = getCurrentWorldContextSync()
      
      let results: any[] = []
      let totalCount = 0
      let searchMethod = 'none'
      
      if (query?.trim()) {
        // Попробуем семантический поиск
        const queryEmbedding = await generateSearchEmbedding(query.trim())
        
        if (queryEmbedding) {
          // Семантический поиск
          results = await performSemanticSearch(queryEmbedding, {
            kind,
            tags,
            page,
            pageSize: limitedPageSize,
            worldId: worldContext?.worldId || null
          })
          searchMethod = 'semantic'
        } else {
          // Fallback на текстовый поиск
          results = await performTextSearch(query.trim(), {
            kind,
            tags,
            page,
            pageSize: limitedPageSize,
            worldId: worldContext?.worldId || null
          })
          searchMethod = 'text_fallback'
        }
      } else if (kind) {
        // Поиск только по фильтрам (без запроса)
        results = await performTextSearch('', {
          kind,
          tags,
          page,
          pageSize: limitedPageSize,
          worldId: worldContext?.worldId || null
        })
        searchMethod = 'filter_only'
      }
      
      // Подсчитываем общее количество для пагинации
      totalCount = results.length
      const hasMore = results.length === limitedPageSize
      
      // Форматируем результаты для AI
      const formattedResults = results.map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        kind: item.kind,
        createdAt: item.createdAt,
        similarity: item.similarity ? Number(item.similarity.toFixed(3)) : undefined
      }))
      
      return {
        artifacts: formattedResults,
        totalCount,
        currentPage: page,
        pageSize: limitedPageSize,
        hasMore,
        searchMethod,
        worldId: worldContext?.worldId || null
      }
    } catch (error) {
      console.error('ARTIFACT_SEARCH: Tool execution failed', error)
      return {
        artifacts: [],
        totalCount: 0,
        currentPage: page,
        pageSize: pageSize,
        hasMore: false,
        error: 'Поиск временно недоступен'
      }
    }
  },
})

// END OF: artifacts/tools/artifactSearch.ts