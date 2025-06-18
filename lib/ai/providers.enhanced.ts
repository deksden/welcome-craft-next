/**
 * @file lib/ai/providers.enhanced.ts
 * @description Enhanced AI провайдер с поддержкой AI Fixtures для трехуровневой системы тестирования
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Интеграция AI Fixtures Provider с существующими моделями (Phase 3)
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация enhanced provider с AI fixtures поддержкой
 */

import { customProvider } from 'ai'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
import { isTestEnvironment } from '../constants'
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test'
import { aiFixturesProvider, withAIFixtures } from './fixtures-provider'
import type { WorldId } from '@/tests/helpers/worlds.config'

/**
 * @description Контекст для AI Fixtures - передается в модели
 */
interface AIContext {
  useCaseId?: string
  worldId?: WorldId
  fixturePrefix?: string
  operation?: string // 'chat', 'artifact-create', 'artifact-update', etc.
}

/**
 * @description Создать enhanced модель с AI fixtures поддержкой
 * 
 * @param baseModel - Базовая AI модель
 * @param modelId - ID модели для логирования
 * @param context - Контекст Use Case и World
 * @returns Enhanced модель с fixtures
 */
function createEnhancedModel(baseModel: any, modelId: string, context: AIContext = {}) {
  // В тестовом окружении используем fixtures
  if (process.env.AI_FIXTURES_MODE && process.env.AI_FIXTURES_MODE !== 'passthrough') {
    return withAIFixtures(baseModel, {
      ...context,
      fixturePrefix: context.fixturePrefix || modelId
    })
  }
  
  // В обычном режиме возвращаем базовую модель
  return baseModel
}

/**
 * @description Enhanced провайдер с AI Fixtures поддержкой
 * 
 * @feature Автоматическая интеграция с AI Fixtures в тестовом режиме
 * @feature Поддержка Use Case и World контекста
 * @feature Обратная совместимость с существующим кодом
 */
export function createEnhancedProvider(context: AIContext = {}) {
  const baseModels = isTestEnvironment ? {
    'chat-model': chatModel,
    'chat-model-reasoning': reasoningModel,
    'title-model': titleModel,
    'artifact-model': artifactModel,
    'omni-image-model': artifactModel,
  } : {
    'chat-model': google('gemini-2.5-flash-preview-05-20'),
    'chat-model-reasoning': google('gemini-2.0-flash'),
    'title-model': google('gemini-2.0-flash'),
    'artifact-model': google('gemini-2.5-flash-preview-05-20'),
    'omni-image-model': google('gemini-2.0-flash-preview-image-generation'),
  }

  // Оборачиваем каждую модель в AI Fixtures
  const enhancedModels = Object.entries(baseModels).reduce((acc, [key, model]) => {
    acc[key] = createEnhancedModel(model, key, {
      ...context,
      operation: key // Добавляем operation в контекст
    })
    return acc
  }, {} as Record<string, any>)

  return customProvider({
    languageModels: enhancedModels,
    imageModels: isTestEnvironment ? {} : {
      'small-model': xai.image('grok-2-image'),
    },
  })
}

/**
 * @description Глобальный enhanced провайдер (обратная совместимость)
 */
export const myEnhancedProvider = createEnhancedProvider()

/**
 * @description Создать провайдер для конкретного Use Case
 * 
 * @param useCaseId - ID Use Case для контекста
 * @param worldId - ID World для контекста
 * @returns Провайдер с настроенным контекстом
 */
export function createUseCaseProvider(useCaseId: string, worldId?: WorldId) {
  return createEnhancedProvider({
    useCaseId,
    worldId,
    fixturePrefix: useCaseId
  })
}

/**
 * @description Создать провайдер для конкретного мира
 * 
 * @param worldId - ID World для контекста
 * @returns Провайдер с настроенным контекстом
 */
export function createWorldProvider(worldId: WorldId) {
  return createEnhancedProvider({
    worldId,
    fixturePrefix: `world-${worldId}`
  })
}

/**
 * @description Utilities для работы с AI Fixtures в тестах
 */
export const aiFixturesUtils = {
  /**
   * Установить режим работы AI Fixtures
   */
  setMode(mode: 'record' | 'replay' | 'passthrough') {
    process.env.AI_FIXTURES_MODE = mode
    console.log(`🤖 AI Fixtures mode set to: ${mode}`)
  },

  /**
   * Получить статистику использования фикстур
   */
  getStats() {
    return aiFixturesProvider.getStats()
  },

  /**
   * Очистить кеш фикстур
   */
  clearCache() {
    aiFixturesProvider.clearCache()
  },

  /**
   * Активировать запись фикстур для Use Case
   */
  startRecording(useCaseId: string, worldId?: WorldId) {
    this.setMode('record')
    console.log(`📝 Started recording AI fixtures for Use Case: ${useCaseId}`, 
                worldId ? `in World: ${worldId}` : '')
  },

  /**
   * Активировать воспроизведение фикстур для Use Case
   */
  startReplay(useCaseId: string, worldId?: WorldId) {
    this.setMode('replay')
    console.log(`🔁 Started replaying AI fixtures for Use Case: ${useCaseId}`, 
                worldId ? `in World: ${worldId}` : '')
  },

  /**
   * Отключить AI Fixtures (passthrough режим)
   */
  disable() {
    this.setMode('passthrough')
    console.log(`⚡ AI Fixtures disabled - using real AI models`)
  }
}

/**
 * @description Middleware для автоматической активации AI Fixtures в тестах
 * 
 * @feature Анализирует переменные окружения и активирует нужный режим
 * @feature Интеграция с Playwright тестами
 */
export function initializeAIFixturesForTest() {
  // Определяем режим из переменных окружения
  const mode = process.env.AI_FIXTURES_MODE as 'record' | 'replay' | 'passthrough'
  const useCaseId = process.env.CURRENT_USE_CASE_ID
  const worldId = process.env.CURRENT_WORLD_ID as WorldId
  
  if (mode && mode !== 'passthrough') {
    aiFixturesUtils.setMode(mode)
    
    if (useCaseId) {
      console.log(`🎯 AI Fixtures initialized for Use Case: ${useCaseId}`)
    }
    
    if (worldId) {
      console.log(`🌍 AI Fixtures initialized for World: ${worldId}`)
    }
  }
  
  return {
    mode: mode || 'passthrough',
    useCaseId,
    worldId,
    provider: createEnhancedProvider({ useCaseId, worldId })
  }
}

// Автоматическая инициализация в тестовом окружении
if (isTestEnvironment && (process.env.AI_FIXTURES_MODE || process.env.CURRENT_USE_CASE_ID)) {
  initializeAIFixturesForTest()
}

// END OF: lib/ai/providers.enhanced.ts