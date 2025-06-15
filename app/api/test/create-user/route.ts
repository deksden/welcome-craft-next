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
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const [user] = await createUser(email, password);
    
    return NextResponse.json({ 
      success: true, 
      email,
      userId: user.id 
    });
  } catch (error) {
    console.error('Test create user error:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}