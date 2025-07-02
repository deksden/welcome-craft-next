/**
 * @file components/app-sidebar.tsx
 * @description Компонент боковой панели приложения с навигацией.
 * @version 2.13.0
 * @date 2025-07-02
 * @updated UI HIERARCHY ENHANCEMENT: Создана четкая визуальная иерархия с отступами, типографикой и фонами для разделов, подразделов и элементов списков
 */

/** HISTORY:
 * v2.13.0 (2025-07-02): UI HIERARCHY ENHANCEMENT - Четкая визуальная иерархия: разделы полужирные с фоном, подразделы сдвинуты вправо, списки элементов еще правее с меньшим шрифтом. Консистентные отступы ml-2/ml-4. Списки чатов и артефактов выровнены по размеру шрифта.
 * v2.12.0 (2025-07-02): COLLAPSIBLE GROUPS - Добавлены коллапсируемые группы для Dev Tools и Admin секций с chevron иконками, состоянием collapse/expand, localStorage persistence. Унификация UI с AI Chat и Артефакты секциями.
 * v2.11.0 (2025-07-02): SIDEBAR UX FIX - Перемещен World Login пункт внутрь SidebarMenu в Dev Tools секции, убрана белая точка от ul, улучшено визуальное группирование
 * v2.10.0 (2025-07-02): BUG-072 PROPER FIX - Убраны встроенные WorldIndicator/DevWorldSelector из sidebar, заменены ссылкой /world-login, создана отдельная страница World Login
 * v2.9.0 (2025-07-02): BUG-073 FIX - Добавлена ссылка "📁 Импорт файлов" в Артефакты секцию (после "Все артефакты"), перенос импорта из табов в отдельный раздел sidebar
 * v2.8.0 (2025-07-02): BUG-072 FIX - Восстановлен раздел World Login в Dev Tools: добавлены импорты WorldIndicator и DevWorldSelector, создана World Login секция в expanded sidebar
 * v2.7.0 (2025-07-02): SIDEBAR REFRESH FIX - Добавлен useEffect listener для artifact-list-refresh events, список недавних артефактов теперь автоматически обновляется после создания/изменения артефактов
 * v2.6.0 (2025-07-01): SIMPLIFIED ROUTING - Обновлены ссылки phoenix/* на direct routing, убран phoenix/ prefix
 * v2.5.0 (2025-07-01): TEST-SESSION SUPPORT - Добавлена логика чтения test-session cookies (аналогично Header), исправлено определение admin типа в тестах
 * v2.4.0 (2025-07-01): ROLE-BASED ACCESS - Исправлена логика видимости: Artifacts только для admin, Dev Tools только в LOCAL environment, добавлены WorldIndicator и DevWorldSelector в Developer section
 * v2.3.3 (2025-06-28): DEBUG - Расширена отладочная информация: SWR onSuccess/onError callbacks + детальная проверка каждого элемента map
 * v2.3.2 (2025-06-28): DEBUG - Добавлена отладочная информация для диагностики проблемы с undefined kind в recent artifacts API
 * v2.3.1 (2025-06-28): React key error исправлен - убран createdAt из key (вызывал "undefined-undefined"), используется только doc.id для уникальности
 * v2.3.0 (2025-06-28): BUG-043 FIX - Исправлены пустые строки артефактов (добавлен fallback "Без названия"), улучшено выравнивание (иконка BoxIcon, truncate text)
 * v2.2.0 (2025-06-17): Fixed recent artifacts click behavior - removed redundant navigation to artifacts list page.
 * v2.1.0 (2025-06-10): Импорт ArtifactKind из lib/types.
 * v2.0.0 (2025-06-09): Рефакторинг. "Контент" переименован в "Артефакты", обновлены маршруты и API-вызовы.
 * v1.8.0 (2025-06-06): Исправлена структура SidebarMenu/SidebarMenuItem.
 */

'use client'

import * as React from 'react'
import type { User } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation.js'
import { 
  BoxIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  MessageCircleIcon,
  Flame,
  Globe,
  Download,
  Upload,
  Users,
  BarChart3,
  Shield
} from '@/components/icons'
import { SidebarHistory } from '@/components/sidebar-history'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLocalStorage } from 'usehooks-ts'
import useSWR, { mutate } from 'swr'
import { fetcher } from '@/lib/utils'
import { useArtifact } from '@/hooks/use-artifact'
import { Skeleton } from './ui/skeleton'
import { toast } from './toast'
import type { ArtifactKind, ArtifactApiResponse } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

interface SidebarArtifactItemProps {
  artifact: Pick<ArtifactApiResponse, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>;
  isActive: boolean;
  onClick: () => void;
}

