/**
 * @file app/api/phoenix/users/[id]/route.ts
 * @description PHOENIX PROJECT - User Management API для конкретного пользователя
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - PUT/DELETE операции для пользователя
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создан API для user management по ID
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/test-auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * PUT /api/phoenix/users/[id]
 * 
 * Обновить пользователя (смена роли)
 * Требует admin права
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    const { type, name } = body

    // Валидация
    if (type && !['user', 'admin'].includes(type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type must be either "user" or "admin"' 
      }, { status: 400 })
    }

    // Проверяем что пользователь существует
    const existingUser = await db.select().from(user).where(eq(user.id, id)).limit(1)
    if (existingUser.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Защищаем от случайного удаления admin прав у себя
    if (session.user.id === id && type === 'user') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot remove admin privileges from yourself' 
      }, { status: 400 })
    }

    // Обновляем пользователя
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (type) updateData.type = type
    if (name) updateData.name = name

    await db.update(user)
      .set(updateData)
      .where(eq(user.id, id))

    // Возвращаем обновленного пользователя
    const updatedUser = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }).from(user).where(eq(user.id, id)).limit(1)

    return NextResponse.json({
      success: true,
      user: updatedUser[0]
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update user' 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/phoenix/users/[id]
 * 
 * Удалить пользователя
 * Требует admin права
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Проверяем что пользователь существует
    const existingUser = await db.select().from(user).where(eq(user.id, id)).limit(1)
    if (existingUser.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Защищаем от самоудаления
    if (session.user.id === id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete yourself' 
      }, { status: 400 })
    }

    // Удаляем пользователя
    await db.delete(user).where(eq(user.id, id))

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete user' 
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/users/[id]/route.ts