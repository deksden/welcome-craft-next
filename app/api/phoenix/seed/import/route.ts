/**
 * @file app/api/phoenix/seed/import/route.ts
 * @description PHOENIX PROJECT - API endpoint для импорта seed данных
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Phase 3: Создан API endpoint для seed import с conflict resolution
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан API endpoint для импорта seed данных
 */

import { type NextRequest, NextResponse } from 'next/server.js'
import { PhoenixSeedManager, type ConflictStrategy } from '@/lib/phoenix/seed-manager'

/**
 * POST /api/phoenix/seed/import
 * 
 * Импортирует seed данные с разрешением конфликтов:
 * - Применяет выбранную стратегию разрешения конфликтов
 * - Импортирует world metadata, users, artifacts, chats
 * - Обрабатывает blob файлы (при наличии Vercel Blob API)
 * - Возвращает детальную информацию о результатах импорта
 * 
 * @param seedPath - Путь к seed директории
 * @param strategy - Стратегия разрешения конфликтов
 * @returns {object} JSON response с результатами импорта
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seedPath, strategy } = body
    
    if (!seedPath) {
      return NextResponse.json({
        success: false,
        error: 'Seed path is required'
      }, { status: 400 })
    }
    
    if (!strategy) {
      return NextResponse.json({
        success: false,
        error: 'Conflict resolution strategy is required'
      }, { status: 400 })
    }

    // Валидируем стратегию
    const validResolutions = ['replace', 'merge', 'skip']
    const validExtendedResolutions = [...validResolutions, 'overwrite', 'rename']
    
    if (!validResolutions.includes(strategy.world) ||
        !validExtendedResolutions.includes(strategy.users) ||
        !validExtendedResolutions.includes(strategy.artifacts) ||
        !validExtendedResolutions.includes(strategy.chats) ||
        !validExtendedResolutions.includes(strategy.blobs)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid conflict resolution strategy'
      }, { status: 400 })
    }

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
      // Выполняем импорт с заданной стратегией
      await seedManager.importSeed(seedPath, strategy as ConflictStrategy)
      
      // Получаем информацию об импортированных данных для отчета
      const seedDataPath = `${seedPath}/seed.json`
      let importStats = {
        worldId: 'unknown',
        usersImported: 0,
        artifactsImported: 0,
        chatsImported: 0,
        blobsImported: 0
      }
      
      try {
        const { readFile } = await import('node:fs/promises')
        const seedDataRaw = await readFile(seedDataPath, 'utf-8')
        const seedData = JSON.parse(seedDataRaw)
        
        importStats = {
          worldId: seedData.world.metadata.id,
          usersImported: seedData.world.users.length,
          artifactsImported: seedData.world.artifacts.length,
          chatsImported: seedData.world.chats.length,
          blobsImported: seedData.world.blobs.length
        }
      } catch (error) {
        console.warn('Could not read seed metadata for stats:', error)
      }
      
      await seedManager.close()
      
      return NextResponse.json({
        success: true,
        message: 'Seed data imported successfully',
        stats: importStats,
        appliedStrategy: strategy,
        importedAt: new Date().toISOString()
      })
      
    } catch (error) {
      await seedManager.close()
      throw error
    }
    
  } catch (error) {
    console.error('Error in seed import API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import seed data'
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/seed/import/route.ts