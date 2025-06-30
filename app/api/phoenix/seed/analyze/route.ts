/**
 * @file app/api/phoenix/seed/analyze/route.ts
 * @description PHOENIX PROJECT - API endpoint для анализа конфликтов seed данных
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Phase 3: Создан API endpoint для conflict analysis
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан API endpoint для анализа конфликтов
 */

import { type NextRequest, NextResponse } from 'next/server'
import { PhoenixSeedManager } from '@/lib/phoenix/seed-manager'

/**
 * POST /api/phoenix/seed/analyze
 * 
 * Анализирует конфликты при импорте seed данных:
 * - Проверяет существование world
 * - Находит конфликтующие пользователи, артефакты, чаты
 * - Проверяет missing blob файлы
 * - Определяет orphaned blobs
 * 
 * @param seedPath - Путь к seed директории
 * @returns {object} JSON response с анализом конфликтов
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
      // Выполняем анализ конфликтов
      const conflicts = await seedManager.analyzeConflicts(seedPath)
      
      await seedManager.close()
      
      return NextResponse.json({
        success: true,
        conflicts: {
          worldExists: conflicts.worldExists,
          conflictingUsers: conflicts.conflictingUsers,
          conflictingArtifacts: conflicts.conflictingArtifacts,
          conflictingChats: conflicts.conflictingChats,
          orphanedBlobs: conflicts.orphanedBlobs,
          missingBlobs: conflicts.missingBlobs,
          // Дополнительная статистика для UI
          totalConflicts: conflicts.conflictingUsers.length + 
                          conflicts.conflictingArtifacts.length + 
                          conflicts.conflictingChats.length,
          hasConflicts: conflicts.worldExists || 
                       conflicts.conflictingUsers.length > 0 ||
                       conflicts.conflictingArtifacts.length > 0 ||
                       conflicts.conflictingChats.length > 0,
          riskLevel: (() => {
            const totalConflicts = conflicts.conflictingUsers.length + 
                                  conflicts.conflictingArtifacts.length + 
                                  conflicts.conflictingChats.length
            if (!conflicts.worldExists && totalConflicts === 0) return 'low'
            if (totalConflicts <= 3) return 'medium'
            return 'high'
          })()
        }
      })
      
    } catch (error) {
      await seedManager.close()
      throw error
    }
    
  } catch (error) {
    console.error('Error in seed analyze API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze conflicts'
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/seed/analyze/route.ts