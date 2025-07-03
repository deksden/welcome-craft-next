/**
 * @file lib/ai/fixtures-provider.ts
 * @description AI Fixtures Provider - "lossless" прокси для точного воспроизведения AI взаимодействий
 * @version 2.0.0
 * @date 2025-07-02
 * @updated Полная переработка в lossless архитектуру с поддержкой полных объектов и stream chunks
 */

/** HISTORY:
 * v2.0.0 (2025-07-02): Рефакторинг в lossless архитектуру - поддержка fullResponse и streamChunks, stream.tee() для записи
 * v1.0.0 (2025-06-18): Начальная реализация AI fixtures для трехуровневой системы тестирования
 */

import { readFile, writeFile, mkdir, } from 'node:fs/promises'
import { join, dirname } from 'node:path'
// Optional import for AI SDK provider types - fallback to any if not available
type LanguageModelV1 = any
type LanguageModelV1StreamPart = any
import type { WorldId } from '@/tests/helpers/worlds.config'

/**
 * @description Режимы работы AI Fixtures Provider
 */
export type FixtureMode = 'record' | 'replay' | 'passthrough' | 'record-or-replay'

/**
 * @description Тип ответа: полный объект или стрим
 */
export type FixtureOutputType = 'full' | 'stream'

/**
 * @description Зафиксированное AI взаимодействие (lossless архитектура)
 */
export interface AIFixture {
  /** Уникальный ID фикстуры */
  id: string
  /** Название фикстуры для человека */
  name: string
  /** ID Use Case */
  useCaseId?: string
  /** ID мира */
  worldId?: WorldId
  /** Входные данные (prompt, settings) */
  input: {
    prompt: string // Сериализованные messages
    model: string
    settings?: Record<string, any>
    context?: any
  }
  /** Выходные данные (response) */
  output: {
    type: FixtureOutputType // 'full' для generateText, 'stream' для streamText
    // Для generateText/generateObject - хранит полный объект GenerateTextResult
    fullResponse?: any
    // Для streamText/streamObject - хранит массив всех чанков LanguageModelV1StreamPart
    streamChunks?: any[]
    timestamp: string
    duration: number
  }
  /** Метаданные */
  metadata: {
    createdAt: string
    hash: string // Хеш входных данных для быстрого поиска
    tags?: string[]
  }
}

/**
 * @description Конфигурация AI Fixtures Provider
 */
export interface FixturesConfig {
  /** Режим работы */
  mode: FixtureMode
  /** Директория для хранения фикстур */
  fixturesDir: string
  /** Автоматическое создание директорий */
  autoCreateDirs: boolean
  /** Дебаг логирование */
  debug: boolean
  /** Timeout для записи (мс) */
  recordTimeout: number
  /** Включить хеширование для быстрого поиска */
  enableHashing: boolean
}

/**
 * @description AI Fixtures Provider - основной класс для записи/воспроизведения AI взаимодействий
 * 
 * @feature Три режима работы: record, replay, passthrough
 * @feature Автоматическое хеширование для быстрого поиска
 * @feature Поддержка Use Cases и Worlds контекста
 * @feature Детерминистичные результаты для стабильных тестов
 */
export class AIFixturesProvider {
  private config: FixturesConfig
  private fixturesCache: Map<string, AIFixture> = new Map()
  
  constructor(config: Partial<FixturesConfig> = {}) {
    this.config = {
      mode: (process.env.AI_FIXTURES_MODE as FixtureMode) || 'passthrough',
      fixturesDir: config.fixturesDir || join(process.cwd(), 'tests/fixtures/ai'),
      autoCreateDirs: config.autoCreateDirs ?? true,
      debug: config.debug ?? (process.env.NODE_ENV === 'test'),
      recordTimeout: config.recordTimeout ?? 30000,
      enableHashing: config.enableHashing ?? true,
      ...config
    }
    
    this.log(`🤖 AI Fixtures Provider initialized:`, {
      mode: this.config.mode,
      fixturesDir: this.config.fixturesDir
    })
  }

