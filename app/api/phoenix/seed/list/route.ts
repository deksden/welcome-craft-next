/**
 * @file app/api/phoenix/seed/list/route.ts
 * @description PHOENIX PROJECT - API endpoint для получения списка доступных seeds
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Phase 3: Создан API endpoint для GUI integration
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан API endpoint для списка seed данных
 */

import { type NextRequest, NextResponse } from 'next/server.js'
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

/**
 * GET /api/phoenix/seed/list
 * 
 * Возвращает список доступных seed директорий с метаданными:
 * - Список seed директорий
 * - Метаданные каждого seed (worldId, environment, статистика)
 * - Статус валидации
 * 
 * @returns {object} JSON response с списком seeds
 */
export async function GET(request: NextRequest) {
  try {
    // Инициализируем Seed Manager
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Database URL not configured'
      }, { status: 500 })
    }

    const seedManager = new PhoenixSeedManager(databaseUrl)
    
    try {
      // Получаем список seed директорий
      const seedNames = await seedManager.listSeeds()
      
      // Загружаем метаданные для каждого seed
      const seedsWithMetadata = await Promise.all(
        seedNames.map(async (seedName) => {
          try {
            const seedPath = join('./seeds', seedName)
            const seedFilePath = join(seedPath, 'seed.json')
            
            // Читаем seed.json
            const seedDataRaw = await readFile(seedFilePath, 'utf-8')
            const seedData = JSON.parse(seedDataRaw)
            
            // Валидируем seed
            const isValid = await seedManager.validateSeed(seedPath)
            
            return {
              name: seedName,
              worldId: seedData.world.metadata.id,
              environment: seedData.source.environment,
              createdAt: seedData.createdAt,
              users: seedData.world.users.length,
              artifacts: seedData.world.artifacts.length,
              chats: seedData.world.chats.length,
              blobs: seedData.world.blobs.length,
              isValid,
              description: seedData.world.metadata.description
            }
          } catch (error) {
            console.error(`Error processing seed ${seedName}:`, error)
            return {
              name: seedName,
              worldId: 'UNKNOWN',
              environment: 'UNKNOWN' as const,
              createdAt: new Date().toISOString(),
              users: 0,
              artifacts: 0,
              chats: 0,
              blobs: 0,
              isValid: false,
              description: 'Error loading seed metadata'
            }
          }
        })
      )
      
      // Сортируем по дате создания (новые первыми)
      seedsWithMetadata.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      await seedManager.close()
      
      return NextResponse.json({
        success: true,
        seeds: seedsWithMetadata,
        total: seedsWithMetadata.length
      })
      
    } catch (error) {
      await seedManager.close()
      throw error
    }
    
  } catch (error) {
    console.error('Error in seed list API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list seeds'
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/seed/list/route.ts