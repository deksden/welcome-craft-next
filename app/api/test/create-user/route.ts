/**
 * @file app/api/test/create-user/route.ts
 * @description API endpoint для создания пользователей в тестах
 * @author Claude Code
 * @created 13.06.2025
 * @purpose ТЕСТОВЫЙ - создание пользователей для API тестов
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  // Проверяем что это тестовое окружение
  const testHeader = request.headers.get('X-Test-Environment');
  const isTestEnv = process.env.NODE_ENV === 'test' || 
                    process.env.PLAYWRIGHT === 'true' || 
                    testHeader === 'playwright';
  
  if (!isTestEnv) {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const { id, email, password, type, worldId } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Если передан конкретный ID, используем прямую вставку в БД
    if (id) {
      const { db } = await import('@/lib/db');
      const { user: userTable } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');
      
      // Проверяем, существует ли уже пользователь
      const existingUser = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
      
      if (existingUser.length > 0) {
        // Обновляем существующего пользователя, если передан новый тип
        if (type && existingUser[0].type !== type) {
          await db.update(userTable).set({ 
            type: type,
            world_id: worldId || existingUser[0].world_id
          }).where(eq(userTable.id, id));
        }
        
        return NextResponse.json({
          success: true,
          message: 'User already exists and updated',
          email: existingUser[0].email,
          userId: existingUser[0].id,
          type: type || existingUser[0].type
        });
      }

      // Создаем пользователя с конкретным ID
      const [user] = await db.insert(userTable).values({
        id,
        email,
        password, // В тестах храним простой пароль
        type: type || 'user', // Поддержка admin типа
        world_id: worldId || null // Поддержка world isolation
      }).returning({
        id: userTable.id,
        email: userTable.email,
        type: userTable.type
      });

      return NextResponse.json({ 
        success: true, 
        message: 'User created with specific ID',
        email: user.email,
        userId: user.id,
        type: user.type
      });
    } else {
      // Используем стандартную функцию создания пользователя
      const [user] = await createUser(email, password);
      
      return NextResponse.json({ 
        success: true, 
        message: 'User created with auto-generated ID',
        email,
        userId: user.id 
      });
    }
  } catch (error) {
    console.error('Test create user error:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}