  /**
   * @description Создать обертку над AI моделью с поддержкой fixtures
   * 
   * @param originalModel - Оригинальная AI модель
   * @param context - Контекст (Use Case, World)
   * @returns Wrapped модель с fixtures поддержкой
   */
  public wrapModel(
    originalModel: LanguageModelV1,
    context: {
      useCaseId?: string
      worldId?: WorldId
      fixturePrefix?: string
    } = {}
  ): LanguageModelV1 {
    const self = this
    
    return {
      specificationVersion: 'v1',
      provider: originalModel.provider,
      modelId: originalModel.modelId,
      
      async doGenerate(options: any) {
        const startTime = Date.now()
        
        // Генерируем ID фикстуры
        const fixtureId = self.generateFixtureId(options, context)
        
        if (self.config.mode === 'replay') {
          // Режим replay - ищем существующую фикстуру
          const fixture = await self.loadFixture(fixtureId, context)
          if (fixture) {
            self.log(`🔁 Replaying fixture: ${fixtureId}`)
            if (fixture.output.type !== 'full') {
              throw new Error(`Expected 'full' fixture type for doGenerate, got '${fixture.output.type}'`)
            }
            return fixture.output.fullResponse
          } else {
            throw new Error(`Fixture not found: ${fixtureId}. Run tests in 'record' mode first.`)
          }
        }
        
        if (self.config.mode === 'passthrough') {
          // Режим passthrough - используем оригинальную модель
          self.log(`⚡ Passthrough mode: ${fixtureId}`)
          return await originalModel.doGenerate(options)
        }
        
        if (self.config.mode === 'record-or-replay') {
          // Режим record-or-replay - проверяем фикстуру, replay или record
          const fixture = await self.loadFixture(fixtureId, context)
          if (fixture) {
            // Если фикстура найдена, воспроизводим ее (replay)
            self.log(`🔁 Replaying fixture: ${fixtureId}`)
            if (fixture.output.type !== 'full') {
              throw new Error(`Expected 'full' fixture type for doGenerate, got '${fixture.output.type}'`)
            }
            return fixture.output.fullResponse
          } else {
            // Если нет - делаем реальный вызов и записываем (record)
            self.log(`📝 Recording new fixture on-the-fly: ${fixtureId}`)
            
            const result = await Promise.race([
              originalModel.doGenerate(options),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('AI request timeout')), self.config.recordTimeout)
              )
            ])
            
            const duration = Date.now() - startTime
            
            // Сохраняем фикстуру с полным объектом
            await self.saveFixture(fixtureId, {
              input: {
                prompt: self.extractPrompt(options),
                model: originalModel.modelId,
                settings: self.extractSettings(options),
                context
              },
              output: {
                type: 'full',
                fullResponse: result, // Сохраняем ВЕСЬ объект целиком
                timestamp: new Date().toISOString(),
                duration
              }
            }, context)
            
            return result
          }
        }
        
