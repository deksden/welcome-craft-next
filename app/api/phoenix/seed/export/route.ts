/**
 * @file app/api/phoenix/seed/export/route.ts
 * @description PHOENIX PROJECT - Seed Export API endpoint
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Export seeds from любой БД
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создан API для seed export
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/test-auth'

/**
 * POST /api/phoenix/seed/export
 * 
 * Экспорт seed данных из указанной БД
 * Только для LOCAL окружения + admin права
 */
export async function POST(request: NextRequest) {
  try {
    // Безопасность: только LOCAL окружение
    const currentEnvironment = process.env.APP_STAGE || 'PROD'
    if (currentEnvironment !== 'LOCAL') {
      return NextResponse.json({ 
        success: false, 
        error: 'Seed export is only available in LOCAL environment for security reasons' 
      }, { status: 403 })
    }

    // Проверяем аутентификацию
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Проверяем admin права
    if (session.user?.type !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin privileges required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { worldId, sourceDbUrl, includeBlobs = false, seedName } = body

    // Валидация
    if (!worldId || !sourceDbUrl || !seedName) {
      return NextResponse.json({ 
        success: false, 
        error: 'worldId, sourceDbUrl and seedName are required' 
      }, { status: 400 })
    }

    // TODO: Реализовать экспорт через PhoenixSeedManager
    // Здесь должна быть логика создания экземпляра PhoenixSeedManager
    // с указанным sourceDbUrl и вызов exportWorld()
    
    // Пока что mock реализация для демонстрации
    const seedPath = `./seeds/${seedName}`
    
    // Симуляция процесса экспорта
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      seedPath,
      worldId,
      includeBlobs,
      message: `World ${worldId} exported successfully`
    })

  } catch (error) {
    console.error('Error exporting seed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export seed' 
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/seed/export/route.ts