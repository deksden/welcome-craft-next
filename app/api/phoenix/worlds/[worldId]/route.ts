/**
 * @file app/api/phoenix/worlds/[worldId]/route.ts
 * @description PHOENIX PROJECT - API для управления конкретным тестовым миром
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 3 - Individual World Management API
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 3 - CRUD операции для отдельного мира
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { worldMeta } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{
    worldId: string
  }>
}

/**
 * GET /api/phoenix/worlds/[worldId] - Получение конкретного мира
 * 
 * @feature PHOENIX PROJECT - Dynamic World Retrieval
 * @param worldId - Уникальный идентификатор мира
 * @returns WorldMeta record или 404
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { worldId } = await params

    const [world] = await db
      .select()
      .from(worldMeta)
      .where(eq(worldMeta.id, worldId))
      .limit(1)

    if (!world) {
      return NextResponse.json(
        { 
          success: false, 
          error: `World '${worldId}' not found` 
        },
        { status: 404 }
      )
    }

    // Обновляем lastUsedAt при каждом обращении
    await db
      .update(worldMeta)
      .set({ 
        lastUsedAt: new Date(),
        usageCount: world.usageCount + 1
      })
      .where(eq(worldMeta.id, worldId))

    console.log(`🌍 PHOENIX API: Retrieved world '${worldId}'`, {
      name: world.name,
      environment: world.environment,
      usageCount: world.usageCount + 1
    })

    return NextResponse.json({
      success: true,
      data: { ...world, usageCount: world.usageCount + 1 }
    })

  } catch (error) {
    const { worldId } = await params
    console.error(`❌ PHOENIX API: Error retrieving world '${worldId}':`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve world',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/phoenix/worlds/[worldId] - Обновление мира
 * 
 * @feature PHOENIX PROJECT - Dynamic World Updates
 * @param worldId - Уникальный идентификатор мира
 * @returns Updated WorldMeta record
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { worldId } = await params
    const body = await request.json()

    // Проверяем что мир существует
    const [existingWorld] = await db
      .select()
      .from(worldMeta)
      .where(eq(worldMeta.id, worldId))
      .limit(1)

    if (!existingWorld) {
      return NextResponse.json(
        { 
          success: false, 
          error: `World '${worldId}' not found` 
        },
        { status: 404 }
      )
    }

    // Подготавливаем данные для обновления
    const updateData: any = {
      updatedAt: new Date()
    }

    // Обновляем только переданные поля
    const allowedFields = [
      'name', 'description', 'users', 'artifacts', 'chats', 'settings',
      'dependencies', 'isActive', 'isTemplate', 'autoCleanup', 'cleanupAfterHours',
      'environment', 'isolationLevel', 'tags', 'category', 'version'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const [updatedWorld] = await db
      .update(worldMeta)
      .set(updateData)
      .where(eq(worldMeta.id, worldId))
      .returning()

    console.log(`🌍 PHOENIX API: Updated world '${worldId}'`, {
      name: updatedWorld.name,
      updatedFields: Object.keys(updateData)
    })

    return NextResponse.json({
      success: true,
      data: updatedWorld,
      message: `World '${worldId}' updated successfully`
    })

  } catch (error) {
    const { worldId } = await params
    console.error(`❌ PHOENIX API: Error updating world '${worldId}':`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update world',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/phoenix/worlds/[worldId] - Удаление мира
 * 
 * @feature PHOENIX PROJECT - Dynamic World Deletion
 * @param worldId - Уникальный идентификатор мира
 * @returns Success confirmation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { worldId } = await params

    // Проверяем что мир существует
    const [existingWorld] = await db
      .select()
      .from(worldMeta)
      .where(eq(worldMeta.id, worldId))
      .limit(1)

    if (!existingWorld) {
      return NextResponse.json(
        { 
          success: false, 
          error: `World '${worldId}' not found` 
        },
        { status: 404 }
      )
    }

    // Удаляем мир
    await db
      .delete(worldMeta)
      .where(eq(worldMeta.id, worldId))

    console.log(`🌍 PHOENIX API: Deleted world '${worldId}'`, {
      name: existingWorld.name,
      environment: existingWorld.environment
    })

    return NextResponse.json({
      success: true,
      message: `World '${worldId}' deleted successfully`,
      deletedWorld: {
        id: existingWorld.id,
        name: existingWorld.name
      }
    })

  } catch (error) {
    const { worldId } = await params
    console.error(`❌ PHOENIX API: Error deleting world '${worldId}':`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete world',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// END OF: app/api/phoenix/worlds/[worldId]/route.ts