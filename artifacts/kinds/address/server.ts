/**
 * @file artifacts/kinds/address/server.ts
 * @description Серверный обработчик для артефактов типа "адрес".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан новый тип артефакта для структурированных адресов.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Создан новый обработчик для address артефактов с поддержкой A_Address таблицы и геолокации.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactAddress } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactAddress } from '@/lib/db/schema'
import type { ArtifactAddressData } from '@/lib/types'

const logger = createLogger('artifacts:kinds:address:server')

/**
 * @description Сохраняет address артефакт в специализированную таблицу A_Address
 * @feature Поддержка геолокации и часовых поясов
 */
export async function saveAddressArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const childLogger = logger.child({ artifactId: artifact.id, kind: artifact.kind })
  
  try {
    let addressData: ArtifactAddressData
    
    try {
      addressData = { ...JSON.parse(content), ...metadata }
    } catch {
      // Используем content как streetAddress
      addressData = {
        streetAddress: content || 'Unknown Address',
        city: metadata?.city || 'Unknown City',
        country: metadata?.country || 'Unknown Country',
        ...metadata
      }
    }
    
    if (!addressData.streetAddress || !addressData.city || !addressData.country) {
      throw new Error('Address requires streetAddress, city, and country')
    }
    
    childLogger.info({ 
      streetAddress: addressData.streetAddress,
      city: addressData.city,
      country: addressData.country,
      hasCoordinates: !!(addressData.latitude && addressData.longitude)
    }, 'Saving address artifact to A_Address table')
    
    await db.insert(artifactAddress).values({
      artifactId: artifact.id,
      createdAt: artifact.createdAt,
      streetAddress: addressData.streetAddress,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      timezone: addressData.timezone
    }).onConflictDoUpdate({
      target: [artifactAddress.artifactId, artifactAddress.createdAt],
      set: {
        streetAddress: addressData.streetAddress,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        timezone: addressData.timezone
      }
    })
    
    childLogger.info('Address artifact saved successfully to A_Address table')
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error)
    }, 'Failed to save address artifact to A_Address table')
    throw error
  }
}

export async function loadAddressArtifact(artifactId: string, createdAt: Date): Promise<ArtifactAddress | null> {
  const result = await db.select().from(artifactAddress)
    .where(and(
      eq(artifactAddress.artifactId, artifactId),
      eq(artifactAddress.createdAt, createdAt)
    ))
    .limit(1)
  return result[0] || null
}

export async function deleteAddressArtifact(artifactId: string, createdAt: Date): Promise<void> {
  await db.delete(artifactAddress)
    .where(and(
      eq(artifactAddress.artifactId, artifactId),
      eq(artifactAddress.createdAt, createdAt)
    ))
}

/**
 * @description Address artifact tool с поддержкой UC-10 schema-driven операций
 * @feature Только save/load/delete операции, без AI create/update
 */
export const addressTool = {
  kind: 'address' as const,
  save: saveAddressArtifact,
  load: loadAddressArtifact,
  delete: deleteAddressArtifact,
}

// END OF: artifacts/kinds/address/server.ts