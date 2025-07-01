/**
 * @file lib/test-auth.ts
 * @description Универсальная auth система с поддержкой тестовых и production sessions
 * @version 2.1.0
 * @created 2025-06-15
 * @purpose Обертка над NextAuth для поддержки test-session cookies в мультидоменной архитектуре
 * 
 * МУЛЬТИДОМЕННАЯ АРХИТЕКТУРА:
 * - app.localhost:port - административная панель
 * - localhost:port - публичный сайт  
 * - Тестовые cookies работают через оба домена (.localhost)
 * 
 * HISTORY:
 * v2.1.0 (2025-06-27): Исправлено несоответствие логики isTestEnv с middleware.ts - добавлена проверка PLAYWRIGHT_PORT
 * v2.0.0 (2025-06-15): Добавлена универсальная getAuthSession с fallback на NextAuth
 * v1.0.0 (2025-06-15): Создание custom auth для тестов
 */

import { cookies, headers } from 'next/headers.js';
import type { Session } from 'next-auth';

// Conditional NextAuth import only for production
let auth: any = null;
try {
  // APP_STAGE-based detection: только в PROD окружении
  const stage = process.env.APP_STAGE || 'PROD';
  if (stage === 'PROD' && !process.env.PLAYWRIGHT_PORT) {
    auth = require('@/app/app/(auth)/auth').auth;
  }
} catch (error) {
  console.log('NextAuth auth not available - using test-session only');
}

/**
 * Универсальная функция для получения auth session
 * В тестах проверяет test-session cookies, иначе использует NextAuth
 * 
 * @returns Promise<Session | null>
 */
export async function getAuthSession(): Promise<Session | null> {
  // Сначала проверяем тестовую session
  const testSession = await getTestSession();
  if (testSession) {
    return testSession;
  }
  
  // Fallback на стандартную NextAuth session (только в production)
  if (auth) {
    return await auth();
  }
  
  return null;
}

/**
 * Получает тестовую session из cookies (только в тестовой среде)
 */
export async function getTestSession(): Promise<Session | null> {
  // Проверяем тестовое окружение через env или заголовки
  const headerStore = await headers();
  const testHeader = headerStore.get('X-Test-Environment');
  
  // APP_STAGE-based environment detection (PHOENIX PROJECT)
  const stage = process.env.APP_STAGE || 'PROD';
  const isTestEnv = stage === 'LOCAL' || stage === 'BETA';
  
  if (!isTestEnv) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    
    // Проверяем оба типа тестовых cookies (мультидоменная поддержка)
    let testSessionCookie = cookieStore.get('test-session');
    if (!testSessionCookie) {
      testSessionCookie = cookieStore.get('test-session-fallback');
    }
    
    if (!testSessionCookie) {
      console.log('⚠️ No test session cookies found in getTestSession');
      return null;
    }

    const sessionData = JSON.parse(testSessionCookie.value);
    
    // Проверяем срок действия
    if (new Date(sessionData.expires) < new Date()) {
      console.log('⚠️ Test session expired');
      return null;
    }

    console.log('✅ Test session found for user:', sessionData.user.email);
    
    return {
      user: {
        ...sessionData.user,
        id: sessionData.user.id || '00000000-0000-0000-0000-000000000000'
      },
      expires: sessionData.expires
    };
  } catch (error) {
    console.log('❌ Error parsing test session in getTestSession:', error);
    return null;
  }
}

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || 
         process.env.PLAYWRIGHT === 'true' ||
         typeof process !== 'undefined' && 
         process.env.NODE_ENV === 'development' &&
         (global as any).__PLAYWRIGHT_TEST__;
}