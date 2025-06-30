/**
 * @file app/api/phoenix/seed/validate/route.ts
 * @description PHOENIX PROJECT - API endpoint для валидации seed данных
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Phase 3: Создан API endpoint для seed validation
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан API endpoint для валидации seed данных
 */

import { type NextRequest, NextResponse } from 'next/server'
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager'

/**
 * POST /api/phoenix/seed/validate
 * 
 * Валидирует структуру seed данных:
 * - Проверяет наличие seed.json файла
 * - Валидирует JSON схему
 * - Проверяет корректность метаданных
 * - Проверяет доступность blob файлов
 * 
 * @param seedPath - Путь к seed директории
 * @returns {object} JSON response с результатом валидации
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seedPath } = body
    
    if (!seedPath) {
      return NextResponse.json({
        success: false,
        error: 'Seed path is required'
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
      // Выполняем валидацию seed
      const isValid = await seedManager.validateSeed(seedPath)
      
      await seedManager.close()
      
      return NextResponse.json({
        success: true,
        isValid,
        message: isValid ? 'Seed validation passed' : 'Seed validation failed',
        details: isValid ? 'Seed structure is correct and ready for import' : 'Seed has structural issues'
      })
      
    } catch (error) {
      await seedManager.close()
      throw error
    }
    
  } catch (error) {
    console.error('Error in seed validate API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate seed data'
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/seed/validate/route.ts