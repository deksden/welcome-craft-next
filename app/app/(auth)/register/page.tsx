/**
 * @file app/(auth)/register/page.tsx
 * @description Страница регистрации пользователя.
 * @version 1.0.1
 * @date 2025-06-07
 * @updated Исправлен бесконечный цикл переадресации после успешной регистрации.
 */

/** HISTORY:
 * v1.0.1 (2025-06-07): Заменен router.refresh() на router.push('/') для корректного редиректа.
 * v1.0.0 (2025-05-25): Начальная версия.
 */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthForm } from '@/components/auth-form'
import { SubmitButton } from '@/components/submit-button'

import { register, } from '../actions'
import { toast } from '@/components/toast'

export default function Page () {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [isSuccessful, setIsSuccessful] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    console.log('handleSubmit called with:', formData.get('email'))
    setEmail(formData.get('email') as string)
    console.log('calling register server action...')
    
    try {
      const result = await register({ status: 'idle' }, formData)
      console.log('register result:', result)
      
      if (result.status === 'user_exists') {
        console.log('❌ User already exists')
        toast({ type: 'error', description: 'Account already exists!' })
      } else if (result.status === 'failed') {
        console.log('❌ Registration failed')
        toast({ type: 'error', description: 'Failed to create account!' })
      } else if (result.status === 'invalid_data') {
        console.log('❌ Invalid data')
        toast({
          type: 'error',
          description: 'Failed validating your submission!',
        })
      } else if (result.status === 'success') {
        console.log('✅ SUCCESS! Registration and auto-login completed')
        toast({ type: 'success', description: 'Account created successfully!' })
        setIsSuccessful(true)
        
        // В тестовой среде server action возвращает success status без redirect
        // Поэтому делаем клиентский redirect на тот же домен (app.localhost)
        console.log('🎉 Registration successful - redirecting to main page')
        setTimeout(() => {
          window.location.href = window.location.origin + '/'
        }, 1000) // Небольшая задержка для показа toast
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({ type: 'error', description: 'An unexpected error occurred!' })
    }
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  )
}

// END OF: app/(auth)/register/page.tsx
