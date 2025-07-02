/**
 * @file artifacts/kinds/address/server.ts
 * @description Серверный обработчик для артефактов типа "адрес".
 * @version 1.0.0
 * @date 2025-06-20
 * @updated Spectrum SCHEMA-DRIVEN CMS - Создан новый тип артефакта для структурированных адресов.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): Spectrum SCHEMA-DRIVEN CMS - Создан новый обработчик для address артефактов с поддержкой A_Address таблицы и геолокации.
 */

import { createLogger } from '@fab33/fab-logger'
import { db } from '@/lib/db'
import { artifactAddress } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Artifact, ArtifactAddress } from '@/lib/db/schema'
import type { ArtifactAddressData } from '@/lib/types'
import type { Session } from 'next-auth'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

const logger = createLogger('artifacts:kinds:address:server')

// =============================================================================
// Zod Schema for AI Generation
// =============================================================================

const AddressSchema = z.object({
  name: z.string().describe('Название места/офиса'),
  street: z.string().describe('Улица и номер дома'),
  city: z.string().describe('Город'),
  region: z.string().optional().describe('Регион/область'),
  postalCode: z.string().optional().describe('Почтовый индекс'),
  country: z.string().describe('Страна'),
  timezone: z.string().optional().describe('Часовой пояс'),
  instructions: z.string().optional().describe('Инструкции по проходу')
})

// =============================================================================
// AI OPERATION: Create Address
// =============================================================================

/**
 * @description AI-генерация адреса на основе промпта пользователя
 * @param props - Параметры создания (id, title, prompt, session)
 * @returns Promise<string> - JSON строка с данными адреса
 */
export async function createAddressArtifact(props: {
  id: string;
  title: string;
  prompt: string;
  session: Session;
}): Promise<string> {
  const childLogger = logger.child({ artifactId: props.id, kind: 'address' })
  
  try {
    childLogger.info({ prompt: props.prompt }, 'AI создание адреса')
    
    const result = await generateObject({
      model: google('gemini-1.5-flash'),
      system: `Ты - эксперт по созданию структурированных адресов для корпоративных офисов.
      Создай полную адресную информацию на основе запроса пользователя.
      
      Правила:
      - Создай реалистичный и полный адрес
      - Добавь полезную информацию для посетителей
      - Укажи часовой пояс если возможно
      - Добавь инструкции по проходу если уместно`,
      prompt: `Создай адрес офиса: ${props.prompt}`,
      schema: AddressSchema
    })
    
    const addressData = {
      name: result.object.name,
      street: result.object.street,
      city: result.object.city,
      region: result.object.region || undefined,
      postalCode: result.object.postalCode || undefined,
      country: result.object.country,
      timezone: result.object.timezone || undefined,
      instructions: result.object.instructions || undefined
    }
    
    childLogger.info({ 
      name: addressData.name,
      city: addressData.city,
      country: addressData.country
    }, 'Адрес успешно создан AI')
    
    return JSON.stringify(addressData)
  } catch (error) {
    childLogger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Ошибка AI создания адреса')
    
    throw error
  }
}

// =============================================================================
// Spectrum SCHEMA-DRIVEN CMS: Функции для работы с A_Address таблицей
// =============================================================================

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
 * @description Address artifact tool с поддержкой AI + Spectrum schema-driven операций
 * @feature AI create + save/load/delete операции
 */
export const addressTool = {
  kind: 'address' as const,
  // AI операции
  create: createAddressArtifact,
  // Spectrum Schema-Driven операции
  save: saveAddressArtifact,
  load: loadAddressArtifact,
  delete: deleteAddressArtifact,
}

// END OF: artifacts/kinds/address/server.ts