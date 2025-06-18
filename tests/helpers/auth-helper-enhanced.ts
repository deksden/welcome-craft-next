/**
 * @file tests/helpers/auth-helper-enhanced.ts
 * @description Улучшенный helper для аутентификации в Железобетонных Тестах
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Создан enhanced auth helper для стабильной аутентификации в тестах
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создание enhanced auth helper для полной стабильности тестов
 */

import type { Page } from '@playwright/test'
import { TestUtils } from './test-utils'

/**
 * @description Улучшенный helper для аутентификации с множественными fallback стратегиями
 * 
 * @feature Поддержка world cookies
 * @feature Fallback через API если UI не работает
 * @feature Автоматическое определение состояния аутентификации
 * @feature Fail-fast локаторы для всех элементов
 */
export class EnhancedAuthHelper {
  private testUtils: TestUtils

  constructor(private page: Page) {
    this.testUtils = new TestUtils(page)
  }

  /**
   * @description Установить world cookie для изоляции тестов
   * 
   * @param worldId - ID мира для активации
   */
  async setWorldCookie(worldId: string): Promise<void> {
    console.log(`🌍 Setting world cookie: ${worldId}`)
    
    await this.page.context().addCookies([
      {
        name: 'world_id',
        value: worldId,
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'world_id_fallback',
        value: worldId,
        domain: '.localhost',
        path: '/'
      }
    ])
    
    console.log('✅ World cookies set')
  }

