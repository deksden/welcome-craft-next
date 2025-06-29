/**
 * @file components/dev-world-selector.tsx
 * @description Dev-only селектор миров с быстрой аутентификацией
 * @version 1.5.0
 * @date 2025-06-28
 * @updated ПОЛНАЯ УНИФИКАЦИЯ - только test-session cookie как единый источник данных о мире
 */

/** HISTORY:
 * v1.5.0 (2025-06-28): ПОЛНАЯ УНИФИКАЦИЯ - убраны все отдельные cookies, используется только test-session с worldId внутри
 * v1.4.0 (2025-06-28): УНИФИКАЦИЯ МИРНОЙ СИСТЕМЫ - согласованные cookie механизмы с WorldIndicator и world-context
 * v1.3.0 (2025-06-28): FEATURE - Индикатор текущего мира, правильные User IDs, API загрузки миров
 * v1.2.1 (2025-06-28): BUG FIX - Исправлена синтаксическая ошибка компиляции JSX
 * v1.2.0 (2025-06-28): UX IMPROVEMENT - Добавлена прокручивающаяся область (max-h-[60vh]) для длинного списка миров
 * v1.1.0 (2025-06-28): BUG FIX - Исправлена runtime ошибка с импортом иконок и toast типами
 * v1.0.0 (2025-06-28): Создание dev-only компонента для переключения между мирами с быстрой аутентификацией
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { GlobeIcon, UserIcon, BoxIcon } from '@/components/icons'
import { toast } from '@/components/toast'

// Импортируем конфигурацию миров
const WORLDS_CONFIG = {
  CLEAN_USER_WORKSPACE: {
    name: 'Чистое рабочее пространство',
    user: { id: 'user-sarah', name: 'Sarah Wilson', email: 'sarah@example.com' },
    description: 'AI-генерация с нуля'
  },
  SITE_READY_FOR_PUBLICATION: {
    name: 'Готовый сайт',
    user: { id: 'user-ada', name: 'Ada Thompson', email: 'ada@example.com' },
    description: 'Тестирование публикации'
  },
  CONTENT_LIBRARY_BASE: {
    name: 'Библиотека контента',
    user: { id: 'user-maria', name: 'Maria Garcia', email: 'maria@example.com' },
    description: 'Переиспользование артефактов'
  },
  DEMO_PREPARATION: {
    name: 'Демо-среда',
    user: { id: 'user-david', name: 'David Chen', email: 'david@example.com' },
    description: 'Публикация чатов'
  },
  ENTERPRISE_ONBOARDING: {
    name: 'Корпоративный онбординг',
    user: { id: 'user-elena', name: 'Elena Rodriguez', email: 'elena@example.com' },
    description: 'Enterprise-уровень'
  }
}

interface DevWorldSelectorProps {
  /** Показывать только в dev режиме */
  showInDev?: boolean
}

export function DevWorldSelector({ showInDev = true }: DevWorldSelectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentWorld, setCurrentWorld] = useState<string | null>(null)

  // Определяем режим окружения
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
  const hasPlaywrightPort = typeof window !== 'undefined' && !!process.env.PLAYWRIGHT_PORT

  // Читаем текущий мир из test-session cookie (единый источник)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const testSession = document.cookie
          .split('; ')
          .find(row => row.startsWith('test-session='))
        
        if (testSession) {
          const sessionData = JSON.parse(decodeURIComponent(testSession.split('=')[1]))
          if (sessionData.worldId) {
            setCurrentWorld(sessionData.worldId)
          }
        }
      } catch (error) {
        console.log('Could not read world from session:', error)
      }
    }
  }, [])
  
  // Показываем только в dev режиме (но НЕ в E2E тестах)
  if (!isDev || !isLocalhost || !showInDev || hasPlaywrightPort) {
    return null
  }

  const handleWorldLogin = async (worldId: string) => {
    setIsLoading(true)
    
    try {
      const world = WORLDS_CONFIG[worldId as keyof typeof WORLDS_CONFIG]
      if (!world) {
        throw new Error(`World ${worldId} not found`)
      }

      // Используем test auth API для быстрого входа
      const response = await fetch('/api/test/auth-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Environment': 'dev-world-selector',
        },
        body: JSON.stringify({
          email: world.user.email,
          name: world.user.name,
          userId: world.user.id, // Используем правильный ID из мира
          worldId: worldId
        }),
      })

      if (response.ok) {
        setCurrentWorld(worldId)
        toast({
          type: 'success',
          description: `Вход выполнен как ${world.user.name} (${world.name})`
        })
        
        // Перезагружаем страницу для применения новой сессии
        window.location.reload()
      } else {
        throw new Error(`Authentication failed: ${response.status}`)
      }
    } catch (error) {
      console.error('World login failed:', error)
      toast({
        type: 'error',
        description: 'Ошибка входа в мир. Проверьте консоль.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadWorld = async (worldId: string) => {
    setIsLoading(true)
    
    try {
      toast({
        type: 'loading',
        description: 'Загрузка данных мира...'
      })
      
      const response = await fetch('/api/dev/load-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ worldId })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          type: 'success',
          description: `Мир "${result.world.name}" загружен: ${result.world.artifactsCount} артефактов`
        })
      } else {
        const error = await response.json()
        throw new Error(error.details || 'Unknown error')
      }
    } catch (error) {
      console.error('World loading failed:', error)
      toast({
        type: 'error',
        description: `Ошибка загрузки мира: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
        DEV
      </Badge>
      
      {currentWorld && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
          🌍 {WORLDS_CONFIG[currentWorld as keyof typeof WORLDS_CONFIG]?.name}
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            disabled={isLoading}
          >
            <GlobeIcon className="size-4 mr-1" />
            {currentWorld ? WORLDS_CONFIG[currentWorld as keyof typeof WORLDS_CONFIG]?.name : 'Выбрать мир'}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-hidden">
          <DropdownMenuLabel className="flex items-center gap-2 sticky top-0 bg-background z-10">
            <BoxIcon className="size-4" />
            Тестовые миры (Dev)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="max-h-[60vh] overflow-y-auto">
            {Object.entries(WORLDS_CONFIG).map(([worldId, world]) => (
              <DropdownMenuItem key={worldId} className="flex-col items-start p-3 cursor-pointer">
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">{world.name}</span>
                    <Badge variant="secondary" className="text-xs">{worldId}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserIcon className="size-3" />
                    {world.user.name} ({world.user.email})
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{world.description}</p>
                  
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleWorldLogin(worldId)
                      }}
                      disabled={isLoading}
                    >
                      Войти
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoadWorld(worldId)
                      }}
                      disabled={isLoading}
                    >
                      Загрузить данные
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="text-xs text-muted-foreground">
            💡 В production режиме этот селектор скрыт
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// END OF: components/dev-world-selector.tsx