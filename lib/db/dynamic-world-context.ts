/**
 * @file lib/db/dynamic-world-context.ts
 * @description PHOENIX PROJECT - Dynamic World Context с database-driven мирами
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 3 - Database-driven world management вместо статических файлов
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 3 - Создание dynamic world context для работы с WorldMeta БД
 */

import { db } from '@/lib/db'
import { worldMeta } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { WorldMeta } from '@/lib/db/schema'
import type { WorldId } from '@/tests/helpers/worlds.config'

/**
 * @description Расширенный контекст мира с database-driven данными
 */
export interface DynamicWorldContext {
  /** ID активного мира или null для production */
  worldId: WorldId | null
  /** Включен ли режим изоляции тестов */
  isTestMode: boolean
  /** Префикс для изоляции данных */
  isolationPrefix: string | null
  /** Полная информация о мире из БД (если доступна) */
  worldMeta?: WorldMeta
  /** Окружение мира */
  environment: 'LOCAL' | 'BETA' | 'PROD'
}

/**
 * @description Получить dynamic world context с данными из БД
 * 
 * @feature PHOENIX PROJECT - Database-driven world resolution
 * @feature Автоматическое определение окружения через APP_STAGE
 * @feature Поддержка статических миров как fallback
 * @param worldId - Опциональный ID мира для прямого указания
 * @returns Dynamic World Context с данными из WorldMeta БД
 */
export async function getDynamicWorldContext(
  worldId?: WorldId | null
): Promise<DynamicWorldContext> {
  // Определяем окружение через APP_STAGE
  const stage = process.env.APP_STAGE || 'PROD'
  const environment = stage as 'LOCAL' | 'BETA' | 'PROD'
  const isTestEnv = stage === 'LOCAL' || stage === 'BETA'
  
  // В production всегда возвращаем null контекст
  if (!isTestEnv && !worldId) {
    return {
      worldId: null,
      isTestMode: false,
      isolationPrefix: null,
      environment
    }
  }

  let resolvedWorldId: WorldId | null = worldId || null
  let worldMetaRecord: WorldMeta | undefined

  try {
    // Если мир не указан явно, пробуем определить из cookies
    if (!resolvedWorldId && isTestEnv) {
      // TODO: Интеграция с cookie resolution из существующего world-context.ts
      // На данном этапе используем fallback
      resolvedWorldId = null
    }

    // Загружаем данные мира из БД если ID известен
    if (resolvedWorldId) {
      const [worldRecord] = await db
        .select()
        .from(worldMeta)
        .where(
          and(
            eq(worldMeta.id, resolvedWorldId),
            eq(worldMeta.isActive, true),
            eq(worldMeta.environment, environment)
          )
        )
        .limit(1)

      if (worldRecord) {
        worldMetaRecord = worldRecord
        
        // Обновляем статистику использования
        await db
          .update(worldMeta)
          .set({ 
            lastUsedAt: new Date(),
            usageCount: worldRecord.usageCount + 1
          })
          .where(eq(worldMeta.id, resolvedWorldId))

        console.log(`🌍 PHOENIX: Loaded world '${resolvedWorldId}' from database`, {
          name: worldRecord.name,
          environment: worldRecord.environment,
          usageCount: worldRecord.usageCount + 1
        })
      } else {
        console.warn(`🌍 PHOENIX: World '${resolvedWorldId}' not found in database or inactive`)
        resolvedWorldId = null
      }
    }

  } catch (error) {
    console.error('🌍 PHOENIX: Error loading world from database:', error)
    // При ошибке БД возвращаем fallback context
    resolvedWorldId = null
  }

  const isTestMode = resolvedWorldId !== null
  const isolationPrefix = resolvedWorldId ? `test-${resolvedWorldId}` : null

  return {
    worldId: resolvedWorldId,
    isTestMode,
    isolationPrefix,
    worldMeta: worldMetaRecord,
    environment
  }
}

/**
 * @description Получить все доступные миры для текущего окружения
 * 
 * @feature PHOENIX PROJECT - Environment-aware world listing
 * @param category - Фильтр по категории (UC, REGRESSION, etc.)
 * @param activeOnly - Только активные миры
 * @returns Список доступных миров
 */
export async function getAvailableWorlds(
  category?: string,
  activeOnly = true
): Promise<WorldMeta[]> {
  try {
    const stage = process.env.APP_STAGE || 'PROD'
    const environment = stage as 'LOCAL' | 'BETA' | 'PROD'

    const conditions = [
      eq(worldMeta.environment, environment)
    ]

    if (activeOnly) {
      conditions.push(eq(worldMeta.isActive, true))
    }

    if (category) {
      conditions.push(eq(worldMeta.category, category))
    }

    const worlds = await db
      .select()
      .from(worldMeta)
      .where(and(...conditions))
      .orderBy(worldMeta.name)

    console.log(`🌍 PHOENIX: Retrieved ${worlds.length} available worlds`, {
      environment,
      category,
      activeOnly
    })

    return worlds

  } catch (error) {
    console.error('🌍 PHOENIX: Error retrieving available worlds:', error)
    return []
  }
}

/**
 * @description Создать новый динамический мир в рантайме
 * 
 * @feature PHOENIX PROJECT - Runtime world creation
 * @param worldDefinition - Определение мира
 * @returns Созданный WorldMeta record
 */
export async function createDynamicWorld(worldDefinition: {
  id: string
  name: string
  description: string
  users: any[]
  artifacts: any[]
  chats: any[]
  settings: any
  category?: string
  tags?: string[]
}): Promise<WorldMeta> {
  try {
    const stage = process.env.APP_STAGE || 'PROD'
    const environment = stage as 'LOCAL' | 'BETA' | 'PROD'

    const newWorld = {
      ...worldDefinition,
      environment,
      dependencies: [],
      isActive: true,
      isTemplate: false,
      autoCleanup: true,
      cleanupAfterHours: 24,
      version: '1.0.0',
      isolationLevel: 'FULL' as const,
      tags: worldDefinition.tags || [],
      category: worldDefinition.category || 'GENERAL',
    }

    const [created] = await db
      .insert(worldMeta)
      .values(newWorld)
      .returning()

    console.log(`🌍 PHOENIX: Created dynamic world '${created.id}'`, {
      name: created.name,
      environment: created.environment
    })

    return created

  } catch (error) {
    console.error('🌍 PHOENIX: Error creating dynamic world:', error)
    throw error
  }
}

/**
 * @description Удалить мир и все связанные данные
 * 
 * @feature PHOENIX PROJECT - World cleanup and removal
 * @param worldId - ID мира для удаления
 * @returns Success status
 */
export async function cleanupWorld(worldId: string): Promise<boolean> {
  try {
    // TODO: Добавить очистку всех записей с world_id в основных таблицах
    // (User, Chat, Message_v2, Artifact, Suggestion)
    
    // Пока что удаляем только запись в WorldMeta
    await db
      .delete(worldMeta)
      .where(eq(worldMeta.id, worldId))

    console.log(`🌍 PHOENIX: Cleaned up world '${worldId}'`)
    return true

  } catch (error) {
    console.error(`🌍 PHOENIX: Error cleaning up world '${worldId}':`, error)
    return false
  }
}

// END OF: lib/db/dynamic-world-context.ts