/**
 * @file app/api/test/auth-signin/route.ts
 * @description Тестовый endpoint для мультидоменной аутентификации в Playwright + DevWorldSelector
 * @version 3.1.0
 * @created 2025-06-15
 * @purpose ВРЕМЕННЫЙ - создание сессии для всех доменов архитектуры
 * 
 * ИСТОРИЯ:
 * v3.1.0 (2025-06-28): Поддержка DevWorldSelector - разрешен доступ в development режиме
 * v3.0.0 (2025-06-15): Исправление мультидоменной архитектуры - cookies для app.localhost и localhost
 * v2.0.0 (2025-06-15): Упрощение подхода - прямое создание сессии
 * v1.0.0 (2025-06-15): Попытка использовать Auth.js JWT encoder
 * 
 * МУЛЬТИДОМЕННАЯ АРХИТЕКТУРА:
 * - app.localhost:port - административная панель (UI приложения)
 * - localhost:port - публичный сайт (landing page) 
 * - Middleware routing: app.localhost -> /app/* routes, localhost -> /site/* routes
 * - Тестовые cookies должны работать на обоих доменах
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Проверяем что это тестовое окружение
  const testHeader = request.headers.get('X-Test-Environment');
  const isTestEnv = process.env.NODE_ENV === 'test' || 
                    process.env.NODE_ENV === 'development' || // Разрешаем в dev режиме
                    process.env.PLAYWRIGHT === 'true' || 
                    testHeader === 'playwright' ||
                    testHeader === 'dev-world-selector'; // Разрешаем для DevWorldSelector
  
  if (!isTestEnv) {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const { email, userId, userType, name, worldId } = await request.json();

    // Проверяем что email предоставлен
    if (!email) {
      return NextResponse.json({ error: 'email is required for test authentication' }, { status: 400 });
    }

    // userId генерируется автоматически если не предоставлен
    const finalUserId = userId || `test-user-${Date.now()}`;

    // Создаем test session data для мультидоменной архитектуры
    const sessionData = {
      user: {
        id: finalUserId,
        email,
        name: name || email,
        type: userType || 'user'  // Правильно передается userType из Quick Login
      },
      worldId: worldId || null, // Поддержка world ID для dev selector
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 дней
    };

    const response = NextResponse.json({
      success: true,
      user: sessionData.user
    });

    const cookieData = JSON.stringify(sessionData);
    const cookieOptions = {
      httpOnly: false, // ВАЖНО: false для test-session чтобы JavaScript мог читать cookie
      secure: false, // false для localhost в development
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 дней
    };

    // КРИТИЧНО: Устанавливаем cookies для мультидоменной архитектуры
    // 1. Cookie без domain - для текущего точного хоста (primary)
    response.cookies.set('test-session', cookieData, {
      ...cookieOptions
      // без domain - устанавливается для текущего хоста (app.localhost:3000)
    });
    
    // 2. Cookie с .localhost domain - для кроссдоменности (fallback)
    response.cookies.set('test-session-fallback', cookieData, {
      ...cookieOptions,
      domain: '.localhost' // поддерживает app.localhost и localhost (если браузер разрешает)
    });

    // worldId уже включен в sessionData, отдельный cookie не нужен

    return response;
  } catch (error) {
    console.error('Test auth signin error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}