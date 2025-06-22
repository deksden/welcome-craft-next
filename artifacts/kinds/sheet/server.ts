/**
 * @file artifacts/sheet/server.ts
 * @description Серверный обработчик для артефактов типа "таблица".
 * @version 3.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Добавлены схема-ориентированные функции для работы с A_Text таблицей (sheet использует ту же таблицу что и text).
 */

/** HISTORY:
 * v3.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Добавлены saveSheetArtifact, loadSheetArtifact, deleteSheetArtifact алиасы для работы с A_Text таблицей.
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.4.1 (2025-06-10): Ensured 'object' promise from streamObject is awaited before property access (TS2339).
 */

import { myProvider } from '@/lib/ai/providers'
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts'
import { generateText } from 'ai'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'
import { getDisplayContent } from '@/lib/artifact-content-utils'
import { createLogger } from '@fab33/fab-logger'

const logger = createLogger('artifacts:kinds:sheet:server')

const sheetLegacyTool: ArtifactTool = {
  kind: 'sheet',
  create: async ({ id, title, prompt, session }) => {
    const childLogger = logger.child({ artifactId: id, userId: session?.user?.id })
    const startTime = Date.now()
    
    childLogger.info({ 
      title, 
      prompt: prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
      promptLength: prompt?.length || 0
    }, 'Starting sheet artifact creation')

    try {
      const systemPrompt = sheetPrompt
      const userPrompt = prompt || title
      
      // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ В AI STUDIO
      childLogger.info({ 
        systemPrompt, 
        userPrompt 
      }, 'Final prompts for Google Gemini API call')
      
      childLogger.debug({ 
        systemPromptLength: systemPrompt.length,
        model: 'artifact-model',
        mode: 'text generation (no JSON schema)'
      }, 'Calling AI model for CSV text generation')
      
      const aiCallStart = Date.now()
      
      childLogger.debug('Calling Google Gemini API for CSV text generation with 30s timeout')
      
      // Создаем Promise для таймаута на 30 секунд
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI model call timed out after 30 seconds')), 30000)
      )

      // Запускаем гонку между вызовом API и таймаутом
      const generateTextPromise = generateText({
        model: myProvider.languageModel('artifact-model'),
        system: systemPrompt,
        prompt: userPrompt,
      })
      
      const { text } = await Promise.race([generateTextPromise, timeoutPromise]) as { text: string }
      const aiCallTime = Date.now() - aiCallStart
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        status: 'success'
      }, 'Google Gemini API call completed successfully')
      
      childLogger.debug('Starting to save artifact to database...')
      
      const totalTime = Date.now() - startTime
      const csvData = text.trim()
      const csvLines = csvData.split('\n').length
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        totalTimeMs: totalTime,
        csvLength: csvData.length,
        csvLines: csvLines,
        csvPreview: csvData.substring(0, 150) + (csvData.length > 150 ? '...' : '')
      }, 'Sheet artifact creation completed successfully')
      
      return csvData
    } catch (error) {
      const totalTime = Date.now() - startTime
      
      const err = error as Error
      if (err.name === 'AbortError' || err.message?.includes('timed out') || err.message?.includes('aborted')) {
        childLogger.error({ 
          error: 'Google Gemini API call timed out after 30 seconds',
          executionTimeMs: totalTime,
          recommendation: 'Check network connectivity or consider using mock data in development environment'
        }, 'Sheet artifact creation failed due to API timeout')
      } else {
        childLogger.error({ 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          executionTimeMs: totalTime,
          errorType: (error as any).constructor?.name
        }, 'Sheet artifact creation failed')
      }
      
      throw error
    }
  },
  update: async ({ document, description }) => {
    const childLogger = logger.child({ artifactId: document.id })
    const startTime = Date.now()
    
    const existingContent = getDisplayContent(document)
    const existingLines = existingContent.split('\n').length
    
    childLogger.info({ 
      description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
      descriptionLength: description.length,
      existingCsvLength: existingContent.length,
      existingCsvLines: existingLines
    }, 'Starting sheet artifact update')

    try {
      const systemPrompt = updateDocumentPrompt(existingContent, 'sheet')
      
      // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ В AI STUDIO
      childLogger.info({ 
        systemPrompt, 
        userPrompt: description 
      }, 'Final prompts for Google Gemini API update call')
      
      childLogger.debug({ 
        systemPromptLength: systemPrompt.length,
        model: 'artifact-model',
        mode: 'text generation (no JSON schema)'
      }, 'Calling AI model for sheet update')
      
      const aiCallStart = Date.now()
      
      // Создаем Promise для таймаута на 30 секунд
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI model call timed out after 30 seconds')), 30000)
      )

      // Запускаем гонку между вызовом API и таймаутом
      const generateTextPromise = generateText({
        model: myProvider.languageModel('artifact-model'),
        system: systemPrompt,
        prompt: description,
      })
      
      const { text } = await Promise.race([generateTextPromise, timeoutPromise]) as { text: string }
      const aiCallTime = Date.now() - aiCallStart
      
      const totalTime = Date.now() - startTime
      const updatedCsv = text.trim()
      const updatedLines = updatedCsv.split('\n').length
      
      childLogger.info({ 
        aiCallTimeMs: aiCallTime,
        totalTimeMs: totalTime,
        updatedCsvLength: updatedCsv.length,
        updatedCsvLines: updatedLines,
        updatedCsvPreview: updatedCsv.substring(0, 150) + (updatedCsv.length > 150 ? '...' : '')
      }, 'Sheet artifact update completed successfully')
      
      return updatedCsv
    } catch (error) {
      const totalTime = Date.now() - startTime
      childLogger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: totalTime
      }, 'Sheet artifact update failed')
      
      throw error
    }
  },
}

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Алиасы для работы с A_Text таблицей
// =============================================================================

// Sheet артефакты используют ту же A_Text таблицу что и text/code артефакты
// Импортируем функции из text/server и создаем алиасы
export { saveTextArtifact as saveSheetArtifact } from '../text/server'
export { loadTextArtifact as loadSheetArtifact } from '../text/server'
export { deleteTextArtifact as deleteSheetArtifact } from '../text/server'

/**
 * @description Sheet artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Поддержка как legacy AI операций, так и новых save/load/delete
 */
export const sheetTool = {
  kind: 'sheet' as const,
  // Legacy AI operations (для совместимости)
  create: sheetLegacyTool.create,
  update: sheetLegacyTool.update,
  // UC-10 Schema-Driven операции (используют A_Text таблицу)
  save: async (artifact: any, content: string, metadata?: Record<string, any>) => {
    const { saveTextArtifact } = await import('../text/server')
    return saveTextArtifact(artifact, content, metadata?.language)
  },
  load: async (artifactId: string, createdAt: Date) => {
    const { loadTextArtifact } = await import('../text/server')
    return loadTextArtifact(artifactId, createdAt)
  },
  delete: async (artifactId: string, createdAt: Date) => {
    const { deleteTextArtifact } = await import('../text/server')
    return deleteTextArtifact(artifactId, createdAt)
  },
}

// END OF: artifacts/sheet/server.ts