        if (self.config.mode === 'record') {
          // Режим record - вызываем оригинальную модель и сохраняем результат
          self.log(`📝 Recording fixture: ${fixtureId}`)
          
          const result = await Promise.race([
            originalModel.doGenerate(options),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('AI request timeout')), self.config.recordTimeout)
            )
          ])
          
          const duration = Date.now() - startTime
          
          // Сохраняем фикстуру с полным объектом
          await self.saveFixture(fixtureId, {
            input: {
              prompt: self.extractPrompt(options),
              model: originalModel.modelId,
              settings: self.extractSettings(options),
              context
            },
            output: {
              type: 'full',
              fullResponse: result, // Сохраняем ВЕСЬ объект целиком
              timestamp: new Date().toISOString(),
              duration
            }
          }, context)
          
          return result
        }
        
        throw new Error(`Unknown AI fixtures mode: ${self.config.mode}`)
      },

      async doStream(options: any) {
        const startTime = Date.now()
        const fixtureId = self.generateFixtureId(options, context)
        
        if (self.config.mode === 'replay') {
          // Режим replay - загружаем фикстуру и воспроизводим stream
          const fixture = await self.loadFixture(fixtureId, context)
          if (fixture) {
            self.log(`🔁 Replaying stream fixture: ${fixtureId}`)
            if (fixture.output.type !== 'stream') {
              throw new Error(`Expected 'stream' fixture type for doStream, got '${fixture.output.type}'`)
            }
            return self.createStreamFromChunks(fixture.output.streamChunks || [])
          } else {
            throw new Error(`Stream fixture not found: ${fixtureId}. Run tests in 'record' mode first.`)
          }
        }
        
        if (self.config.mode === 'passthrough') {
          // Режим passthrough - используем оригинальную модель
          self.log(`⚡ Passthrough stream mode: ${fixtureId}`)
          return await originalModel.doStream(options)
        }
        
        if (self.config.mode === 'record-or-replay') {
          // Режим record-or-replay - проверяем фикстуру, replay или record
          const fixture = await self.loadFixture(fixtureId, context)
          if (fixture) {
            // Воспроизводим stream из фикстуры
            self.log(`🔁 Replaying stream fixture: ${fixtureId}`)
            if (fixture.output.type !== 'stream') {
              throw new Error(`Expected 'stream' fixture type for doStream, got '${fixture.output.type}'`)
            }
            return self.createStreamFromChunks(fixture.output.streamChunks || [])
          } else {
            // Записываем новый stream
            self.log(`📝 Recording stream fixture: ${fixtureId}`)
            return await self.recordStream(fixtureId, options, originalModel, context, startTime)
          }
        }
        
        if (self.config.mode === 'record') {
          // Режим record - записываем stream
          self.log(`📝 Recording stream fixture: ${fixtureId}`)
          return await self.recordStream(fixtureId, options, originalModel, context, startTime)
        }
        
        throw new Error(`Unknown AI fixtures mode: ${self.config.mode}`)
      }
    }
  }

  /**
   * @description Генерирует уникальный ID фикстуры на основе входных данных
   */
  private generateFixtureId(
    options: any, 
    context: { useCaseId?: string; worldId?: WorldId; fixturePrefix?: string }
  ): string {
    const prompt = this.extractPrompt(options)
    const model = options.model || 'unknown'
    
    if (this.config.enableHashing) {
      // Простое хеширование для детерминистичного ID
      const hash = this.simpleHash(prompt + model + JSON.stringify(context))
      const prefix = context.fixturePrefix || context.useCaseId || 'ai'
      return `${prefix}-${hash}`
    } else {
      // Используем timestamp для уникальности
      const timestamp = Date.now()
      const prefix = context.fixturePrefix || context.useCaseId || 'ai'
      return `${prefix}-${timestamp}`
    }
  }

  /**
   * @description Простое хеширование строки
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * @description Извлекает prompt из опций AI модели
   */
  private extractPrompt(options: any): string {
    if (options.prompt) return options.prompt
    if (options.messages) {
      return options.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')
    }
    return JSON.stringify(options)
  }

  /**
   * @description Извлекает настройки из опций AI модели
   */
  private extractSettings(options: any): Record<string, any> {
    const { prompt, messages, ...settings } = options
    return settings
  }

  /**
   * @description Извлекает контент из результата AI модели
   */
  private extractContent(result: any): string {
    if (result.text) return result.text
    if (result.content) return result.content
    if (result.choices?.[0]?.message?.content) {
      return result.choices[0].message.content
    }
    return JSON.stringify(result)
  }

  /**
   * @description Загружает фикстуру из файловой системы
   */
  private async loadFixture(
    fixtureId: string, 
    context: { useCaseId?: string; worldId?: WorldId } = {}
  ): Promise<AIFixture | null> {
    // Проверяем кеш
    if (this.fixturesCache.has(fixtureId)) {
      const cached = this.fixturesCache.get(fixtureId)
      return cached || null
    }
    
    try {
      const filePath = this.getFixtureFilePath(fixtureId, context)
      const fileContent = await readFile(filePath, 'utf-8')
      const fixture: AIFixture = JSON.parse(fileContent)
      
      // Кешируем
      this.fixturesCache.set(fixtureId, fixture)
      
      return fixture
    } catch (error) {
      this.log(`⚠️  Failed to load fixture ${fixtureId}:`, error)
      return null
    }
  }

  /**
   * @description Сохраняет фикстуру в файловую систему
   */
  private async saveFixture(
    fixtureId: string,
    data: {
      input: AIFixture['input']
      output: AIFixture['output']
    },
    context: { useCaseId?: string; worldId?: WorldId } = {}
  ): Promise<void> {
    const fixture: AIFixture = {
      id: fixtureId,
      name: `AI Fixture: ${fixtureId}`,
      useCaseId: context.useCaseId,
      worldId: context.worldId,
      input: data.input,
      output: data.output,
      metadata: {
        createdAt: new Date().toISOString(),
        hash: this.simpleHash(JSON.stringify(data.input)),
        tags: context.useCaseId ? [context.useCaseId] : undefined
      }
    }
    
    try {
      const filePath = this.getFixtureFilePath(fixtureId, context)
      
      // Создаем директорию если нужно
      if (this.config.autoCreateDirs) {
        await mkdir(dirname(filePath), { recursive: true })
      }
      
      // Сохраняем фикстуру
      await writeFile(filePath, JSON.stringify(fixture, null, 2), 'utf-8')
      
      // Кешируем
      this.fixturesCache.set(fixtureId, fixture)
      
      this.log(`💾 Fixture saved: ${filePath}`)
    } catch (error) {
      this.log(`❌ Failed to save fixture ${fixtureId}:`, error)
      throw error
    }
  }

  /**
   * @description Получает путь к файлу фикстуры
   */
  private getFixtureFilePath(
    fixtureId: string, 
    context: { useCaseId?: string; worldId?: WorldId } = {}
  ): string {
    let subdir = ''
    
    if (context.useCaseId) {
      subdir = join('use-cases', context.useCaseId)
    } else if (context.worldId) {
      subdir = join('worlds', context.worldId)
    } else {
      subdir = 'general'
    }
    
    return join(this.config.fixturesDir, subdir, `${fixtureId}.json`)
  }

  /**
   * @description Записывает stream с использованием stream.tee()
   */
  private async recordStream(
    fixtureId: string,
    options: any,
    originalModel: LanguageModelV1,
    context: { useCaseId?: string; worldId?: WorldId; fixturePrefix?: string },
    startTime: number
  ): Promise<{ stream: ReadableStream<LanguageModelV1StreamPart> }> {
    // Получаем оригинальный stream
    const { stream } = await originalModel.doStream(options)
    
    // Разделяем stream на два: один для клиента, один для записи
    const [streamForClient, streamForRecording] = stream.tee()
    
    // Немедленно возвращаем stream для клиента
    const clientResult = { stream: streamForClient }
    
    // Асинхронно записываем stream
    ;(async () => {
      const recordedChunks: any[] = []
      const reader = streamForRecording.getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          recordedChunks.push(value)
        }
        
        const duration = Date.now() - startTime
        
        // Сохраняем фикстуру с записанными чанками
        await this.saveFixture(fixtureId, {
          input: {
            prompt: this.extractPrompt(options),
            model: originalModel.modelId,
            settings: this.extractSettings(options),
            context
          },
          output: {
            type: 'stream',
            streamChunks: recordedChunks, // Сохраняем все чанки
            timestamp: new Date().toISOString(),
            duration
          }
        }, context)
        
        this.log(`💾 Stream fixture recorded: ${fixtureId} (${recordedChunks.length} chunks)`)
      } catch (error) {
        this.log(`❌ Failed to record stream fixture ${fixtureId}:`, error)
      } finally {
        reader.releaseLock()
      }
    })()
    
    return clientResult
  }

  /**
   * @description Создает новый ReadableStream из массива чанков
   */
  private createStreamFromChunks(chunks: any[]): { stream: ReadableStream<LanguageModelV1StreamPart> } {
    return {
      stream: new ReadableStream({
        start(controller) {
          // Проитерируем по всем записанным чанкам
          for (const chunk of chunks) {
            controller.enqueue(chunk)
          }
          controller.close()
        }
      })
    }
  }


  /**
   * @description Логирование с префиксом
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[AI-Fixtures] ${message}`, ...args)
    }
  }

  /**
   * @description Получить статистику использования фикстур
   */
  public getStats(): {
    mode: FixtureMode
    cacheSize: number
    fixturesDir: string
  } {
    return {
      mode: this.config.mode,
      cacheSize: this.fixturesCache.size,
      fixturesDir: this.config.fixturesDir
    }
  }

  /**
   * @description Очистить кеш фикстур
   */
  public clearCache(): void {
    this.fixturesCache.clear()
    this.log('🧹 Fixtures cache cleared')
  }
}

/**
 * @description Глобальный экземпляр AI Fixtures Provider
 */
export const aiFixturesProvider = new AIFixturesProvider()

/**
 * @description Утилита для быстрого создания wrapped AI модели
 * 
 * @param model - Оригинальная AI модель
 * @param context - Контекст Use Case и World
 * @returns Wrapped модель с fixtures поддержкой
 */
export function withAIFixtures(
  model: LanguageModelV1,
  context: {
    useCaseId?: string
    worldId?: WorldId
    fixturePrefix?: string
  } = {}
): LanguageModelV1 {
  return aiFixturesProvider.wrapModel(model, context)
}

// END OF: lib/ai/fixtures-provider.ts