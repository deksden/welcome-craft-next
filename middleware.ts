/**
 * @file middleware.ts
 * @description Middleware для мультидоменной архитектуры WelcomeCraft
 * @version 2.2.0
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
 * UNIFIED COOKIE ARCHITECTURE:
 * - ТОЛЬКО test-session cookie используется для world isolation и аутентификации
 * - test-session-fallback как compatibility layer
 * - УБРАНЫ устаревшие cookies: world_id, world_id_fallback, test-world-id
 * 
 * ВАЖНО: Cookies и auth session должны работать между доменами!
 * В тестах используются test-session cookies с domain='.localhost'  
 * 
 * ИСТОРИЯ:
 * v2.2.0 (2025-06-28): UNIFIED COOKIE ARCHITECTURE - переход на единый test-session источник, убраны legacy cookies
 * v2.1.0 (2025-06-25): Исправлена проблема с определением admin домена в production режиме для localhost
 * v2.0.0 (2025-06-15): Добавлена поддержка тестовых sessions, улучшена документация
 * v1.0.0: Базовая мультидоменная маршрутизация
 */

import { type NextRequest, NextResponse } from 'next/server'
import { isDevelopmentEnvironment } from './lib/constants'

// Conditional NextAuth import only for production
let getToken: any = null
try {
  // APP_STAGE-based detection: только в PROD окружении
  const stage = process.env.APP_STAGE || 'PROD';
  if (stage === 'PROD' && !process.env.PLAYWRIGHT_PORT) {
    getToken = require('next-auth/jwt').getToken
  }
} catch (error) {
  console.log('NextAuth not available - using universal auth only')
}

export async function middleware (request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? 'localhost:3000'

  // UNIFIED COOKIE ARCHITECTURE: World context from test-session only
  let worldId = null
  const testSessionCookie = request.cookies.get('test-session')
  const fallbackSessionCookie = request.cookies.get('test-session-fallback')
  
  // Read worldId from unified test-session cookie
  if (testSessionCookie) {
    try {
      const sessionData = JSON.parse(testSessionCookie.value)
      if (sessionData.worldId) {
        worldId = sessionData.worldId
      }
    } catch (error) {
      console.warn('🌍 Failed to parse test-session cookie:', error)
    }
  }
  
  // Fallback to test-session-fallback for compatibility
  if (!worldId && fallbackSessionCookie) {
    try {
      const sessionData = JSON.parse(fallbackSessionCookie.value)
      if (sessionData.worldId) {
        worldId = sessionData.worldId
        console.log('🌍 Using fallback session cookie for world')
      }
    } catch (error) {
      console.warn('🌍 Failed to parse test-session-fallback cookie:', error)
    }
  }
  
  // Get all cookie names for diagnostics
  const allCookieNames: string[] = []
  request.cookies.getAll().forEach(cookie => {
    allCookieNames.push(cookie.name)
  })
  
  console.log('🌍 MIDDLEWARE DIAGNOSTIC (Unified Architecture):', {
    pathname: url.pathname,
    hostname,
    worldId: worldId || 'NOT_FOUND',
    testSessionPresent: !!testSessionCookie,
    fallbackSessionPresent: !!fallbackSessionCookie,
    allCookieNames,
    cookieCount: allCookieNames.length
  })
  
  if (worldId) {
    console.log(`🌍 Request to ${url.pathname} in world: ${worldId}`)
  } else {
    console.log(`🌍 Request to ${url.pathname} - NO WORLD (checked test-session cookies)`)
  }

  // Определяем домен для админ-панели  
  // ИСПРАВЛЕНИЕ: В production режиме локально может быть app.localhost с портом
  const isProductionRemote = process.env.NODE_ENV === 'production' && !hostname.includes('localhost')
  const isAppDomain = isProductionRemote
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

    // Enhanced test environment detection
    const hasPlaywrightPort = !!process.env.PLAYWRIGHT_PORT;
    const testHeader = request.headers.get('X-Test-Environment');
    const stage = process.env.APP_STAGE || 'PROD';
    const isTestEnv = process.env.NODE_ENV === 'test' || 
                      process.env.PLAYWRIGHT === 'true' || 
                      testHeader === 'playwright' ||
                      hasPlaywrightPort ||
                      stage === 'LOCAL' || 
                      stage === 'BETA';
    
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
    
    // Fallback to regular NextAuth token if no test session (only in production)
    if (!token && !isTestEnv && getToken) {
      try {
        token = await getToken({
          req: request,
          secret: process.env.AUTH_SECRET,
          secureCookie: !isDevelopmentEnvironment,
        });
      } catch (error) {
        console.log('❌ NextAuth token fetch failed:', error);
        // В production среде без тестовых cookies продолжаем без токена
      }
    }

    // Redirect to login only in production without token
    if (!token && !isTestEnv) {
      const redirectUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${redirectUrl}`, request.url))
    }
    
    // В тестовом окружении без токена разрешаем доступ (для публичных endpoint'ов)
    if (!token && isTestEnv) {
      console.log('⚠️ Test environment without token - allowing access');
    }

    if (token && token.type === 'regular' && ['/login', '/register'].includes(url.pathname)) {
      // Этот блок может быть уже не нужен, так как мы обрабатываем /login выше,
      // но оставим для защиты от прямого перехода залогиненным пользователем.
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Переписываем путь на директорию app для мультидоменной архитектуры
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
