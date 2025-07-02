/**
 * @file components/header.tsx
 * @description Глобальный тулбар (шапка) приложения.
 * @version 1.5.0
 * @date 2025-07-01
 * @updated Удалены WorldIndicator и DevWorldSelector из header - перенесены в sidebar developer section
 */

/** HISTORY:
 * v1.5.0 (2025-07-01): REFACTOR - Убраны WorldIndicator и DevWorldSelector из header - перенесены в sidebar developer section для админов
 * v1.4.0 (2025-06-28): Добавлен DevWorldSelector - dev-only компонент для быстрого входа в тестовые миры и загрузки их данных
 * v1.3.0 (2025-06-17): Fixed "New Chat" button to directly navigate to new chat with generated UUID instead of homepage.
 * v1.2.1 (2025-06-06): Исправлены классы Tailwind.
 * v1.2.0 (2025-06-06): Добавлена подсветка кнопки "Share".
 * v1.1.0 (2025-06-05): Убран ModelSelector, обновлен вызов SidebarUserNav.
 * v1.0.0 (2025-06-05): Начальная версия компонента.
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation.js'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { SidebarUserNav } from '@/components/sidebar-user-nav'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { PlusIcon, ShareIcon } from '@/components/icons'
import { EnhancedShareDialog } from './enhanced-share-dialog'
import { useChatPublication } from '@/hooks/use-chat-publication'
import { isChatPublished } from '@/lib/publication-client-utils'
import { generateUUID } from '@/lib/utils'
import Package from '../package.json'
import type { VisibilityType } from '@/lib/types'

interface ActiveChatContext {
  chatId: string;
  visibility: VisibilityType;
}

export function Header () {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: activeChatContext } = useSWR<ActiveChatContext | null>('active-chat-context', null, { fallbackData: null })
  const [isShareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [testSession, setTestSession] = React.useState<any>(null)

  // ПРОСТОЕ РЕШЕНИЕ: Проверка test-session cookies напрямую в header
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const testSessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('test-session='))
      
      if (testSessionCookie) {
        try {
          const cookieValue = decodeURIComponent(testSessionCookie.split('=')[1])
          const testSessionData = JSON.parse(cookieValue)
          console.log('🔍 Header: Found test-session for:', testSessionData.user?.email)
          setTestSession(testSessionData)
        } catch (error) {
          console.log('⚠️ Header: Failed to parse test-session cookie:', error)
        }
      }
    }
  }, [])

  // Используем test-session если доступен, иначе обычную session
  const effectiveSession = testSession ? {
    user: {
      id: testSession.user?.id,
      email: testSession.user?.email,
      name: testSession.user?.name,
      type: testSession.user?.type  // Правильно передается тип из test-session
    }
  } : session

  // Debug логирование для диагностики
  React.useEffect(() => {
    if (effectiveSession?.user) {
      console.log('🔍 Header: effectiveSession user:', {
        id: effectiveSession.user.id,
        email: effectiveSession.user.email,
        type: effectiveSession.user.type,
        source: testSession ? 'test-session' : 'auth.js'
      })
    }
  }, [effectiveSession, testSession])

  const chatPublicationHook = useChatPublication({
    chatId: activeChatContext?.chatId,
  })

  return (
    <header
      data-testid="header"
      className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-bold text-lg" data-testid="header-project-logo">
          {Package.appName}
        </Link>
        {/* Stage Indicator - только для DEV/BETA окружений */}
        {(process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL' || process.env.NEXT_PUBLIC_APP_STAGE === 'BETA') && (
          <span className="px-2 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {process.env.NEXT_PUBLIC_APP_STAGE}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          data-testid="header-new-chat-button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const newChatId = generateUUID()
            router.push(`/chat/${newChatId}`)
          }}
        >
          <PlusIcon className="mr-2 size-4"/>
          New Chat
        </Button>
        {activeChatContext && chatPublicationHook.chat && (
          <>
            <Button
              data-testid="header-share-button"
              variant={isChatPublished(chatPublicationHook.chat) ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShareDialogOpen(true)}
            >
              <ShareIcon className="mr-2 size-4"/>
              Share
            </Button>
            <EnhancedShareDialog
              chat={chatPublicationHook.chat}
              onChatUpdate={chatPublicationHook.updateChat}
              open={isShareDialogOpen}
              onOpenChange={setShareDialogOpen}
            />
          </>
        )}
        <ThemeSwitcher data-testid="header-theme-selector"/>
        {effectiveSession?.user && <SidebarUserNav user={effectiveSession.user} data-testid="header-user-menu"/>}
      </div>
    </header>
  )
}

// END OF: components/header.tsx
