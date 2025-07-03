/**
 * @file lib/ai/artifact-search.ts
 * @description Server-side функции семантического поиска артефактов для использования в holistic generation
 * @version 1.0.0
 * @date 2025-07-02
 * @updated TASK-AI-TOOLS-IMPLEMENTATION - Создана серверная библиотека семантического поиска для интеграции с UC-09
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): TASK-AI-TOOLS-IMPLEMENTATION - Извлечена логика поиска из artifactSearchTool для использования в server-side коде
 */

import 'server-only'
import { embed } from 'ai'
import { google } from '@ai-sdk/google'
import { db } from '@/lib/db'
import { artifact } from '@/lib/db/schema'
import { eq, sql, and, isNull } from 'drizzle-orm'
import { getCurrentWorldContextSync } from '@/lib/db/world-context'
import type { ArtifactKind } from '@/lib/types'

/**
 * @description Результат семантического поиска артефактов
 */
export interface SemanticSearchResult {
  id: string
  createdAt: Date
  title: string
  summary: string
  kind: ArtifactKind
  userId: string
  authorId: string | null
  world_id: string | null
  similarity?: number
}

/**
 * @description Опции для семантического поиска
 */
export interface SemanticSearchOptions {
  kind?: ArtifactKind
  page?: number
  pageSize?: number
  worldId?: string | null
  minSimilarity?: number
}

/**
 * @description Генерирует векторное эмбеддинг для поискового запроса
 * @param query - Поисковый запрос
 * @returns Promise с массивом чисел (вектор) или null при ошибке
 */
export async function generateSearchEmbedding(query: string): Promise<number[] | null> {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: query,
    })
    
    return embedding
  } catch (error) {
    console.error('SEMANTIC_SEARCH: Failed to generate search embedding', error)
    return null
  }
}

/**
 * @description Выполняет семантический поиск артефактов
 * @param query - Поисковый запрос
 * @param options - Опции поиска
 * @returns Promise с результатами поиска
 */
export async function searchArtifactsSemantically(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult[]> {
  try {
    // Генерируем эмбеддинг для запроса
    const queryEmbedding = await generateSearchEmbedding(query)
    if (!queryEmbedding) {
      console.warn('SEMANTIC_SEARCH: Failed to generate embedding, falling back to empty results')
      return []
    }

    const {
      kind,
      page = 1,
      pageSize = 10,
      worldId,
      minSimilarity = 0.1
    } = options
    
    const offset = (page - 1) * pageSize
    
    // Строим WHERE условие
    const whereConditions = [
      isNull(artifact.deletedAt), // Исключаем удаленные артефакты
    ]
    
    // Фильтр по world_id (если не передан, используем текущий контекст)
    const finalWorldId = worldId !== undefined ? worldId : getCurrentWorldContextSync()?.worldId || null
    if (finalWorldId === null) {
      whereConditions.push(isNull(artifact.world_id))
    } else {
      whereConditions.push(eq(artifact.world_id, finalWorldId))
    }
    
    // Фильтр по типу артефакта
    if (kind) {
      whereConditions.push(eq(artifact.kind, kind))
    }
    
    // Фильтр по минимальному сходству
    const similarityCondition = sql`1 - (${artifact.embedding} <=> ${queryEmbedding}::vector) >= ${minSimilarity}`
    whereConditions.push(similarityCondition)
    
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
      .limit(pageSize)
      .offset(offset)
    
    return searchResults.map(result => ({
      ...result,
      kind: result.kind as ArtifactKind,
      similarity: Number(result.similarity)
    }))
  } catch (error) {
    console.error('SEMANTIC_SEARCH: Search failed', error)
    return []
  }
}

/**
 * @description Выполняет быстрый семантический поиск для slot кандидатов
 * @param userPrompt - Пользовательский запрос для контекста
 * @param slotDescription - Описание слота для поиска релевантных артефактов
 * @param kind - Тип артефакта для поиска
 * @param limit - Максимальное количество результатов
 * @returns Promise с кандидатами для слота
 */
export async function findSlotCandidatesSemanticSearch(
  userPrompt: string,
  slotDescription: string,
  kind: ArtifactKind,
  limit = 5
): Promise<SemanticSearchResult[]> {
  try {
    // Комбинируем пользовательский запрос с описанием слота для лучшего контекста
    const searchQuery = `${userPrompt} ${slotDescription}`
    
    const results = await searchArtifactsSemantically(searchQuery, {
      kind,
      pageSize: limit,
      minSimilarity: 0.2 // Более высокий порог для slot кандидатов
    })
    
    console.log(`SLOT_SEARCH: Found ${results.length} semantic candidates for ${kind} slot`)
    return results
  } catch (error) {
    console.error('SLOT_SEARCH: Failed to find slot candidates', error)
    return []
  }
}

// END OF: lib/ai/artifact-search.ts