/**
 * @file app/api/test/session/route.ts
 * @description Тестовый endpoint для проверки session в тестах
 * @version 1.0.0
 * @created 2025-06-15
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers.js';
import { auth } from '@/app/app/(auth)/auth';

export async function GET(request: NextRequest) {
  // Проверяем что это тестовое окружение
  const testHeader = request.headers.get('X-Test-Environment');
  const isTestEnv = process.env.NODE_ENV === 'test' || 
                    process.env.PLAYWRIGHT === 'true' || 
                    testHeader === 'playwright';

  try {
    // В тестах сначала проверяем тестовый cookie
    if (isTestEnv) {
      const cookieStore = await cookies();
      const testSession = cookieStore.get('test-session');
      
      if (testSession) {
        try {
          const sessionData = JSON.parse(testSession.value);
          if (sessionData.user && new Date(sessionData.expires) > new Date()) {
            return NextResponse.json({
              user: sessionData.user,
              expires: sessionData.expires
            });
          }
        } catch (error) {
          console.log('Error parsing test session:', error);
        }
      }
    }

    // Fallback к обычной NextAuth session
    const session = await auth();
    
    if (session?.user) {
      return NextResponse.json({
        user: session.user,
        expires: session.expires
      });
    }

    // Нет активной сессии
    return NextResponse.json({
      user: null,
      expires: null
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ 
      error: 'Session check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}