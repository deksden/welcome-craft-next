/**
 * @file app/api/phoenix/worlds/route.ts
 * @description PHOENIX PROJECT - API для управления тестовыми мирами
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 3 - Dynamic World Management API
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 3 - Создание API для CRUD операций с WorldMeta
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { worldMeta } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { WorldMeta } from '@/lib/db/schema'

/**
 * GET /api/phoenix/worlds - Получение списка миров
 * 
 * Query параметры:
 * - environment: LOCAL, BETA, PROD (фильтр по окружению)
 * - active: true/false (только активные миры)
 * - category: UC, REGRESSION, PERFORMANCE (фильтр по категории)
 * - template: true/false (только шаблоны)
 * 
 * @feature PHOENIX PROJECT - Dynamic World Management
 * @returns JSON array of WorldMeta records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment')
    const active = searchParams.get('active')
    const category = searchParams.get('category')
    const template = searchParams.get('template')

    // Строим WHERE условия
    const conditions = []
    
    if (environment) {
      conditions.push(eq(worldMeta.environment, environment))
    }
    
    if (active !== null) {
      conditions.push(eq(worldMeta.isActive, active === 'true'))
    }
    
    if (category) {
      conditions.push(eq(worldMeta.category, category))
    }
    
    if (template !== null) {
      conditions.push(eq(worldMeta.isTemplate, template === 'true'))
    }

    // Выполняем запрос
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
    const worlds = await db
      .select()
      .from(worldMeta)
      .where(whereCondition)
      .orderBy(desc(worldMeta.updatedAt))

    console.log(`🌍 PHOENIX API: Retrieved ${worlds.length} worlds`, {
      environment,
      active,
      category,
      template,
      conditions: conditions.length
    })

    return NextResponse.json({
      success: true,
      data: worlds,
      meta: {
        total: worlds.length,
        filters: { environment, active, category, template }
      }
    })

  } catch (error) {
    console.error('❌ PHOENIX API: Error retrieving worlds:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve worlds',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/phoenix/worlds - Создание нового мира
 * 
 * Request body:
 * {
 *   id: string,
 *   name: string,
 *   description: string,
 *   users: WorldUser[],
 *   artifacts: WorldArtifact[],
 *   chats: WorldChat[],
 *   settings: WorldSettings,
 *   environment?: 'LOCAL' | 'BETA' | 'PROD',
 *   category?: string,
 *   tags?: string[]
 * }
 * 
 * @feature PHOENIX PROJECT - Dynamic World Creation
 * @returns Created WorldMeta record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидация обязательных полей
    const requiredFields = ['id', 'name', 'description', 'users', 'artifacts', 'chats', 'settings']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        )
      }
    }

    // Проверяем что мир с таким ID не существует
    const existingWorld = await db
      .select()
      .from(worldMeta)
      .where(eq(worldMeta.id, body.id))
      .limit(1)

    if (existingWorld.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `World with ID '${body.id}' already exists` 
        },
        { status: 409 }
      )
    }

    // Создаем новый мир
    const newWorld = {
      id: body.id,
      name: body.name,
      description: body.description,
      users: body.users,
      artifacts: body.artifacts,
      chats: body.chats,
      settings: body.settings,
      dependencies: body.dependencies || [],
      environment: body.environment || 'LOCAL',
      category: body.category || 'GENERAL',
      tags: body.tags || [],
      isTemplate: body.isTemplate || false,
      autoCleanup: body.autoCleanup !== false, // Default true
      cleanupAfterHours: body.cleanupAfterHours || 24,
    }

    const [createdWorld] = await db
      .insert(worldMeta)
      .values(newWorld)
      .returning()

    console.log(`🌍 PHOENIX API: Created new world '${createdWorld.id}'`, {
      name: createdWorld.name,
      environment: createdWorld.environment,
      category: createdWorld.category
    })

    return NextResponse.json({
      success: true,
      data: createdWorld,
      message: `World '${createdWorld.id}' created successfully`
    }, { status: 201 })

  } catch (error) {
    console.error('❌ PHOENIX API: Error creating world:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create world',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/phoenix/worlds/route.ts