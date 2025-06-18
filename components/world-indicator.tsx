/**
 * @file components/world-indicator.tsx
 * @description Индикатор текущего тестового мира в хедере для трехуровневой системы тестирования.
 * @version 1.1.0
 * @date 2025-06-18
 * @updated Добавлена поддержка PRODUCTION режима - индикатор скрывается в стандартном режиме.
 */

/** HISTORY:
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

// Check if world indicator should be shown
function getIsTestWorldsUIEnabled() {
  // Server-side check
  if (typeof window === 'undefined') {
    const result = process.env.NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI === 'true'
    console.log('🌍 SERVER-SIDE getIsTestWorldsUIEnabled:', {
      NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI: process.env.NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI,
      result
    })
    return result
  }
  
  // Client-side check
  const envCheck = process.env.NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI === 'true'
  const localStorageCheck = window.localStorage?.getItem('ENABLE_TEST_WORLDS_UI') === 'true'
  const result = envCheck || localStorageCheck
  
  console.log('🌍 CLIENT-SIDE getIsTestWorldsUIEnabled:', {
    NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI: process.env.NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI,
    envCheck,
    localStorageCheck,
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
    console.log('🌍 NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI:', process.env.NEXT_PUBLIC_ENABLE_TEST_WORLDS_UI)
    console.log('🌍 localStorage ENABLE_TEST_WORLDS_UI:', typeof window !== 'undefined' ? window.localStorage?.getItem('ENABLE_TEST_WORLDS_UI') : 'N/A (server)')
    
    setIsEnabled(enabled)
    
    if (!enabled) {
      console.log('🌍 WorldIndicator: Test worlds UI disabled, returning')
      return
    }

    // Read world_id from cookie with fallback support
    const getWorldFromCookie = () => {
      if (typeof document === 'undefined') return null
      
      const cookies = document.cookie.split(';')
      console.log('🌍 All cookies:', cookies)
      
      // Try main world_id cookie first
      let worldCookie = cookies.find(cookie => 
        cookie.trim().startsWith('world_id=')
      )
      
      // If not found, try fallback
      if (!worldCookie) {
        worldCookie = cookies.find(cookie => 
          cookie.trim().startsWith('world_id_fallback=')
        )
        if (worldCookie) {
          console.log('🌍 Using fallback world cookie')
        }
      }
      
      console.log('🌍 Found world cookie:', worldCookie)
      
      if (worldCookie) {
        const worldId = worldCookie.split('=')[1]?.trim()
        const isValid = worldId in WORLDS
        console.log('🌍 Extracted worldId:', worldId, 'isValid:', isValid)
        return isValid ? worldId as WorldId : null
      }
      
      console.log('🌍 No world cookie found (checked both world_id and world_id_fallback)')
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
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
      <span className="text-blue-600 dark:text-blue-400">🌍</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          Тестовый мир
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          {WORLDS[currentWorld]}
        </span>
      </div>
    </div>
  )
}

// END OF: components/world-indicator.tsx