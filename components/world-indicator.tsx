/**
 * @file components/world-indicator.tsx
 * @description Индикатор текущего тестового мира в хедере для трехуровневой системы тестирования.
 * @version 1.2.0
 * @date 2025-06-28
 * @updated УНИФИКАЦИЯ МИРНОЙ СИСТЕМЫ - поддержка cookies от DevWorldSelector с правильным приоритетом
 */

/** HISTORY:
 * v1.2.0 (2025-06-28): УНИФИКАЦИЯ МИРНОЙ СИСТЕМЫ - читает test-session cookies от DevWorldSelector с приоритетом
 * v1.1.0 (2025-06-18): Добавлена поддержка PRODUCTION режима - индикатор не показывается для стандартного режима.
 * v1.0.0 (2025-06-18): Начальная версия индикатора мира для трехуровневой системы тестирования.
 */

'use client'

import { useEffect, useState } from 'react'

// World definitions (same as in login page)
const WORLDS = {
  PRODUCTION: 'Стандартный (Продакшн)',
  CLEAN_USER_WORKSPACE: 'Чистое рабочее пространство',
  SITE_READY_FOR_PUBLICATION: 'Сайт готов к публикации',
  CONTENT_LIBRARY_BASE: 'Библиотека контента', 
  DEMO_PREPARATION: 'Демонстрационная среда',
  ENTERPRISE_ONBOARDING: 'Корпоративный онбординг'
} as const

type WorldId = keyof typeof WORLDS

// Check if world indicator should be shown (LOCAL/BETA stages only)
function getIsTestWorldsUIEnabled() {
  // Server-side check
  if (typeof window === 'undefined') {
    const result = process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL' || process.env.NEXT_PUBLIC_APP_STAGE === 'BETA'
    console.log('🌍 SERVER-SIDE getIsTestWorldsUIEnabled:', {
      NEXT_PUBLIC_APP_STAGE: process.env.NEXT_PUBLIC_APP_STAGE,
      result
    })
    return result
  }
  
  // Client-side check
  const result = process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL' || process.env.NEXT_PUBLIC_APP_STAGE === 'BETA'
  
  console.log('🌍 CLIENT-SIDE getIsTestWorldsUIEnabled:', {
    NEXT_PUBLIC_APP_STAGE: process.env.NEXT_PUBLIC_APP_STAGE,
    result
  })
  
  return result
}

export function WorldIndicator() {
  const [currentWorld, setCurrentWorld] = useState<WorldId | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const enabled = getIsTestWorldsUIEnabled()
    console.log('🌍 WorldIndicator: useEffect started')
    console.log('🌍 isTestWorldsUIEnabled:', enabled)
    console.log('🌍 NEXT_PUBLIC_APP_STAGE:', process.env.NEXT_PUBLIC_APP_STAGE)
    
    setIsEnabled(enabled)
    
    if (!enabled) {
      console.log('🌍 WorldIndicator: Test worlds UI disabled, returning')
      return
    }

    // ЕДИНЫЙ ИСТОЧНИК: читаем worldId из test-session cookie
    const getWorldFromCookie = () => {
      if (typeof document === 'undefined') return null
      
      const cookies = document.cookie.split(';')
      console.log('🌍 All cookies:', cookies)
      
      // Читаем worldId из test-session cookie
      const testSessionCookie = cookies.find(cookie => 
        cookie.trim().startsWith('test-session=')
      )
      
      if (testSessionCookie) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(testSessionCookie.split('=')[1]))
          if (sessionData.worldId && sessionData.worldId in WORLDS) {
            console.log('🌍 Found worldId in test-session:', sessionData.worldId)
            return sessionData.worldId as WorldId
          }
        } catch (error) {
          console.warn('🌍 Failed to parse test-session cookie:', error)
        }
      }
      
      console.log('🌍 No worldId found in test-session')
      return null
    }

    const initialWorld = getWorldFromCookie()
    console.log('🌍 Initial world from cookie:', initialWorld)
    setCurrentWorld(initialWorld)

    // Listen for cookie changes (when world is changed)
    const interval = setInterval(() => {
      const newWorld = getWorldFromCookie()
      if (newWorld !== currentWorld) {
        console.log('🌍 World changed from', currentWorld, 'to', newWorld)
        setCurrentWorld(newWorld)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentWorld])

  console.log('🌍 WorldIndicator render: isEnabled=', isEnabled, 'currentWorld=', currentWorld)

  // Don't render if not enabled, no world set, or in production mode
  if (!isEnabled || !currentWorld || currentWorld === 'PRODUCTION') {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md" data-testid="world-indicator">
      <span className="text-blue-600 dark:text-blue-400">🌍</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          Тестовый мир
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400" data-testid="world-indicator-name">
          {WORLDS[currentWorld]}
        </span>
      </div>
    </div>
  )
}

// END OF: components/world-indicator.tsx