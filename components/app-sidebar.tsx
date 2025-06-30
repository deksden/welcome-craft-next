/**
 * @file components/app-sidebar.tsx
 * @description Компонент боковой панели приложения с навигацией.
 * @version 2.3.3
 * @date 2025-06-28
 * @updated DEBUG: Расширена отладочная информация - проверка SWR onSuccess/onError + детальная проверка каждого элемента в map
 */

/** HISTORY:
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

import type { User } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation'
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
import useSWR from 'swr'
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
      >
        <button type="button" onClick={onClick} className="w-full text-left">
          <div className="flex items-center gap-2">
            <BoxIcon size={16} className="shrink-0" />
            <span className="truncate">{displayTitle}</span>
          </div>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar ({ user }: { user: User | undefined }) {
  console.log('🔍 DEBUG: AppSidebar user state:', {
    userExists: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name
  })
  
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile, state: sidebarState } = useSidebar()

  // Admin checks
  const isAdmin = user?.type === 'admin'
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

  const isChatActive = pathname.startsWith('/chat') || pathname === '/'
  const isArtifactsActive = pathname.startsWith('/artifacts')

  const {
    data: recentArtifacts,
    isLoading: isLoadingRecentArtifacts,
  } = useSWR<Array<Pick<ArtifactApiResponse, 'id' | 'title' | 'createdAt' | 'kind' | 'content'>>>(
    user ? `/api/artifacts/recent?limit=5` : null,
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
                className="justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageCircleIcon size={18}/>
                  {sidebarState === 'expanded' && <span>AI Чат</span>}
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
            <SidebarHistory user={user}/>
          )}
        </SidebarGroup>

        {user && (
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
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    <BoxIcon size={18}/>
                    {sidebarState === 'expanded' && <span>Мои Артефакты</span>}
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
              <SidebarMenu>
                {isLoadingRecentArtifacts && (
                  <div className="flex flex-col gap-1 px-2">
                    <Skeleton className="h-7 w-4/5"/>
                    <Skeleton className="h-7 w-3/5"/>
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
                <SidebarMenuItem className="mt-1">
                  <SidebarMenuButton
                    data-testid="sidebar-all-artifacts-button"
                    onClick={() => {
                      router.push('/artifacts')
                      setOpenMobile(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                  >
                    <span>Все артефакты</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroup>
        )}

        {/* Dev Tools Section - только для админов в LOCAL/BETA */}
        {isAdmin && isDevEnv && (
          <SidebarGroup data-testid="sidebar-dev-tools-section">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Dev Tools', side: 'right' }}>
                  <Flame className="size-5" />
                  {sidebarState === 'expanded' && <span>Dev Tools</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {sidebarState === 'expanded' && (
              <SidebarMenu className="ml-4">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/phoenix/worlds" onClick={() => setOpenMobile(false)}>
                      <Globe className="size-4 mr-2" />
                      <span>World Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/phoenix/seed-import" onClick={() => setOpenMobile(false)}>
                      <Download className="size-4 mr-2" />
                      <span>Seed Import</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/phoenix/seed-export" onClick={() => setOpenMobile(false)}>
                      <Upload className="size-4 mr-2" />
                      <span>Seed Export</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroup>
        )}

        {/* Admin Section - для админов в любом окружении */}
        {isAdmin && (
          <SidebarGroup data-testid="sidebar-admin-section">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Admin', side: 'right' }}>
                  <Shield className="size-5" />
                  {sidebarState === 'expanded' && <span>Admin</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {sidebarState === 'expanded' && (
              <SidebarMenu className="ml-4">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/phoenix/users" onClick={() => setOpenMobile(false)}>
                      <Users className="size-4 mr-2" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/phoenix/metrics" onClick={() => setOpenMobile(false)}>
                      <BarChart3 className="size-4 mr-2" />
                      <span>System Metrics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
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
