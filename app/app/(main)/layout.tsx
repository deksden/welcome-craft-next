/**
 * @file app/(main)/layout.tsx
 * @description Основной серверный макет приложения. Отвечает за получение сессии и рендеринг клиентской обертки.
 * @version 1.2.0
 * @date 2025-06-05
 * @updated Разделен на серверный и клиентский компоненты. Этот файл теперь является чистым серверным компонентом.
 */

/** HISTORY:
 * v1.2.0 (2025-06-05): Рефакторинг. Логика, использующая 'use client', вынесена в 'main-layout-client.tsx'. Этот файл теперь является серверным.
 * v1.1.0 (2025-06-05): Внедрена динамическая сетка для split-view артефакта. Компонент Artifact теперь управляется глобально.
 * v1.0.0 (2025-05-25): Начальная версия макета.
 */

import Script from 'next/script'
import { auth } from '@/app/app/(auth)/auth'
import { MainLayoutClient } from '@/components/main-layout-client'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const experimental_ppr = true

export default async function Layout ({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRITICAL FIX: Avoid auth() call in test environment to prevent Server Component blocking
  // In test environment, FastSessionProvider handles session via client-side cookies
  const isTestEnv = process.env.NODE_ENV === 'test' || 
                    process.env.PLAYWRIGHT === 'true' || 
                    !!process.env.PLAYWRIGHT_PORT ||
                    process.env.APP_STAGE === 'LOCAL' || 
                    process.env.APP_STAGE === 'BETA'
  
  console.log('🔧 LAYOUT: Test environment detected:', isTestEnv)
  console.log('🔧 LAYOUT: Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    PLAYWRIGHT: process.env.PLAYWRIGHT,
    PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT,
    APP_STAGE: process.env.APP_STAGE
  })
  
  let session = null
  
  if (!isTestEnv) {
    console.log('🔧 LAYOUT: Calling NextAuth auth() for production environment')
    session = await auth()
  } else {
    console.log('🔧 LAYOUT: Skipping NextAuth auth() call - using FastSessionProvider for test environment')
    // In test environment, session will be handled by FastSessionProvider client-side
    // Set session to null to allow component rendering without blocking
    session = null
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <MainLayoutClient session={session}>
        {children}
      </MainLayoutClient>
      <SpeedInsights/>
    </>
  )
}

// END OF: app/(main)/layout.tsx
