/**
 * @file app/(auth)/login/page.tsx
 * @description Страница входа пользователя.
 * @version 1.2.0
 * @date 2025-06-18
 * @updated Добавлена опция "Стандартный (Продакшн)" для обычной работы без выбора тестового мира.
 */

/** HISTORY:
 * v1.2.0 (2025-06-18): Добавлена опция "Стандартный (Продакшн)" для работы без тестовых миров - исправлен BUG-008.
 * v1.1.0 (2025-06-18): Добавлен world selector при ENABLE_TEST_WORLDS_UI=true для тестирования.
 * v1.0.1 (2025-06-07): Заменен router.refresh() на router.push('/') для корректного редиректа.
 * v1.0.0 (2025-05-25): Начальная версия.
 */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation.js'
import { useActionState, useEffect, useState } from 'react'
import { toast } from '@/components/toast'

import { AuthForm } from '@/components/auth-form'
import { SubmitButton } from '@/components/submit-button'

import { login, type LoginActionState } from '../actions'
import { QuickLoginPanel } from '@/components/phoenix/quick-login-panel'

// World selector for testing
const WORLDS = {
  PRODUCTION: 'Стандартный (Продакшн)',
  CLEAN_USER_WORKSPACE: 'Чистое рабочее пространство',
  SITE_READY_FOR_PUBLICATION: 'Сайт готов к публикации', 
  CONTENT_LIBRARY_BASE: 'Библиотека контента',
  DEMO_PREPARATION: 'Демонстрационная среда',
  ENTERPRISE_ONBOARDING: 'Корпоративный онбординг'
} as const

type WorldId = keyof typeof WORLDS

// World selection UI enabled for LOCAL and BETA stages only
const isTestWorldsUIEnabled = process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL' || 
  process.env.NEXT_PUBLIC_APP_STAGE === 'BETA'

export default function Page () {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [selectedWorld, setSelectedWorld] = useState<WorldId>('PRODUCTION')

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  )

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      })
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      })
    } else if (state.status === 'success') {
      setIsSuccessful(true)
      // Прямое перенаправление на главную страницу вместо обновления текущей
      router.push('/')
    }
  }, [state.status, router])

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string)
    
    // Add selected world to form data for testing
    if (isTestWorldsUIEnabled) {
      // Don't send world_id for PRODUCTION mode to keep null for production users
      if (selectedWorld !== 'PRODUCTION') {
        formData.append('world_id', selectedWorld)
      }
    }
    
    formAction(formData)
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-6xl overflow-hidden flex gap-8 items-start">
        {/* Phoenix Quick Login Panel for development - Left side */}
        {isTestWorldsUIEnabled && (
          <div className="w-full max-w-md">
            <QuickLoginPanel />
          </div>
        )}
        
        {/* Main login form - Right side */}
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
            <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Use your email and password to sign in
            </p>
          </div>
          <AuthForm action={handleSubmit} defaultEmail={email}>
            {/* World selector for testing */}
            {isTestWorldsUIEnabled && (
              <div className="space-y-2 mb-4">
                <label htmlFor="world-select" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  🌍 Режим работы
                </label>
                <select
                  id="world-select"
                  value={selectedWorld}
                  onChange={(e) => setSelectedWorld(e.target.value as WorldId)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {Object.entries(WORLDS).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Выберите режим работы: стандартный для обычной работы или тестовый мир для разработки
                </p>
              </div>
            )}
            
            <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {'Don\'t have an account? '}
              <Link
                href="/register"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Sign up
              </Link>
              {' for free.'}
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  )
}

// END OF: app/(auth)/login/page.tsx
