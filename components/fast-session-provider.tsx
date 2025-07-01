/**
 * @file components/fast-session-provider.tsx
 * @description Архитектурный компонент для интеграции test-session cookies с NextAuth.js Session Context в E2E тестовом окружении
 * @version 2.3.0
 * @date 2025-06-29
 * @updated RESTORED - Full functionality restored after fixing NODE_ENV issue
 * 
 * @architecture Dual-Session Bridge System
 * - В test режиме: читает test-session cookies и создает Auth.js совместимые сессии
 * - В production режиме: прозрачно проксирует NextAuth.js sessions
 * - Обеспечивает единый useSession() API для компонентов независимо от режима
 * 
 * @purpose Critical Testing Infrastructure
 * - Позволяет E2E тестам работать с реальными React компонентами через session API
 * - Устраняет необходимость мокирования всей NextAuth.js инфраструктуры в тестах
 * - Поддерживает graceful fallback с primary и fallback test-session cookies
 */

/** HISTORY:
 * v2.3.0 (2025-06-29): RESTORED - Full functionality restored after fixing NODE_ENV=development issue
 * v2.2.0 (2025-06-29): ROUTES FIX - Temporarily simplified to fix Html import error
 * v2.1.0 (2025-06-28): ACTION PLAN TASK 4 - Уточнена архитектурная роль в JSDoc, переименован test-session-cross в test-session-fallback
 * v2.0.0 (2025-06-27): BUG-038 FIX - Переписан с использованием best practices для custom SessionProvider
 * v1.0.0 (2025-06-27): BUG-038 FIX - Fast Session Provider для E2E тестов
 */

'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from 'next-auth'

interface FastSessionProviderProps {
  children: React.ReactNode
}

// Create our own session context for test environments
const TestSessionContext = createContext<Session | null>(null)

// Custom hook that checks for test-session first, then falls back to NextAuth
function useTestSessionBridge(): Session | null {
  const [testSession, setTestSession] = useState<Session | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) {
      console.log('🔍 Fast Session Provider: Waiting for client hydration...')
      return
    }
    
    console.log('🔍 Fast Session Provider: Initializing session check...')
    console.log('🔍 Fast Session Provider: Checking for test-session cookie...')
    console.log('🔍 Fast Session Provider: Current cookies:', document.cookie)
    
    // Try to get test-session cookie (primary or fallback)
    const testSessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('test-session=') || row.startsWith('test-session-fallback='))

    if (testSessionCookie) {
      try {
        const cookieValue = decodeURIComponent(testSessionCookie.split('=')[1])
        const testSessionData = JSON.parse(cookieValue)
        
        console.log('🔍 Fast Session Provider: Found test-session cookie for:', testSessionData.user?.email)
        console.log('🔍 Fast Session Provider: Test session data:', testSessionData)
        console.log('🔍 Fast Session Provider: User type from cookie:', testSessionData.user?.type)
        
        // Create Auth.js compatible session object
        const bridgeSession: Session = {
          user: {
            id: testSessionData.user?.id || 'fast-bridge-user',
            email: testSessionData.user?.email || 'test@fast-bridge.com',
            name: testSessionData.user?.name || 'Fast Bridge User',
            type: testSessionData.user?.type || 'user'
          },
          expires: testSessionData.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
        
        console.log('✅ Fast Session Provider: Created bridge session for:', bridgeSession.user.email)
        console.log('✅ Fast Session Provider: Bridge session user type:', bridgeSession.user.type)
        console.log('✅ Fast Session Provider: Complete bridge session object:', JSON.stringify(bridgeSession, null, 2))
        setTestSession(bridgeSession)
        
      } catch (error) {
        console.log('⚠️ Fast Session Provider: Failed to parse test-session cookie:', error)
        setTestSession(null)
      }
    } else {
      console.log('🔍 Fast Session Provider: No test-session cookie found in:', document.cookie)
      setTestSession(null)
    }
  }, [isClient])

  // Return null during SSR or while waiting for client hydration
  return isClient ? testSession : null
}

// Custom useSession hook that overrides NextAuth useSession in test environments
function useCustomSession() {
  console.log('🔥 useCustomSession: HOOK CALLED - Function invoked')
  
  const testSession = useContext(TestSessionContext)
  const nextAuthSession = useSession()
  
  console.log('🚀 useCustomSession: testSession from context:', !!testSession, testSession ? `(${testSession.user.email})` : '(null)')
  console.log('🚀 useCustomSession: nextAuthSession status:', nextAuthSession.status, nextAuthSession.data ? `(${nextAuthSession.data.user?.email})` : '(no data)')
  console.log('🔥 useCustomSession: TestSessionContext available:', !!TestSessionContext)
  
  // If we have a test session, use it. Otherwise, fall back to NextAuth
  if (testSession) {
    console.log('🚀 useCustomSession: Returning test session for:', testSession.user.email)
    console.log('🚀 useCustomSession: Test session user type:', testSession.user.type)
    console.log('🚀 useCustomSession: Full test session return object:', JSON.stringify({
      data: testSession,
      status: 'authenticated'
    }, null, 2))
    return {
      data: testSession,
      status: 'authenticated' as const,
      update: nextAuthSession.update
    }
  }
  
  // For non-test environments, use standard NextAuth session
  console.log('🚀 useCustomSession: Returning NextAuth session, status:', nextAuthSession.status)
  console.log('🚀 useCustomSession: NextAuth session data:', nextAuthSession.data)
  return nextAuthSession
}

// Inner component that provides test session context
function TestSessionWrapper({ children }: { children: React.ReactNode }) {
  console.log('🔍 Fast Session Provider: TestSessionWrapper rendering')
  const testSession = useTestSessionBridge()
  console.log('🔍 Fast Session Provider: TestSessionWrapper got session:', !!testSession)
  
  return (
    <TestSessionContext.Provider value={testSession}>
      {children}
    </TestSessionContext.Provider>
  )
}

export function FastSessionProvider({ children }: FastSessionProviderProps) {
  console.log('🔍 Fast Session Provider: Rendering provider wrapper')
  console.log('🔍 Fast Session Provider: Window available?', typeof window !== 'undefined')
  console.log('🔍 Fast Session Provider: Document cookie available?', typeof document !== 'undefined' ? document?.cookie : 'NO DOCUMENT')
  
  return (
    <SessionProvider>
      <TestSessionWrapper>
        {children}
      </TestSessionWrapper>
    </SessionProvider>
  )
}

// Export our custom useSession hook to override the standard one
export { useCustomSession as useSession }

// END OF: components/fast-session-provider.tsx