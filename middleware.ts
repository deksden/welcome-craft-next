/**
 * @file middleware.ts
 * @description Middleware для мультидоменной архитектуры WelcomeCraft
 * @version 2.0.0
 * 
 * МУЛЬТИДОМЕННАЯ АРХИТЕКТУРА:
 * - app.localhost:port - административная панель (основное приложение)
 *   Routes: /app/* (переписываются из / при запросе на app.localhost)
 *   Auth: Требуется аутентификация через NextAuth.js или test-session
 *   
 * - localhost:port - публичный сайт (landing page)
 *   Routes: /site/* (переписываются из / при запросе на localhost)
 *   Auth: Публичный доступ, аутентификация не требуется
 * 
 * ВАЖНО: Cookies и auth session должны работать между доменами!
 * В тестах используются test-session cookies с domain='.localhost'  
 * 
 * ИСТОРИЯ:
 * v2.0.0 (2025-06-15): Добавлена поддержка тестовых sessions, улучшена документация
 * v1.0.0: Базовая мультидоменная маршрутизация
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isDevelopmentEnvironment } from './lib/constants'

export async function middleware (request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? 'localhost:3000'

  // Определяем домен для админ-панели  
  const isAppDomain = process.env.NODE_ENV === 'production'
    ? hostname === 'app.welcome-onboard.ru'
    : hostname.startsWith('app.localhost')

  // Если это запрос к админ-панели
  if (isAppDomain) {
    // --- ИСПРАВЛЕНИЕ: Исключаем страницы входа/регистрации из проверки токена ---
    // Если пользователь уже идет на страницу входа или регистрации,
    // просто показываем ему ее, не проверяя токен.
    if (url.pathname === '/login' || url.pathname === '/register') {
      url.pathname = `/app${url.pathname}`
      return NextResponse.rewrite(url)
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    // Проверяем тестовый cookie в тестовом окружении
    const testHeader = request.headers.get('X-Test-Environment');
    const isTestEnv = process.env.NODE_ENV === 'test' || 
                      process.env.PLAYWRIGHT === 'true' || 
                      testHeader === 'playwright';
    
    let token = null;
    
    if (isTestEnv) {
      // В тестах проверяем тестовые cookies (поддержка мультидоменной архитектуры)
      // Сначала основной cookie для .localhost домена
      let testSession = request.cookies.get('test-session');
      // Fallback - cookie без domain для совместимости
      if (!testSession) {
        testSession = request.cookies.get('test-session-fallback');
      }

      if (testSession) {
        try {
          const sessionData = JSON.parse(testSession.value);
          if (sessionData.user && new Date(sessionData.expires) > new Date()) {
            // Эмулируем структуру NextAuth токена для совместимости
            token = {
              sub: sessionData.user.id,
              email: sessionData.user.email,
              name: sessionData.user.name,
              type: sessionData.user.type,
              exp: Math.floor(new Date(sessionData.expires).getTime() / 1000)
            };
            console.log('✅ Test session token created for:', sessionData.user.email);
          }
        } catch (error) {
          console.log('❌ Error parsing test session:', error);
        }
      } else {
        console.log('⚠️ No test session cookies found in middleware');
      }
    }
    
    // Fallback to regular NextAuth token if no test session
    if (!token) {
      token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: !isDevelopmentEnvironment,
      });
    }

    // Теперь эта проверка не будет вызывать цикл для /login
    if (!token) {
      const redirectUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${redirectUrl}`, request.url))
    }

    if (token.type === 'regular' && ['/login', '/register'].includes(url.pathname)) {
      // Этот блок может быть уже не нужен, так как мы обрабатываем /login выше,
      // но оставим для защиты от прямого перехода залогиненным пользователем.
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Переписываем путь на директорию (app)
    url.pathname = `/app${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Для всех остальных запросов (публичный сайт)
  url.pathname = `/site${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Исключаем ВСЕ api роуты, так как они теперь глобальные
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
