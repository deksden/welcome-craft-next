/**
 * @file artifacts/kinds/set/server.ts
 * @description Серверный обработчик для артефактов типа "набор" (коллекция элементов).
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан новый тип артефакта для наборов с упорядочиванием элементов.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactSetItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactSetItems } from '@/lib/db/schema'

const logger = createLogger('artifacts:kinds:set:server')

/**
 * Set артефакты не хранят данные в отдельной таблице, 
 * а используют A_SetItems для связей между элементами
 */

export async function saveSetArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let setItems: Array<{ itemId: string; order: number; metadata?: Record<string, any> }>
    
    try {
      const parsed = JSON.parse(content)
      setItems = parsed.items || []
    } catch {
      // Пустой набор
      setItems = []
    }
    
    childLogger.info({ 
      itemsCount: setItems.length
    }, 'Saving set artifact items to A_SetItems table')
    
    // Удаляем старые связи для этой версии
    await db.delete(artifactSetItems)
      .where(and(
        eq(artifactSetItems.setId, artifact.id),
        eq(artifactSetItems.setCreatedAt, artifact.createdAt)
      ))
    
    // Добавляем новые связи
    if (setItems.length > 0) {
      await db.insert(artifactSetItems).values(
        setItems.map(item => ({
          setId: artifact.id,
          setCreatedAt: artifact.createdAt,
          itemId: item.itemId,
          itemCreatedAt: new Date(), // TODO: должно быть из данных элемента
          order: item.order,
          metadata: item.metadata || {}
        }))
      )
    }
    
    childLogger.info('Set artifact saved successfully to A_SetItems table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to save set artifact to A_SetItems table')
    throw error
  }
}

export async function loadSetArtifact(artifactId: string, createdAt: Date): Promise<ArtifactSetItems[] | null> {
  const result = await db.select().from(artifactSetItems)
    .where(and(
      eq(artifactSetItems.setId, artifactId),
      eq(artifactSetItems.setCreatedAt, createdAt)
    ))
    .orderBy(artifactSetItems.order)
  
  return result.length > 0 ? result : null
}

export async function deleteSetArtifact(artifactId: string, createdAt: Date): Promise<void> {
  await db.delete(artifactSetItems)
    .where(and(
      eq(artifactSetItems.setId, artifactId),
      eq(artifactSetItems.setCreatedAt, createdAt)
    ))
}

/**
 * @description Set artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Только save/load/delete операции, без AI create/update
 */
export const setTool = {
  kind: 'set' as const,
  save: saveSetArtifact,
  load: loadSetArtifact,
  delete: deleteSetArtifact,
}

// END OF: artifacts/kinds/set/server.ts