/**
 * @file artifacts/kinds/person/server.ts
 * @description Серверный обработчик для артефактов типа "персона" (HR-система).
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан новый тип артефакта для персон с полной информацией о сотрудниках.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Создан новый обработчик для person артефактов с поддержкой A_Person таблицы. Включает функции создания, сохранения, загрузки и удаления персон.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactPerson } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactPerson } from '@/lib/db/schema'
import type { ArtifactPersonData } from '@/lib/types'

const logger = createLogger('artifacts:kinds:person:server')

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Функции для работы с A_Person таблицей
// =============================================================================

/**
 * @description Сохраняет person артефакт в специализированную таблицу A_Person
 * @feature Поддержка полной информации о сотруднике для HR-системы
 * @param artifact - Базовая информация об артефакте
 * @param content - JSON строка с данными персоны или простой текст с fullName
 * @param metadata - Дополнительные метаданные персоны
 * @returns Promise с результатом операции
 * @throws Ошибка если сохранение не удалось
 */
export async function savePersonArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let personData: ArtifactPersonData
    
    // Парсим content как JSON или используем как fullName
    try {
      personData = { ...JSON.parse(content), ...metadata }
    } catch {
      // Если не JSON, используем content как fullName
      personData = {
        fullName: content || artifact.title,
        ...metadata
      }
    }
    
    // Валидация обязательных полей
    if (!personData.fullName) {
      throw new Error('Person fullName is required')
    }
    
    childLogger.info({ 
      fullName: personData.fullName,
      position: personData.position,
      department: personData.department,
      hasPhoto: !!personData.photoUrl,
      hasQuote: !!personData.quote
    }, 'Saving person artifact to A_Person table')
    
    await db.insert(artifactPerson).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      fullName: personData.fullName,
      position: personData.position,
      photoUrl: personData.photoUrl,
      quote: personData.quote,
      email: personData.email,
      phone: personData.phone,
      department: personData.department,
      location: personData.location
    }).onConflictDoUpdate({
      target: [artifactPerson.artifactId, artifactPerson.createdAt],
      set: {
        fullName: personData.fullName,
        position: personData.position,
        photoUrl: personData.photoUrl,
        quote: personData.quote,
        email: personData.email,
        phone: personData.phone,
        department: personData.department,
        location: personData.location
      }
    })
    
    childLogger.info('Person artifact saved successfully to A_Person table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to save person artifact to A_Person table')
    
    throw error
  }
}

/**
 * @description Загружает данные person артефакта из таблицы A_Person
 * @param artifactId - ID артефакта для загрузки
 * @returns Promise с данными person артефакта или null
 */
export async function loadPersonArtifact(artifactId: string, createdAt: Date): Promise<ArtifactPerson | null> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.debug('Loading person artifact from A_Person table')
    
    const result = await db.select().from(artifactPerson)
      .where(and(
        eq(artifactPerson.artifactId, artifactId),
        eq(artifactPerson.createdAt, createdAt)
      ))
      .limit(1)
    
    const personData = result[0] || null
    
    if (personData) {
      childLogger.info({ 
        fullName: personData.fullName,
        position: personData.position,
        department: personData.department,
        hasContactInfo: !!(personData.email || personData.phone)
      }, 'Person artifact loaded successfully from A_Person table')
    } else {
      childLogger.warn('Person artifact not found in A_Person table')
    }
    
    return personData
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to load person artifact from A_Person table')
    
    throw error
  }
}

/**
 * @description Удаляет данные person артефакта из таблицы A_Person
 * @param artifactId - ID артефакта для удаления
 * @returns Promise с результатом операции
 */
export async function deletePersonArtifact(artifactId: string, createdAt: Date): Promise<void> {
  const childLogger = logger.child({ artifactId, createdAt })
  
  try {
    childLogger.info('Deleting person artifact from A_Person table')
    
    await db.delete(artifactPerson)
      .where(and(
        eq(artifactPerson.artifactId, artifactId),
        eq(artifactPerson.createdAt, createdAt)
      ))
    
    childLogger.info('Person artifact deleted successfully from A_Person table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to delete person artifact from A_Person table')
    
    throw error
  }
}

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Экспорт tool для использования в artifact-tools.ts
// =============================================================================

/**
 * @description Person artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Только save/load/delete операции, без AI create/update
 */
export const personTool = {
  kind: 'person' as const,
  // UC-10 Schema-Driven операции
  save: savePersonArtifact,
  load: loadPersonArtifact,
  delete: deletePersonArtifact,
}

// END OF: artifacts/kinds/person/server.ts