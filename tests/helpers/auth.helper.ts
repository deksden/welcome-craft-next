/**
 * @file tests/helpers/auth.helper.ts
 * @description Универсальный механизм аутентификации для всех типов тестов (E2E и API)
 * @version 2.0.0
 * @date 2025-06-28
 * @updated КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ UI AUTH: Browser-side fetch вместо page.request для получения real cookies в UI
 */

/** HISTORY:
 * v2.0.0 (2025-06-28): КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ UI AUTH - Browser-side fetch вместо page.request для получения real cookies в UI
 * v1.1.0 (2025-06-27): FOREIGN KEY FIX - Добавлено создание пользователя в БД через /api/test/create-user перед созданием сессии  
 * v1.0.0 (2025-06-27): BUG-038 SOLUTION - Создан универсальный auth helper заменяющий fastAuthentication и createAPIAuthenticatedContext
 */

import type { Page, APIRequestContext } from '@playwright/test';
import { getTestUrls } from './test-config';
import { getTestWorldId, } from './test-world-allocator';

export interface AuthUser {
  email: string;
  id?: string;
  name?: string;
  type?: 'user' | 'admin';
}

export interface AuthOptions {
  targetPath?: string;
  skipNavigation?: boolean;
  worldId?: string; // Поддержка World Isolation
  workerId?: string; // Playwright Worker ID
}

export interface AuthCookieData {
  name: string;
  value: string;
  domain?: string;
  path: string;
}

/**
 * @description Универсальная аутентификация для E2E и API тестов
 * @feature API-first подход - использует real /api/test/auth-signin endpoint
 * @feature Мультидоменная поддержка - .localhost, localhost, app.localhost
 * @feature Robust error handling с детальной диагностикой
 * @param context - Page для E2E тестов или APIRequestContext для API тестов  
 * @param user - Данные пользователя для аутентификации
 * @param options - Опциональные настройки
 */
export async function universalAuthentication(
  context: Page | APIRequestContext,
  user: AuthUser,
  options: AuthOptions = {}
): Promise<void> {
  const { targetPath = '/artifacts', skipNavigation = false, worldId, workerId } = options;
  const isE2E = 'goto' in context; // Page has goto method, APIRequestContext doesn't
  
  // World Isolation Support
  let finalWorldId = worldId;
  if (workerId && !worldId) {
    // Автоматическое определение world ID на основе worker ID
    const testFileName = options.targetPath?.includes('phoenix') ? 'phoenix-user-management.test.ts' : 'UC-01-AI-First-Site-Creation.test.ts';
    finalWorldId = await getTestWorldId(workerId, testFileName);
  }

  console.log(`🚀 UNIVERSAL AUTH: Setting up session for ${user.email} (${isE2E ? 'E2E' : 'API'} mode)`);
  if (finalWorldId) {
    console.log(`🌍 World Isolation: Using world ${finalWorldId}`);
  }

  try {
    // ШАГ 1: Создаем пользователя в БД (если не существует)
    console.log('📡 Step 1: Creating user in database...');
    
    const createUserResponse = await (isE2E 
      ? (context as Page).request.post('/api/test/create-user', {
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Environment': 'playwright'
          },
          data: {
            id: user.id || crypto.randomUUID(),
            email: user.email,
            password: 'test-password',
            type: user.type || 'user',
            worldId: finalWorldId
          }
        })
      : (context as APIRequestContext).post('/api/test/create-user', {
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Environment': 'playwright'
          },
          data: {
            id: user.id || crypto.randomUUID(),
            email: user.email,
            password: 'test-password',
            type: user.type || 'user',
            worldId: finalWorldId
          }
        })
    );

    if (!createUserResponse.ok()) {
      const errorText = await createUserResponse.text();
      console.error(`❌ CREATE USER ERROR: ${createUserResponse.status()} - ${errorText}`);
      throw new Error(`Failed to create user: ${createUserResponse.status()} - ${errorText}`);
    }

    const userData = await createUserResponse.json();
    console.log(`✅ User created/found: ${userData.email} (ID: ${userData.userId})`);
    
    // Обновляем user.id если он был сгенерирован автоматически
    if (!user.id) {
      user.id = userData.userId;
    }

    // ШАГ 2: BROWSER NAVIGATION для получения real cookies
    if (isE2E) {
      console.log('📡 Step 2: Browser fetch to auth endpoint for real cookies...');
      
      const page = context as Page;
      
      // КРИТИЧНО: Навигируем на admin domain перед auth запросом
      await page.goto('http://app.localhost:3000/artifacts');
      
      // Выполняем auth через browser fetch для получения real cookies
      const authResult = await page.evaluate(async ({ email, userId, userType, worldId }) => {
        try {
          const response = await fetch('/api/test/auth-signin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Environment': 'playwright'
            },
            body: JSON.stringify({
              email,
              userId,
              userType: userType || 'user',
              worldId
            }),
            credentials: 'same-origin' // КРИТИЧНО: включает cookies
          });
          
          const data = await response.json();
          return {
            success: response.ok,
            status: response.status,
            data
          };
        } catch (error) {
          return {
            success: false,
            status: 0,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }, {
        email: user.email,
        userId: user.id,
        userType: user.type || 'user',
        worldId: finalWorldId
      });
      
      if (!authResult.success) {
        console.error(`❌ BROWSER AUTH ERROR: ${authResult.status} - ${authResult.error}`);
        throw new Error(`Browser authentication failed: ${authResult.status} - ${authResult.error}`);
      }
      
      console.log(`✅ Browser Auth Success: Session created for ${authResult.data?.user?.email}`);
      console.log('🍪 Cookies automatically set by browser during fetch request');
      
      // Небольшая пауза для обработки cookies
      await page.waitForTimeout(1000);
      
    } else {
      // API mode - используем старый подход
      console.log('📡 Step 2: Making API request to /api/test/auth-signin...');
      
      const authResponse = await (context as APIRequestContext).post('/api/test/auth-signin', {
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Environment': 'playwright'
        },
        data: {
          email: user.email,
          userId: user.id,
          userType: user.type || 'user',
          worldId: finalWorldId
        }
      });

      if (!authResponse.ok()) {
        const errorText = await authResponse.text();
        console.error(`❌ AUTH API ERROR: ${authResponse.status()} - ${errorText}`);
        throw new Error(`Authentication API failed: ${authResponse.status()} - ${errorText}`);
      }

      const authData = await authResponse.json();
      console.log(`✅ API Success: Session created for ${authData.user?.email}`);
    }
    
    // ШАГ 3: Навигация (только для E2E)
    if (isE2E && !skipNavigation) {
      const urls = getTestUrls();
      const targetUrl = `${urls.adminBase}${targetPath}`;
      console.log(`🧭 Step 3: Navigating to ${targetUrl}...`);
      
      const page = context as Page;
      await page.goto(targetUrl, { timeout: 15000 });
      await page.waitForTimeout(1000); // Stabilization after auth
      console.log('   - ✅ Navigation complete with authentication cookies');
    }
  } catch (error) {
    console.error('❌ UNIVERSAL AUTH ERROR:', error);
    throw error;
  }
}

// END OF: tests/helpers/auth.helper.ts
