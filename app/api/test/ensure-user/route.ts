/**
 * @file app/api/test/ensure-user/route.ts
 * @description Endpoint для создания/обновления предустановленных тестовых пользователей
 * @purpose Управление фиксированными пользователями для E2E тестов
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/db/queries';

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
    const { email, password, name, role } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name required' 
      }, { status: 400 });
    }

    // Проверяем существует ли пользователь
    const existingUsers = await getUser(email);
    
    if (existingUsers.length === 0) {
      // Создаем нового пользователя
      await createUser(email, password);
      console.log(`✅ Created test user: ${email} (${role})`);
    } else {
      console.log(`✅ Test user already exists: ${email} (${role})`);
    }
    
    return NextResponse.json({ 
      success: true, 
      email,
      name,
      role,
      action: existingUsers.length === 0 ? 'created' : 'exists'
    });
  } catch (error) {
    console.error('Test ensure user error:', error);
    return NextResponse.json({ 
      error: 'Failed to ensure user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}