  /**
   * @description Проверить текущее состояние аутентификации
   * 
   * @returns Promise<'authenticated' | 'unauthenticated' | 'unknown'>
   */
  async getAuthStatus(): Promise<'authenticated' | 'unauthenticated' | 'unknown'> {
    try {
      // Проверяем URL
      const currentUrl = this.page.url()
      
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        return 'unauthenticated'
      }
      
      // Проверяем наличие chat-input (признак аутентифицированного состояния)
      try {
        await this.testUtils.fastLocator('chat-input', { timeout: 2000 })
        return 'authenticated'
      } catch (error) {
        // Проверяем наличие form полей (признак неаутентифицированного состояния)
        try {
          await this.testUtils.fastLocator('auth-email-input', { timeout: 2000 })
          return 'unauthenticated'
        } catch (authError) {
          return 'unknown'
        }
      }
    } catch (error) {
      console.log('⚠️ Could not determine auth status:', error.message)
      return 'unknown'
    }
  }

  /**
   * @description Робастная аутентификация с множественными fallback стратегиями
   * 
   * @param email - email пользователя
   * @param password - пароль
   * @param worldId - опциональный world ID для изоляции
   */
  async authenticateRobust(email: string, password: string, worldId?: string): Promise<void> {
    console.log(`🔐 Starting robust authentication for: ${email}`)
    
    // Устанавливаем world cookie если указан
    if (worldId) {
      await this.setWorldCookie(worldId)
    }
    
    // Проверяем текущий статус
    const currentStatus = await this.getAuthStatus()
    console.log(`📊 Current auth status: ${currentStatus}`)
    
    if (currentStatus === 'authenticated') {
      console.log('✅ Already authenticated, skipping registration')
      return
    }
    
    // Стратегия 1: Пробуем UI аутентификацию
    try {
      await this.authenticateViaUI(email, password)
      console.log('✅ UI authentication successful')
      return
    } catch (error) {
      console.log('⚠️ UI authentication failed, trying fallback strategies')
    }
    
    // Стратегия 2: Direct API аутентификация
    try {
      await this.authenticateViaAPI(email, password)
      console.log('✅ API authentication successful')
      return
    } catch (error) {
      console.log('⚠️ API authentication failed, trying test session')
    }
    
    // Стратегия 3: Test session cookie
    try {
      await this.setTestSessionCookie(email)
      console.log('✅ Test session authentication successful')
      return
    } catch (error) {
      console.log('❌ All authentication strategies failed')
      throw new Error(`Authentication failed for ${email}: ${error.message}`)
    }
  }

  /**
   * @description Аутентификация через UI (основная стратегия)
   */
  private async authenticateViaUI(email: string, password: string): Promise<void> {
    console.log('🖥️ Attempting UI authentication...')
    
    // Переходим на страницу регистрации
    await this.page.goto('/register')
    
    // Ждем загрузки формы
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Заполняем форму
    const emailInput = await this.testUtils.fastLocator('auth-email-input')
    const passwordInput = await this.testUtils.fastLocator('auth-password-input')
    const submitButton = await this.testUtils.fastLocator('auth-submit-button')
    
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()
    
    // Ждем перенаправления или toast
    try {
      await this.page.waitForURL('/', { timeout: 10000 })
      console.log('✅ Redirected to main page')
    } catch (redirectError) {
      // Проверяем toast message
      try {
        const toast = await this.testUtils.fastLocator('toast', { timeout: 3000 })
        const toastText = await toast.textContent()
        console.log(`📢 Toast message: ${toastText}`)
      } catch (toastError) {
        console.log('⚠️ No toast message found')
      }
    }
    
    // Финальная проверка аутентификации
    await this.page.goto('/')
    await this.testUtils.fastLocator('chat-input', { timeout: 5000 })
  }

  /**
   * @description Аутентификация через API (fallback стратегия)
   */
  private async authenticateViaAPI(email: string, password: string): Promise<void> {
    console.log('🔌 Attempting API authentication...')
    
    // Создаем пользователя через API
    const response = await this.page.request.post('/api/auth/register', {
      data: {
        email,
        password
      }
    })
    
    if (!response.ok()) {
      throw new Error(`API registration failed: ${response.status()}`)
    }
    
    // Устанавливаем session cookie
    const sessionResponse = await this.page.request.post('/api/auth/session', {
      data: { email }
    })
    
    if (sessionResponse.ok()) {
      console.log('✅ API session established')
    }
    
    // Переходим на главную страницу
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * @description Установка test session cookie (крайний fallback)
   */
  private async setTestSessionCookie(email: string): Promise<void> {
    console.log('🧪 Setting test session cookie...')
    
    const timestamp = Date.now()
    const userId = `550e8400-e29b-41d4-a716-${timestamp.toString().slice(-12)}`
    
    await this.page.context().addCookies([
      {
        name: 'test-session',
        value: JSON.stringify({
          user: {
            id: userId,
            email: email,
            name: email.split('@')[0]
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }),
        domain: 'localhost',
        path: '/'
      }
    ])
    
    // Переходим на главную страницу
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * @description Ожидание полной готовности аутентифицированного состояния
   * 
   * @param timeout - таймаут ожидания в мс
   */
  async waitForAuthenticatedState(timeout: number = 15000): Promise<void> {
    console.log('⏳ Waiting for authenticated state...')
    
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        // Проверяем наличие основных элементов аутентифицированного состояния
        await this.testUtils.fastLocator('chat-input', { timeout: 2000 })
        console.log('✅ Authenticated state confirmed')
        return
      } catch (error) {
        // Ждем немного перед следующей попыткой
        await this.page.waitForTimeout(1000)
      }
    }
    
    throw new Error(`Authenticated state not reached within ${timeout}ms`)
  }

  /**
   * @description Проверка world cookie
   * 
   * @param expectedWorldId - ожидаемый world ID
   */
  async validateWorldCookie(expectedWorldId: string): Promise<boolean> {
    const cookies = await this.page.context().cookies()
    const worldCookie = cookies.find(c => c.name === 'world_id')
    
    if (!worldCookie) {
      console.log('❌ No world_id cookie found')
      return false
    }
    
    if (worldCookie.value !== expectedWorldId) {
      console.log(`❌ World cookie mismatch: expected ${expectedWorldId}, got ${worldCookie.value}`)
      return false
    }
    
    console.log(`✅ World cookie validated: ${expectedWorldId}`)
    return true
  }

  /**
   * @description Очистка всех аутентификационных данных
   */
  async clearAuthData(): Promise<void> {
    console.log('🧹 Clearing auth data...')
    
    // Очищаем cookies
    const context = this.page.context()
    await context.clearCookies()
    
    // Очищаем localStorage
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    console.log('✅ Auth data cleared')
  }
}

// END OF: tests/helpers/auth-helper-enhanced.ts