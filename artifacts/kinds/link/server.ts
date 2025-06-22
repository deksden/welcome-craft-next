/**
 * @file artifacts/kinds/link/server.ts
 * @description Серверный обработчик для артефактов типа "ссылка".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан новый тип артефакта для ссылок с метаданными.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactLink } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactLink } from '@/lib/db/schema'
import type { ArtifactLinkData } from '@/lib/types'

const logger = createLogger('artifacts:kinds:link:server')

export async function saveLinkArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let linkData: ArtifactLinkData
    
    try {
      linkData = { ...JSON.parse(content), ...metadata }
    } catch {
      // Используем content как URL
      linkData = {
        url: content || 'https://example.com',
        title: artifact.title,
        ...metadata
      }
    }
    
    if (!linkData.url || !linkData.title) {
      throw new Error('Link URL and title are required')
    }
    
    childLogger.info({ 
      url: linkData.url,
      title: linkData.title,
      category: linkData.category,
      isInternal: linkData.isInternal
    }, 'Saving link artifact to A_Link table')
    
    await db.insert(artifactLink).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      url: linkData.url,
      title: linkData.title,
      description: linkData.description,
      category: linkData.category,
      iconUrl: linkData.iconUrl,
      isInternal: linkData.isInternal || false
    }).onConflictDoUpdate({
      target: [artifactLink.artifactId, artifactLink.createdAt],
      set: {
        url: linkData.url,
        title: linkData.title,
        description: linkData.description,
        category: linkData.category,
        iconUrl: linkData.iconUrl,
        isInternal: linkData.isInternal || false,
        updatedAt: new Date()
      }
    })
    
    childLogger.info('Link artifact saved successfully to A_Link table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to save link artifact to A_Link table')
    throw error
  }
}

export async function loadLinkArtifact(artifactId: string, createdAt: Date): Promise<ArtifactLink | null> {
  const result = await db.select().from(artifactLink)
    .where(and(
      eq(artifactLink.artifactId, artifactId),
      eq(artifactLink.createdAt, createdAt)
    ))
    .limit(1)
  return result[0] || null
}

export async function deleteLinkArtifact(artifactId: string, createdAt: Date): Promise<void> {
  await db.delete(artifactLink)
    .where(and(
      eq(artifactLink.artifactId, artifactId),
      eq(artifactLink.createdAt, createdAt)
    ))
}

/**
 * @description Link artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Только save/load/delete операции, без AI create/update
 */
export const linkTool = {
  kind: 'link' as const,
  save: saveLinkArtifact,
  load: loadLinkArtifact,
  delete: deleteLinkArtifact,
}

// END OF: artifacts/kinds/link/server.ts