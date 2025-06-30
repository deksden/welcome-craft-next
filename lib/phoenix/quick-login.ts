/**
 * @file lib/phoenix/quick-login.ts
 * @description PHOENIX PROJECT - Quick Login Helper for Dev/Beta окружений
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Создан helper для быстрого логина в development и beta окружениях
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Создан QuickLoginHelper для интеграции с существующим test-session API
 */

export interface QuickLoginUser {
  id: string
  email: string
  name: string
  type?: 'regular' | 'admin' | 'demo'
  worldId?: string
}

export interface QuickLoginOptions {
  environment: 'LOCAL' | 'BETA' | 'PROD'
  targetUrl?: string
  rememberLastUser?: boolean
}

/**
 * Phoenix Quick Login Helper
 * 
 * Предоставляет быстрый доступ к аутентификации в development и beta окружениях:
 * - Интеграция с существующим /api/test/auth-signin endpoint
 * - Возможность выбора заранее настроенных пользователей
 * - Сохранение последнего пользователя для удобства
 * - World isolation support
 * 
 * @feature PHOENIX PROJECT - Quick Login System
 * @feature Environment-aware (LOCAL/BETA only)
 * @feature World isolation support
 * @feature Remember last user functionality
 */
export class QuickLoginHelper {
  private environment: string
  private apiUrl: string
  private storageKey = 'phoenix-quick-login-last-user'

  constructor(environment = 'LOCAL') {
    this.environment = environment
    this.apiUrl = this.getApiUrl()
  }

  /**
   * Получение списка заранее настроенных пользователей для быстрого логина
   */
  getQuickLoginUsers(): QuickLoginUser[] {
    const baseUsers: QuickLoginUser[] = [
      {
        id: 'demo-admin-001',
        email: 'admin@phoenix.dev',
        name: 'Phoenix Admin',
        type: 'admin'
      },
      {
        id: 'demo-user-001', 
        email: 'user@phoenix.dev',
        name: 'Phoenix User',
        type: 'regular'
      },
      {
        id: 'demo-hr-001',
        email: 'hr@phoenix.dev', 
        name: 'HR Specialist',
        type: 'regular'
      },
      {
        id: 'demo-dev-001',
        email: 'dev@phoenix.dev',
        name: 'Developer',
        type: 'regular'
      }
    ]

    // В LOCAL окружении добавляем world-specific пользователей
    if (this.environment === 'LOCAL') {
      baseUsers.push(
        {
          id: 'demo-tester-uc',
          email: 'tester@phoenix.dev',
          name: 'UC Tester',
          type: 'regular',
          worldId: 'UC_TESTING_001'
        },
        {
          id: 'demo-tester-reg',
          email: 'regression@phoenix.dev', 
          name: 'Regression Tester',
          type: 'regular',
          worldId: 'REGRESSION_001'
        }
      )
    }

    return baseUsers
  }

  /**
   * Быстрый логин пользователя
   */
  async quickLogin(user: QuickLoginUser, options: QuickLoginOptions = { environment: 'LOCAL' }): Promise<boolean> {
    // Проверяем что мы не в production
    if (options.environment === 'PROD') {
      console.warn('❌ Quick login not available in PROD environment')
      return false
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/test/auth-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Environment': 'dev-world-selector'
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          name: user.name,
          userType: user.type || 'regular',
          worldId: user.worldId || null
        }),
        credentials: 'same-origin'
      })

      if (!response.ok) {
        console.error('❌ Quick login failed:', response.statusText)
        return false
      }

      const result = await response.json()
      
      if (result.success) {
        // Сохраняем последнего пользователя
        if (options.rememberLastUser) {
          this.saveLastUser(user)
        }

        // Перенаправляем если задан target URL
        if (options.targetUrl) {
          window.location.href = options.targetUrl
        } else {
          // Перезагружаем страницу для активации сессии
          window.location.reload()
        }

        console.log(`✅ Quick login successful: ${user.name} (${user.email})`)
        return true
      } else {
        console.error('❌ Quick login failed:', result.error)
        return false
      }

    } catch (error) {
      console.error('❌ Quick login error:', error)
      return false
    }
  }

  /**
   * Получение последнего пользователя из localStorage
   */
  getLastUser(): QuickLoginUser | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * Сохранение последнего пользователя в localStorage
   */
  saveLastUser(user: QuickLoginUser): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user))
    } catch (error) {
      console.warn('Failed to save last user:', error)
    }
  }

  /**
   * Очистка сохраненного пользователя
   */
  clearLastUser(): void {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.warn('Failed to clear last user:', error)
    }
  }

  /**
   * Проверка доступности Quick Login в текущем окружении
   */
  isAvailable(): boolean {
    // Quick login доступен только в LOCAL и BETA окружениях
    const allowedEnvs = ['LOCAL', 'BETA', 'development', 'test']
    
    // Проверяем различные способы определения окружения
    const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production'
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    
    // Разрешаем в LOCAL/BETA или на localhost
    return allowedEnvs.includes(this.environment) || 
           allowedEnvs.includes(nodeEnv) ||
           hostname.includes('localhost') ||
           hostname.includes('dev') ||
           hostname.includes('beta')
  }

  /**
   * Получение текущего статуса авторизации
   */
  async getCurrentAuthStatus(): Promise<{
    isAuthenticated: boolean
    user?: any
    worldId?: string
  }> {
    try {
      // Проверяем test-session cookie
      const testSessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('test-session='))

      if (testSessionCookie) {
        const sessionData = JSON.parse(
          decodeURIComponent(testSessionCookie.split('=')[1])
        )
        
        return {
          isAuthenticated: true,
          user: sessionData.user,
          worldId: sessionData.worldId
        }
      }

      // Проверяем обычную NextAuth сессию
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const session = await response.json()
        return {
          isAuthenticated: !!session?.user,
          user: session?.user
        }
      }

      return { isAuthenticated: false }

    } catch (error) {
      console.warn('Failed to check auth status:', error)
      return { isAuthenticated: false }
    }
  }

  // Приватные методы

  private getApiUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    
    // Fallback для SSR
    return `http://localhost:3000`
  }
}

/**
 * Singleton instance для удобства использования
 */
export const quickLogin = new QuickLoginHelper()

// END OF: lib/phoenix/quick-login.ts