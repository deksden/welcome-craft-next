/**
 * @file app/api/test/debug-session/route.ts
 * @description Debug endpoint для проверки состояния сессии в тестах
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/app/(auth)/auth';

export async function GET(request: NextRequest) {
  // Проверяем что это тестовое окружение
  const testHeader = request.headers.get('X-Test-Environment');
  const isTestEnv = process.env.NODE_ENV === 'test' || 
                    process.env.PLAYWRIGHT === 'true' || 
                    testHeader === 'playwright';
  
  if (!isTestEnv) {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const session = await auth();
    
    return NextResponse.json({ 
      hasSession: !!session,
      sessionUser: session?.user || null,
      cookies: request.headers.get('cookie') || 'No cookies',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ 
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}