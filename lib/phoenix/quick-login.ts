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

    // В LOCAL окружении добавляем standard test world пользователей
    if (this.environment === 'LOCAL') {
      baseUsers.push(
        {
          id: 'demo-clean-workspace',
          email: 'clean-user@test.com',
          name: 'Clean Workspace User',
          type: 'regular',
          worldId: 'CLEAN_USER_WORKSPACE'
        },
        {
          id: 'demo-publisher',
          email: 'publisher@test.com',
          name: 'Site Publisher',
          type: 'regular',
          worldId: 'SITE_READY_FOR_PUBLICATION'
        },
        {
          id: 'demo-content-manager',
          email: 'content-manager@test.com',
          name: 'Content Manager',
          type: 'regular',
          worldId: 'CONTENT_LIBRARY_BASE'
        },
        {
          id: 'demo-presenter',
          email: 'demo@welcomecraft.com',
          name: 'Demo Presenter',
          type: 'demo',
          worldId: 'DEMO_PREPARATION'
        },
        {
          id: 'demo-hr-admin',
          email: 'hr-admin@enterprise.com',
          name: 'HR Administrator',
          type: 'admin',
          worldId: 'ENTERPRISE_ONBOARDING'
        },
        {
          id: 'demo-new-hire',
          email: 'new-hire@enterprise.com',
          name: 'New Employee',
          type: 'regular',
          worldId: 'ENTERPRISE_ONBOARDING'
        },
        {
          id: 'demo-alice-developer',
          email: 'alice.developer@enterprise.com',
          name: 'Alice Johnson',
          type: 'regular',
          worldId: 'ENTERPRISE_ONBOARDING'
        },
        {
          id: 'demo-bob-designer',
          email: 'bob.designer@enterprise.com',
          name: 'Bob Smith',
          type: 'regular',
          worldId: 'ENTERPRISE_ONBOARDING'
        },
        {
          id: 'demo-carol-manager',
          email: 'carol.manager@enterprise.com',
          name: 'Carol Wilson',
          type: 'regular',
          worldId: 'ENTERPRISE_ONBOARDING'
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

        console.log(`✅ Quick login successful: ${user.name} (${user.email})`)
        
        // Редирект на главную страницу приложения после успешного логина
        if (options.targetUrl) {
          window.location.href = options.targetUrl
        } else {
          // Редирект на главную страницу приложения (admin panel)
          window.location.href = '/'
        }
        
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
    // Проверяем APP_STAGE на клиенте через NEXT_PUBLIC_APP_STAGE
    if (typeof window !== 'undefined') {
      // Client-side check
      const appStage = (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_APP_STAGE || 
                       process.env.NEXT_PUBLIC_APP_STAGE
      
      console.log('🚀 Quick Login isAvailable check:', {
        appStage,
        windowAppStage: (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_APP_STAGE,
        processAppStage: process.env.NEXT_PUBLIC_APP_STAGE,
        hostname: window.location.hostname
      })
      
      return appStage === 'LOCAL' || appStage === 'BETA' || window.location.hostname.includes('localhost')
    }
    
    // Server-side fallback
    const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production'
    return this.environment === 'LOCAL' || 
           this.environment === 'BETA' || 
           nodeEnv === 'development'
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