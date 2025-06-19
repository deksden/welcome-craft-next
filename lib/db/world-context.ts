/**
 * @file lib/db/world-context.ts
 * @description Контекст тестового мира для автоматической изоляции данных в БД
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Реализация Phase 2 - Database Isolation
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация world context для автоматической изоляции данных
 */

import { cookies } from 'next/headers'
import type { WorldId } from '@/tests/helpers/worlds.config'

/**
 * @description Ключ cookie для хранения активного мира
 */
export const WORLD_COOKIE_KEY = 'test-world-id'

/**
 * @description Время жизни world cookie (4 часа)
 */
export const WORLD_COOKIE_TTL = 4 * 60 * 60 * 1000

/**
 * @description Контекст тестового мира для текущего запроса
 */
export interface WorldContext {
  /** ID активного мира или null для production */
  worldId: WorldId | null
  /** Включен ли режим изоляции тестов */
  isTestMode: boolean
  /** Префикс для изоляции данных */
  isolationPrefix: string | null
}

/**
 * @description Получить контекст текущего мира из cookies (синхронная версия)
 * 
 * @feature Fallback для случаев когда cookies недоступны
 * @feature Безопасная работа в production (null world_id)
 * @returns Контекст мира для использования в DB запросах
 */
export function getCurrentWorldContextSync(): WorldContext {
  // В синхронном режиме всегда возвращаем production контекст
  return {
    worldId: null,
    isTestMode: false,
    isolationPrefix: null
  }
}

/**
 * @description Получить контекст текущего мира из cookies (асинхронная версия)
 * 
 * @feature Автоматическое определение активного мира
 * @feature Безопасная работа в production (null world_id)
 * @returns Контекст мира для использования в DB запросах
 */
export async function getCurrentWorldContext(): Promise<WorldContext> {
  let worldId: WorldId | null = null
  
  try {
    // Проверяем cookie только в тестовом окружении
    if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true') {
      const cookieStore = await cookies()
      const worldCookie = cookieStore.get(WORLD_COOKIE_KEY)
      
      if (worldCookie?.value) {
        worldId = worldCookie.value as WorldId
      }
    }
  } catch (error) {
    // В server components cookies() может быть недоступен
    // В таком случае worldId остается null (production mode)
    console.log('World context: cookies not available, using production mode')
  }
  
  const isTestMode = worldId !== null
  const isolationPrefix = worldId ? `test-${worldId}` : null
  
  return {
    worldId,
    isTestMode,
    isolationPrefix
  }
}

/**
 * @description Установить активный мир через cookie
 * 
 * @feature Используется в тестах для активации изоляции
 * @param worldId - ID мира для активации, null для отключения
 */
export async function setWorldContext(worldId: WorldId | null): Promise<void> {
  const cookieStore = await cookies()
  
  if (worldId) {
    // Устанавливаем cookie с TTL
    cookieStore.set(WORLD_COOKIE_KEY, worldId, {
      httpOnly: false, // Доступ из JavaScript для тестов
      secure: false, // HTTP для локальной разработки
      sameSite: 'lax',
      maxAge: WORLD_COOKIE_TTL,
      path: '/'
    })
  } else {
    // Удаляем cookie
    cookieStore.delete(WORLD_COOKIE_KEY)
  }
}

/**
 * @description Создать WHERE условие для изоляции данных по world_id
 * 
 * @feature Автоматическая фильтрация данных в зависимости от контекста
 * @param context - Контекст мира (получить через getCurrentWorldContext)
 * @returns Объект для использования в Drizzle WHERE условиях
 */
export function createWorldFilter(context?: WorldContext) {
  if (!context || !context.isTestMode) {
    // Production mode - показываем только записи без world_id
    return { world_id: null }
  } else {
    // Test mode - показываем только записи конкретного мира
    return { world_id: context.worldId }
  }
}

/**
 * @description Добавить world_id к данным перед вставкой в БД
 * 
 * @feature Автоматическое добавление изоляции при создании записей
 * @param data - Данные для вставки
 * @param context - Контекст мира
 * @returns Данные с добавленным world_id
 */
export function addWorldId<T extends Record<string, any>>(
  data: T, 
  context?: WorldContext
): T & { world_id: string | null } {
  return {
    ...data,
    world_id: context?.worldId || null
  }
}

/**
 * @description Проверка что текущий пользователь имеет доступ к данным
 * 
 * @feature Безопасность - предотвращение cross-world доступа
 * @param recordWorldId - world_id записи из БД
 * @param context - Контекст текущего мира
 * @returns true если доступ разрешен
 */
export function canAccessRecord(
  recordWorldId: string | null, 
  context?: WorldContext
): boolean {
  if (!context || !context.isTestMode) {
    // Production mode - доступ только к production данным
    return recordWorldId === null
  } else {
    // Test mode - доступ только к данным текущего мира
    return recordWorldId === context.worldId
  }
}

/**
 * @description Middleware helper для проверки изоляции мира
 * 
 * @feature Автоматическая проверка изоляции в API routes
 * @param request - Next.js Request объект
 * @returns Контекст мира для использования в API
 */
export function getWorldContextFromRequest(request: Request): WorldContext {
  let worldId: WorldId | null = null
  
  try {
    // Извлекаем world_id из cookie в заголовке
    const cookieHeader = request.headers.get('cookie')
    const isWorldUIEnabled = process.env.ENABLE_TEST_WORLDS_UI === 'true'
    
    console.log('🌍 getWorldContextFromRequest DEBUG:', {
      hasCookieHeader: !!cookieHeader,
      isWorldUIEnabled,
      NODE_ENV: process.env.NODE_ENV,
      ENABLE_TEST_WORLDS_UI: process.env.ENABLE_TEST_WORLDS_UI
    })
    
    if (cookieHeader && isWorldUIEnabled) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      
      console.log('🌍 Available cookies:', Object.keys(cookies))
      
      // Try main world_id cookie first
      if (cookies.world_id) {
        worldId = cookies.world_id as WorldId
        console.log('🌍 Found world_id cookie:', worldId)
      } 
      // Try fallback cookie
      else if (cookies.world_id_fallback) {
        worldId = cookies.world_id_fallback as WorldId
        console.log('🌍 Found world_id_fallback cookie:', worldId)
      }
      // Try old format for backward compatibility
      else if (cookies[WORLD_COOKIE_KEY]) {
        worldId = cookies[WORLD_COOKIE_KEY] as WorldId
        console.log('🌍 Found test-world-id cookie:', worldId)
      }
    }
  } catch (error) {
    console.warn('Failed to parse world context from request:', error)
  }
  
  const isTestMode = worldId !== null
  const isolationPrefix = worldId ? `test-${worldId}` : null
  
  return {
    worldId,
    isTestMode,
    isolationPrefix
  }
}

/**
 * @description Утилита для отладки текущего контекста мира
 */
export function debugWorldContext(context?: WorldContext): void {
  console.log('🌍 World Context Debug:', {
    worldId: context?.worldId,
    isTestMode: context?.isTestMode,
    isolationPrefix: context?.isolationPrefix,
    nodeEnv: process.env.NODE_ENV,
    playwrightTest: process.env.PLAYWRIGHT_TEST
  })
}

// END OF: lib/db/world-context.ts