/**
 * @file app/api/dev/load-world/route.ts
 * @description API endpoint для загрузки данных тестового мира в dev базу данных
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Создание API для загрузки миров из DevWorldSelector
 */

/** HISTORY:
 * v1.0.0 (2025-06-28): Создание API endpoint для загрузки данных миров в БД
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getWorldDefinition, validateWorld } from '@/tests/helpers/worlds.config'
import type { WorldId } from '@/tests/helpers/worlds.config'

export async function POST(request: NextRequest) {
  // Проверяем что это dev окружение
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    const { worldId } = await request.json()

    if (!worldId) {
      return NextResponse.json({ error: 'worldId is required' }, { status: 400 })
    }

    // Валидация мира
    try {
      validateWorld(worldId as WorldId)
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid world', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 400 })
    }

    const worldDef = getWorldDefinition(worldId as WorldId)

    // TODO: Интеграция с SeedEngine для загрузки данных
    // Пока имитируем загрузку данных через создание пользователя
    
    // Создаем пользователя Maria Garcia если это CONTENT_LIBRARY_BASE мир
    if (worldId === 'CONTENT_LIBRARY_BASE') {
      try {
        const { createUser } = await import('@/lib/db/queries')
        const mariaUser = worldDef.users[0] // user-maria
        
        // Попробуем создать пользователя (если уже существует - игнорируем ошибку)
        try {
          await createUser(mariaUser.email, 'temp-password')
          console.log('✅ User Maria Garcia created:', mariaUser)
        } catch (userError) {
          console.log('ℹ️ User Maria Garcia already exists:', userError)
        }
        
        // TODO: Создать артефакты Maria с world_id = CONTENT_LIBRARY_BASE
        console.log('📦 Need to create', worldDef.artifacts.length, 'artifacts for Maria Garcia')
        
      } catch (error) {
        console.error('❌ Failed to load Maria Garcia data:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'World loading initiated',
      world: {
        id: worldDef.id,
        name: worldDef.name,
        description: worldDef.description,
        usersCount: worldDef.users.length,
        artifactsCount: worldDef.artifacts.length,
        chatsCount: worldDef.chats.length
      },
      note: 'Basic user creation implemented. Full artifact seeding coming in Phase 2'
    })

  } catch (error) {
    console.error('World loading failed:', error)
    return NextResponse.json({ 
      error: 'World loading failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// END OF: app/api/dev/load-world/route.ts