function SidebarArtifactItem ({ artifact: doc, isActive, onClick }: SidebarArtifactItemProps) {
  // Обрабатываем пустые title и добавляем fallback
  const displayTitle = doc.title?.trim() || 'Без названия'
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={{
          children: displayTitle,
          side: 'right',
          align: 'center',
        }}
        size="sm"
        className="text-sm"
      >
        <button type="button" onClick={onClick} className="w-full text-left">
          <div className="flex items-center gap-2">
            <BoxIcon size={14} className="shrink-0" />
            <span className="truncate">{displayTitle}</span>
          </div>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar ({ user }: { user: User | undefined }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile, state: sidebarState } = useSidebar()
  const [testSession, setTestSession] = React.useState<any>(null)

  // Read test-session cookies (same logic as Header component)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const testSessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('test-session='))
      
      if (testSessionCookie) {
        try {
          const cookieValue = decodeURIComponent(testSessionCookie.split('=')[1])
          const testSessionData = JSON.parse(cookieValue)
          console.log('🔍 AppSidebar: Found test-session for:', testSessionData.user?.email)
          setTestSession(testSessionData)
        } catch (error) {
          console.log('⚠️ AppSidebar: Failed to parse test-session cookie:', error)
        }
      }
    }
  }, [])

  // Use test-session if available, otherwise use the passed user prop
  const effectiveUser = testSession ? {
    id: testSession.user?.id,
    email: testSession.user?.email,
    name: testSession.user?.name,
    type: testSession.user?.type  // This will include admin type from test-session
  } : user

  // Listen for artifact-list-refresh events to update recent artifacts
  React.useEffect(() => {
    const handleArtifactRefresh = (event: CustomEvent) => {
      console.log('🔄 AppSidebar: Received artifact-list-refresh event:', event.detail)
      
      // Revalidate recent artifacts SWR data
      if (effectiveUser) {
        const swrKey = `/api/artifacts/recent?limit=5`
        console.log('🔄 AppSidebar: Mutating SWR key:', swrKey)
        mutate(swrKey)
      }
    }

    // Add event listener for artifact refresh
    window.addEventListener('artifact-list-refresh', handleArtifactRefresh as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('artifact-list-refresh', handleArtifactRefresh as EventListener)
    }
  }, [effectiveUser]) // Re-run when effectiveUser changes

  console.log('🔍 DEBUG: AppSidebar user state:', {
    userExists: !!effectiveUser,
    userId: effectiveUser?.id,
    userEmail: effectiveUser?.email,
    userName: effectiveUser?.name,
    userType: effectiveUser?.type,
    source: testSession ? 'test-session' : 'props'
  })

  // Role and environment checks
  const isAdmin = effectiveUser?.type === 'admin'
  const isLocalEnv = process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL'
  const isDevEnv = process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL' || process.env.NEXT_PUBLIC_APP_STAGE === 'BETA'

  const [isChatSectionCollapsed, setIsChatSectionCollapsed] = useLocalStorage(
    'sidebar:isChatSectionCollapsed',
    false,
    { initializeWithValue: false }
  )
  const [isArtifactsSectionCollapsed, setIsArtifactsSectionCollapsed] = useLocalStorage(
    'sidebar:isArtifactsSectionCollapsed',
    true,
    { initializeWithValue: false }
  )
  const [isDevToolsSectionCollapsed, setIsDevToolsSectionCollapsed] = useLocalStorage(
    'sidebar:isDevToolsSectionCollapsed',
    false,
    { initializeWithValue: false }
  )
  const [isAdminSectionCollapsed, setIsAdminSectionCollapsed] = useLocalStorage(
    'sidebar:isAdminSectionCollapsed',
    false,
    { initializeWithValue: false }
  )
  const [isAllArtifactsSectionCollapsed, setIsAllArtifactsSectionCollapsed] = useLocalStorage(
    'sidebar:isAllArtifactsSectionCollapsed',
    false,
    { initializeWithValue: false }
  )

  const isChatActive = pathname.startsWith('/chat') || pathname === '/'
  const isArtifactsActive = pathname.startsWith('/artifacts')
  const isDevToolsActive = ['/worlds', '/seed-import', '/seed-export', '/world-login'].some(path => pathname.startsWith(path))
  const isAdminActive = ['/users', '/metrics'].some(path => pathname.startsWith(path))

  const {
    data: recentArtifacts,
    isLoading: isLoadingRecentArtifacts,
  } = useSWR<Array<Pick<ArtifactApiResponse, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>>>(
    effectiveUser ? `/api/artifacts/recent?limit=5` : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      onSuccess: (data) => {
        console.log('🔍 DEBUG: recentArtifacts SWR onSuccess:', {
          dataExists: !!data,
          dataLength: data?.length,
          rawData: data,
          mappedData: data?.map(item => ({
            id: item.id,
            title: item.title,
            kind: item.kind,
            allKeys: Object.keys(item)
          }))
        })
      },
      onError: (error) => {
        console.error('🔍 DEBUG: recentArtifacts SWR onError:', error)
      }
    }
  )

  const { setArtifact } = useArtifact()
  const artifactHook = useArtifact()
  const activeArtifactId = artifactHook.artifact.isVisible ? artifactHook.artifact.artifactId : null

  const handleArtifactClick = (doc: Pick<ArtifactApiResponse, 'id' | 'title' | 'kind' | 'content'>) => {
    console.log('🔍 DEBUG: handleArtifactClick called with:', {
      id: doc.id,
      title: doc.title,
      kind: doc.kind,
      hasContent: !!doc.content,
      allKeys: Object.keys(doc)
    })
    
    if (!doc.kind) {
      console.error('SYS_COMP_APP_SIDEBAR: Artifact kind is undefined, cannot open.', doc)
      toast({ type: 'error', description: 'Не удалось определить тип артефакта.' })
      return
    }
    toast({ type: 'loading', description: `Открываю "${doc.title}"...` })
    setArtifact({
      artifactId: doc.id,
      title: doc.title,
      kind: doc.kind as ArtifactKind,
      content: doc.content,
      isVisible: true,
      status: 'idle',
      displayMode: 'split',
      saveStatus: 'saved',
      boundingBox: { top: 0, left: 0, width: 0, height: 0 },
    })
    setOpenMobile(false)
  }

  return (
    <Sidebar>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                data-testid="sidebar-chat-section"
                onClick={() => {
                  if (sidebarState === 'collapsed') {
                    router.push('/')
                  } else {
                    setIsChatSectionCollapsed(!isChatSectionCollapsed)
                  }
                  setOpenMobile(false)
                }}
                isActive={isChatActive}
                tooltip={{ children: 'AI Чат', side: 'right' }}
                className="justify-between font-semibold bg-muted/50 hover:bg-muted/80"
              >
                <div className="flex items-center gap-2">
                  <MessageCircleIcon size={18}/>
                  {sidebarState === 'expanded' && <span className="text-base">AI Чат</span>}
                </div>
                {sidebarState === 'expanded' && (
                  <ChevronDownIcon
                    size={16}
                    className={`transition-transform duration-200 ${
                      isChatSectionCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {!isChatSectionCollapsed && sidebarState === 'expanded' && (
            <div className="ml-2">
              <SidebarHistory user={effectiveUser}/>
            </div>
          )}
        </SidebarGroup>

        {(effectiveUser && isAdmin) && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  data-testid="sidebar-artifacts-button"
                  onClick={() => {
                    if (sidebarState === 'collapsed') {
                      router.push('/artifacts')
                    } else {
                      setIsArtifactsSectionCollapsed(!isArtifactsSectionCollapsed)
                    }
                    setOpenMobile(false)
                  }}
                  isActive={isArtifactsActive}
                  tooltip={{ children: 'Артефакты', side: 'right' }}
                  className="justify-between font-semibold bg-muted/50 hover:bg-muted/80"
                >
                  <div className="flex items-center gap-2">
                    <BoxIcon size={18}/>
                    {sidebarState === 'expanded' && <span className="text-base">Артефакты</span>}
                  </div>
                  {sidebarState === 'expanded' && (
                    <ChevronDownIcon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isArtifactsSectionCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isArtifactsSectionCollapsed && sidebarState === 'expanded' && (
              <div className="ml-2">
                <SidebarMenu>
                  {/* Подраздел: Все артефакты (раскрывающийся) */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      data-testid="sidebar-all-artifacts-subsection"
                      onClick={() => {
                        setIsAllArtifactsSectionCollapsed(!isAllArtifactsSectionCollapsed)
                      }}
                      className="justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <BoxIcon size={16}/>
                        <span>Все артефакты</span>
                      </div>
                      <ChevronDownIcon
                        size={14}
                        className={`transition-transform duration-200 ${
                          isAllArtifactsSectionCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* Список недавних артефактов (сдвинут еще правее) */}
                  {!isAllArtifactsSectionCollapsed && (
                    <div className="ml-2">
                      {isLoadingRecentArtifacts && (
                        <div className="flex flex-col gap-1 px-2">
                          <Skeleton className="h-6 w-4/5"/>
                          <Skeleton className="h-6 w-3/5"/>
                        </div>
                      )}
                      {!isLoadingRecentArtifacts && recentArtifacts?.map((doc, index) => {
                        console.log(`🔍 DEBUG: Rendering artifact ${index}:`, {
                          id: doc.id,
                          title: doc.title,
                          kind: doc.kind,
                          hasContent: !!doc.content,
                          allKeys: Object.keys(doc)
                        })
                        return (
                          <SidebarArtifactItem
                            key={doc.id}
                            artifact={doc}
                            isActive={activeArtifactId === doc.id}
                            onClick={() => handleArtifactClick(doc)}
                          />
                        )
                      })}
                      {!isLoadingRecentArtifacts && (!recentArtifacts || recentArtifacts.length === 0) && (
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/70 text-center">Нет недавних
                          артефактов.</div>
                      )}
                      
                      {/* Кнопка "Посмотреть все" */}
                      <SidebarMenu>
                        <SidebarMenuItem className="mt-1">
                          <SidebarMenuButton
                            data-testid="sidebar-view-all-artifacts-button"
                            onClick={() => {
                              router.push('/artifacts')
                              setOpenMobile(false)
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs"
                          >
                            <span>Посмотреть все</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </div>
                  )}
                  
                  {/* Подраздел: Импорт файлов */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-sm">
                      <Link href="/import" onClick={() => setOpenMobile(false)}>
                        <Upload className="size-4 mr-2" />
                        <span>Импорт файлов</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </SidebarGroup>
        )}

        {isAdmin && isLocalEnv && (
          <SidebarGroup data-testid="sidebar-dev-tools-section">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  data-testid="sidebar-dev-tools-section"
                  onClick={() => {
                    if (sidebarState === 'collapsed') {
                      router.push('/worlds')
                    } else {
                      setIsDevToolsSectionCollapsed(!isDevToolsSectionCollapsed)
                    }
                    setOpenMobile(false)
                  }}
                  isActive={isDevToolsActive}
                  tooltip={{ children: 'Dev Tools', side: 'right' }}
                  className="justify-between font-semibold bg-muted/50 hover:bg-muted/80"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="size-5" />
                    {sidebarState === 'expanded' && <span className="text-base">Dev Tools</span>}
                  </div>
                  {sidebarState === 'expanded' && (
                    <ChevronDownIcon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isDevToolsSectionCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isDevToolsSectionCollapsed && sidebarState === 'expanded' && (
              <div className="ml-2">
                <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-sm">
                    <Link href="/worlds" onClick={() => setOpenMobile(false)}>
                      <Globe className="size-4 mr-2" />
                      <span>World Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-sm">
                    <Link href="/seed-import" onClick={() => setOpenMobile(false)}>
                      <Download className="size-4 mr-2" />
                      <span>Seed Import</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-sm">
                    <Link href="/seed-export" onClick={() => setOpenMobile(false)}>
                      <Upload className="size-4 mr-2" />
                      <span>Seed Export</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-sm">
                    <Link href="/world-login" onClick={() => setOpenMobile(false)}>
                      <Globe className="size-4 mr-2" />
                      <span>World Login</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup data-testid="sidebar-admin-section">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  data-testid="sidebar-admin-section"
                  onClick={() => {
                    if (sidebarState === 'collapsed') {
                      router.push('/users')
                    } else {
                      setIsAdminSectionCollapsed(!isAdminSectionCollapsed)
                    }
                    setOpenMobile(false)
                  }}
                  isActive={isAdminActive}
                  tooltip={{ children: 'Admin', side: 'right' }}
                  className="justify-between font-semibold bg-muted/50 hover:bg-muted/80"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-5" />
                    {sidebarState === 'expanded' && <span className="text-base">Admin</span>}
                  </div>
                  {sidebarState === 'expanded' && (
                    <ChevronDownIcon
                      size={16}
                      className={`transition-transform duration-200 ${
                        isAdminSectionCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {!isAdminSectionCollapsed && sidebarState === 'expanded' && (
              <div className="ml-2">
                <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-sm">
                    <Link href="/users" onClick={() => setOpenMobile(false)}>
                      <Users className="size-4 mr-2" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-sm">
                    <Link href="/metrics" onClick={() => setOpenMobile(false)}>
                      <BarChart3 className="size-4 mr-2" />
                      <span>System Metrics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarTrigger 
          data-testid="sidebar-toggle-button"
          className="ml-auto hidden md:flex"
        >
          <ChevronLeftIcon
            className={`transition-transform duration-200 ${sidebarState === 'collapsed' ? 'rotate-180' : 'rotate-0'}`}/>
        </SidebarTrigger>
      </SidebarFooter>
    </Sidebar>
  )
}

// END OF: components/app-sidebar.tsx
