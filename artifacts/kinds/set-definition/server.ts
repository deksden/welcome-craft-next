/**
 * @file artifacts/kinds/set-definition/server.ts
 * @description Серверный обработчик для артефактов типа "определение набора".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан новый тип артефакта для определений наборов с валидацией.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactSetDefinition } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactSetDefinition } from '@/lib/db/schema'
import type { ArtifactSetDefinitionData } from '@/lib/types'

const logger = createLogger('artifacts:kinds:set-definition:server')

export async function saveSetDefinitionArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let setDefData: ArtifactSetDefinitionData
    
    try {
      setDefData = { ...JSON.parse(content), ...metadata }
    } catch {
      // Парсим из простого текста как comma-separated kinds
      const kinds = content.split(',').map(k => k.trim()).filter(Boolean)
      setDefData = {
        definition: {
          allowedKinds: kinds.length > 0 ? kinds : ['text']
        },
        validationRules: {},
        defaultSorting: 'createdAt',
        allowDuplicates: false,
        ...metadata
      }
    }
    
    if (!setDefData.definition || !setDefData.definition.allowedKinds) {
      throw new Error('Set definition with allowedKinds is required')
    }
    
    childLogger.info({ 
      allowedKinds: setDefData.definition.allowedKinds,
      maxItems: setDefData.definition.maxItems,
      defaultSorting: setDefData.defaultSorting
    }, 'Saving set definition artifact to A_SetDefinition table')
    
    await db.insert(artifactSetDefinition).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      definition: setDefData.definition,
      validationRules: setDefData.validationRules || {},
      defaultSorting: setDefData.defaultSorting || 'createdAt',
      allowDuplicates: setDefData.allowDuplicates || false
    }).onConflictDoUpdate({
      target: [artifactSetDefinition.artifactId, artifactSetDefinition.createdAt],
      set: {
        definition: setDefData.definition,
        validationRules: setDefData.validationRules || {},
        defaultSorting: setDefData.defaultSorting || 'createdAt',
        allowDuplicates: setDefData.allowDuplicates || false
      }
    })
    
    childLogger.info('Set definition artifact saved successfully to A_SetDefinition table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to save set definition artifact to A_SetDefinition table')
    throw error
  }
}

export async function loadSetDefinitionArtifact(artifactId: string, createdAt: Date): Promise<ArtifactSetDefinition | null> {
  const result = await db.select().from(artifactSetDefinition)
    .where(and(
      eq(artifactSetDefinition.artifactId, artifactId),
      eq(artifactSetDefinition.createdAt, createdAt)
    ))
    .limit(1)
  return result[0] || null
}

export async function deleteSetDefinitionArtifact(artifactId: string, createdAt: Date): Promise<void> {
  await db.delete(artifactSetDefinition)
    .where(and(
      eq(artifactSetDefinition.artifactId, artifactId),
      eq(artifactSetDefinition.createdAt, createdAt)
    ))
}

/**
 * @description Set definition artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Только save/load/delete операции, без AI create/update
 */
export const setDefinitionTool = {
  kind: 'set-definition' as const,
  save: saveSetDefinitionArtifact,
  load: loadSetDefinitionArtifact,
  delete: deleteSetDefinitionArtifact,
}

// END OF: artifacts/kinds/set-definition/server.ts