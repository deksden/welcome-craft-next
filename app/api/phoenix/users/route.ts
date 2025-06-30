/**
 * @file app/api/phoenix/users/route.ts
 * @description PHOENIX PROJECT - User Management API endpoints
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - CRUD операции для управления пользователями
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создан API для user management
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/test-auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

/**
 * GET /api/phoenix/users
 * 
 * Получить список всех пользователей
 * Требует admin права
 */
export async function GET(request: NextRequest) {
  try {
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

    // Загружаем всех пользователей
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }).from(user)

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        ...user,
        // Не отдаем sensitive данные
        password: undefined
      }))
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch users' 
    }, { status: 500 })
  }
}

/**
 * POST /api/phoenix/users
 * 
 * Создать нового пользователя
 * Требует admin права
 */
export async function POST(request: NextRequest) {
  try {
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
    const { name, email, password, type = 'user' } = body

    // Валидация
    if (!name || !email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, email and password are required' 
      }, { status: 400 })
    }

    if (!['user', 'admin'].includes(type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Type must be either "user" or "admin"' 
      }, { status: 400 })
    }

    // Проверяем что email уникален
    const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1)
    if (existingUser.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12)

    // Создаем пользователя
    const userId = randomUUID()
    await db.insert(user).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Возвращаем созданного пользователя без пароля
    const newUser = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }).from(user).where(eq(user.id, userId)).limit(1)

    return NextResponse.json({
      success: true,
      user: newUser[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create user' 
    }, { status: 500 })
  }
}

// END OF: app/api/phoenix/users/route.ts