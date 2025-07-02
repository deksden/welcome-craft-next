/**
 * @file artifacts/kinds/text/server.ts
 * @description Серверный обработчик для текстовых артефактов с поддержкой Spectrum Schema-Driven CMS.
 * @version 4.0.0
 * @date 2025-06-21
 * @updated Spectrum SCHEMA-DRIVEN CMS - Полностью переписан для унификации с artifact-tools.ts реестром.
 */

/** HISTORY:
 * v4.0.0 (2025-06-21): Spectrum SCHEMA-DRIVEN CMS - Полностью переписан для унификации с artifact-tools.ts. Удален дублированный код, оставлены только schema-driven функции.
 * v3.0.0 (2025-06-20): Spectrum SCHEMA-DRIVEN CMS - Добавлены saveTextArtifact, loadTextArtifact, deleteTextArtifact функции для работы с новой A_Text таблицей.
 * v2.0.0 (2025-06-10): Refactored to export a standalone tool object.
 * v1.3.0 (2025-06-09): Рефакторинг. Обработчик теперь возвращает сгенерированный текст.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactText } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactText } from '@/lib/db/schema'

const logger = createLogger('artifacts:kinds:text:server')

// =============================================================================
// Spectrum SCHEMA-DRIVEN CMS: Функции для работы с A_Text таблицей
// =============================================================================

/**
 * @description Сохраняет текстовый артефакт в специализированную таблицу A_Text
 * @feature Автоматический подсчет слов и символов
 * @param artifact - Базовая информация об артефакте
 * @param content - Текстовый контент для сохранения
 * @param language - Язык программирования (для code артефактов)
 * @returns Promise с результатом операции
 * @throws Ошибка если сохранение не удалось
 */
export async function saveTextArtifact(
  artifact: Artifact, 
  content: string, 
  language?: string
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    // Подсчет метрик текста
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
    const charCount = content.length
    
    childLogger.info({ 
      wordCount, 
      charCount, 
      language,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    }, 'Saving text artifact to A_Text table')
    
    await db.insert(artifactText).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      content,
      wordCount,
      charCount,
      language: language || (artifact.kind === 'code' ? 'javascript' : undefined)
    }).onConflictDoUpdate({
      target: [artifactText.artifactId, artifactText.createdAt],
      set: {
        content,
        wordCount,
        charCount,
        language: language || (artifact.kind === 'code' ? 'javascript' : undefined)
      }
    })
    
    childLogger.info('Text artifact saved successfully to A_Text table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to save text artifact to A_Text table')
    
    throw error
  }
}

/**
 * @description Загружает данные текстового артефакта из таблицы A_Text
 * @param artifactId - ID артефакта для загрузки
 * @param createdAt - Timestamp версии артефакта (composite key)
 * @returns Promise с данными текстового артефакта или null
 */
export async function loadTextArtifact(artifactId: string, createdAt: Date): Promise<ArtifactText | null> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.debug('Loading text artifact from A_Text table')
    
    const result = await db.select().from(artifactText)
      .where(and(
        eq(artifactText.artifactId, artifactId),
        eq(artifactText.createdAt, createdAt)
      ))
      .limit(1)
    
    const textData = result[0] || null
    
    if (textData) {
      childLogger.info({ 
        wordCount: textData.wordCount,
        charCount: textData.charCount,
        language: textData.language,
        contentPreview: textData.content?.substring(0, 100) + (textData.content && textData.content.length > 100 ? '...' : '')
      }, 'Text artifact loaded successfully from A_Text table')
    } else {
      childLogger.warn('Text artifact not found in A_Text table')
    }
    
    return textData
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to load text artifact from A_Text table')
    
    throw error
  }
}

/**
 * @description Удаляет данные текстового артефакта из таблицы A_Text
 * @param artifactId - ID артефакта для удаления
 * @param createdAt - Timestamp версии артефакта (composite key)
 * @returns Promise с результатом операции
 */
export async function deleteTextArtifact(artifactId: string, createdAt: Date): Promise<void> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.info('Deleting text artifact from A_Text table')
    
    await db.delete(artifactText)
      .where(and(
        eq(artifactText.artifactId, artifactId),
        eq(artifactText.createdAt, createdAt)
      ))
    
    childLogger.info('Text artifact deleted successfully from A_Text table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to delete text artifact from A_Text table')
    
    throw error
  }
}

// Алиас для code артефактов (используют ту же A_Text таблицу)
export const saveCodeArtifact = saveTextArtifact
export const loadCodeArtifact = loadTextArtifact
export const deleteCodeArtifact = deleteTextArtifact

// =============================================================================
// Spectrum SCHEMA-DRIVEN CMS: Экспорт tools для использования в artifact-tools.ts
// =============================================================================

/**
 * @description Text artifact tool с поддержкой Spectrum schema-driven операций
 * @feature Поддержка как legacy AI операций, так и новых save/load/delete
 */
export const textTool = {
  kind: 'text' as const,
  // Legacy AI operations (для совместимости с существующими тестами)
  create: async () => {
    throw new Error('textTool.create is deprecated - use AI tools instead')
  },
  update: async () => {
    throw new Error('textTool.update is deprecated - use AI tools instead') 
  },
  // Spectrum Schema-Driven операции с адаптацией metadata
  save: async (artifact: Artifact, content: string, metadata?: Record<string, any>) => {
    return saveTextArtifact(artifact, content, metadata?.language)
  },
  load: loadTextArtifact,
  delete: deleteTextArtifact,
}

/**
 * @description Code artifact tool (alias for textTool)
 * @feature Code артефакты используют ту же A_Text таблицу с language полем
 */
export const codeTool = {
  kind: 'code' as const,
  // Legacy AI operations (для совместимости)
  create: async () => {
    throw new Error('codeTool.create is deprecated - use AI tools instead')
  },
  update: async () => {
    throw new Error('codeTool.update is deprecated - use AI tools instead')
  },
  // Spectrum Schema-Driven операции с адаптацией metadata
  save: async (artifact: Artifact, content: string, metadata?: Record<string, any>) => {
    return saveCodeArtifact(artifact, content, metadata?.language)
  },
  load: loadCodeArtifact,
  delete: deleteCodeArtifact,
}

// END OF: artifacts/kinds/text/server.ts