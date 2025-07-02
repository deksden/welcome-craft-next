/**
 * @file components/artifact-grid-client-wrapper.tsx
 * @description Клиентский компонент-обертка для сетки артефактов с элегантным обновлением.
 * @version 2.5.0
 * @date 2025-07-02
 * @updated UNIFIED ARTIFACT CREATION: Интегрирован CreateArtifactDialog - кнопка "Создать новый" теперь открывает унифицированный диалог выбора типа артефакта
 */

/** HISTORY:
 * v2.5.0 (2025-07-02): UNIFIED ARTIFACT CREATION - Интегрирован CreateArtifactDialog: кнопка "Создать новый" открывает диалог с выбором между AI чатом и прямым созданием 11 типов артефактов. Добавлен state isCreateDialogOpen.
 * v2.4.0 (2025-07-02): BUG-036 FIX - Исправлена кнопка "Создать новый" артефакт: заменен router.push('/') на setArtifact() с правильными параметрами для создания нового артефакта
 * v2.3.0 (2025-06-27): Интегрирован useElegantArtifactRefresh hook для элегантного обновления списков артефактов без page.reload() - решение BUG-034
 * v2.2.0 (2025-06-20): Added type filtering UI with Select component - user can filter by text, code, sheet, site, image (BUG-022).
 * v2.1.1 (2025-06-11): Fixed exhaustive-deps linting rule by wrapping handleCardClick in useCallback.
 * v2.1.0 (2025-06-10): Импорт ArtifactKind теперь из общего файла lib/types.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PlusIcon } from '@/components/icons'
import { type ArtifactDocument, ArtifactGridDisplay } from './artifact-grid-display'
import { useDebounceCallback } from 'usehooks-ts'
import { toast } from '@/components/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtifact } from '@/hooks/use-artifact'
import { useElegantArtifactRefresh } from '@/hooks/use-elegant-artifact-refresh'
import { useArtifactFilter } from '@/hooks/use-artifact-filter'
import { fetcher } from '@/lib/utils'
import type { ArtifactKind } from '@/lib/types'
import { CreateArtifactDialog } from '@/components/create-artifact-dialog'

const PAGE_SIZE = 12
const skeletonKeys = Array.from({ length: PAGE_SIZE }, (_, i) => `sk-item-${i}`)

interface ArtifactListApiResponse {
  data: ArtifactDocument[];
  totalCount: number;
}

export function ArtifactGridClientWrapper ({ userId, openArtifactId }: { userId: string; openArtifactId?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { setArtifact } = useArtifact()
  const { refreshArtifacts } = useElegantArtifactRefresh()
  
  // 🚀 COLLABORATIVE SYSTEM: Use database-backed filter preference
  const { showOnlyMyArtifacts, updatePreference, isUpdating } = useArtifactFilter()
  
  // State for CreateArtifactDialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [kindFilter, setKindFilter] = useState<ArtifactKind | 'all'>(
    (searchParams.get('kind') as ArtifactKind) || 'all'
  )
  // 🚀 URL override for collaborative filter (URL parameter overrides database setting)
  const urlShowOnlyMy = searchParams.get('showOnlyMy')
  const effectiveShowOnlyMy = urlShowOnlyMy !== null ? urlShowOnlyMy === 'true' : showOnlyMyArtifacts
  const debouncedSearchTerm = useDebounceCallback(setSearchTerm, 500)

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      for (const [name, value] of Object.entries(paramsToUpdate)) {
        if (value === undefined || value === '') {
          current.delete(name)
        } else {
          current.set(name, String(value))
        }
      }
      return current.toString()
    },
    [searchParams],
  )

  useEffect(() => {
    const newQuery = createQueryString({
      page: currentPage === 1 ? undefined : currentPage,
      search: searchTerm === '' ? undefined : searchTerm,
      kind: kindFilter === 'all' ? undefined : kindFilter,
      showOnlyMy: urlShowOnlyMy !== null ? urlShowOnlyMy : undefined, // 🚀 Only include if explicitly set in URL
    })
    const finalQuery = newQuery.toString() ? `?${newQuery}` : ''
    router.push(`${pathname}${finalQuery}`, { scroll: false })
  }, [currentPage, searchTerm, kindFilter, urlShowOnlyMy, router, pathname, createQueryString]) // 🚀 URL param dependency

  const { data, error, isLoading, mutate } = useSWR<ArtifactListApiResponse>(
    `/api/artifacts?page=${currentPage}&pageSize=${PAGE_SIZE}&searchQuery=${encodeURIComponent(searchTerm)}${kindFilter !== 'all' ? `&kind=${kindFilter}` : ''}${urlShowOnlyMy !== null ? `&showOnlyMy=${urlShowOnlyMy}` : ''}&groupByVersions=true`,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  )

  /**
   * @description Элегантное обновление списка артефактов через SWR mutate + global refresh
   * @feature Заменяет грубый page.reload() на элегантное обновление
   */
  const handleElegantRefresh = useCallback(async () => {
    console.log('🔄 Triggering elegant artifact refresh...')
    
    try {
      // Метод 1: Обновляем текущий SWR endpoint
      await mutate()
      
      // Метод 2: Обновляем все связанные списки артефактов (sidebar, "Мои артефакты" и т.д.)
      await refreshArtifacts({ 
        showToast: false, // не показываем toast так как это внутренний refresh
        endpoints: [
          `/api/artifacts?page=${currentPage}&pageSize=${PAGE_SIZE}`,
          '/api/artifacts',
          'artifacts-sidebar'
        ]
      })
      
      console.log('✅ Elegant artifact refresh completed')
      return true
    } catch (error) {
      console.error('❌ Elegant artifact refresh failed:', error)
      return false
    }
  }, [mutate, refreshArtifacts, currentPage])

  const handleCardClick = useCallback((doc: ArtifactDocument) => {
    if (doc.kind) {
      toast({ type: 'loading', description: `Открываю "${doc.title}"...` })
      setArtifact({
        artifactId: doc.id,
        title: doc.title,
        kind: doc.kind as ArtifactKind,
        content: doc.content,
        isVisible: true,
        status: 'idle',
        saveStatus: 'saved',
        displayMode: 'split',
        boundingBox: { top: 0, left: 0, width: 0, height: 0 },
      })
    } else {
      toast({ type: 'error', description: 'Не удалось определить тип артефакта.' })
    }
  }, [setArtifact])

  useEffect(() => {
    if (openArtifactId && data?.data) {
      const docToOpen = data.data.find(doc => doc.id === openArtifactId)
      if (docToOpen) {
        handleCardClick(docToOpen)
        const newQuery = createQueryString({ openArtifactId: undefined })
        router.replace(`${pathname}?${newQuery}`, { scroll: false })
      }
    }
  }, [openArtifactId, data, createQueryString, pathname, router, handleCardClick])

  // Элегантное обновление через window events
  useEffect(() => {
    const handleArtifactRefreshEvent = async (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('📡 Received artifact refresh event:', customEvent.detail)
      await handleElegantRefresh()
    }

    // Слушаем custom event для обновления артефактов
    window.addEventListener('artifact-list-refresh', handleArtifactRefreshEvent)
    
    return () => {
      window.removeEventListener('artifact-list-refresh', handleArtifactRefreshEvent)
    }
  }, [handleElegantRefresh])

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages)) {
      setCurrentPage(newPage)
    }
  }

  if (error) {
    return <div className="text-destructive">Ошибка загрузки артефактов: {error.message}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* 🚀 COLLABORATIVE SYSTEM: Filter toggle */}
        <div className="flex justify-center sm:justify-start">
          <ToggleGroup 
            type="single" 
            value={effectiveShowOnlyMy ? 'my' : 'all'} 
            onValueChange={async (value) => {
              const newShowOnlyMy = value === 'my'
              
              try {
                // Update database preference
                await updatePreference(newShowOnlyMy)
                
                // Reset page when filter changes
                setCurrentPage(1)
                
                // Remove URL override since we're now using database setting
                const newQuery = createQueryString({ 
                  showOnlyMy: undefined,
                  page: undefined 
                })
                router.push(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false })
                
              } catch (error) {
                toast({ 
                  type: 'error', 
                  description: 'Не удалось сохранить настройки фильтра' 
                })
              }
            }}
            className="border rounded-md"
            disabled={isUpdating}
          >
            <ToggleGroupItem value="all" className="px-4 py-2" disabled={isUpdating}>
              🌐 Все артефакты
            </ToggleGroupItem>
            <ToggleGroupItem value="my" className="px-4 py-2" disabled={isUpdating}>
              👤 Мои {isUpdating && '...'}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Input
              placeholder="Поиск по заголовкам..."
              defaultValue={searchTerm}
              onChange={(e) => debouncedSearchTerm(e.target.value)}
              className="max-w-sm bg-background"
            />
            <Select
              value={kindFilter}
              onValueChange={(value: ArtifactKind | 'all') => {
                setKindFilter(value)
                setCurrentPage(1) // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Тип артефакта" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="text">📝 Текст</SelectItem>
                <SelectItem value="code">💻 Код</SelectItem>
                <SelectItem value="sheet">📊 Таблица</SelectItem>
                <SelectItem value="site">🌐 Сайт</SelectItem>
                <SelectItem value="image">🖼️ Изображение</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            className="w-full sm:w-auto"
          >
            <PlusIcon className="mr-2 size-4"/> Создать новый
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <GridSkeletonPreview/>
      ) : (
        <ArtifactGridDisplay
          artifacts={data?.data || []}
          isLoading={isLoading}
          page={currentPage}
          totalCount={data?.totalCount || 0}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRefresh={handleElegantRefresh}
          onCardClick={handleCardClick}
        />
      )}
      
      <CreateArtifactDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  )
}

function GridSkeletonPreview () {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skeletonKeys.map((key) => (
          <div key={key} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl"/>
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5"/>
              <Skeleton className="h-4 w-2/5"/>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex justify-between items-center">
        <Skeleton className="h-8 w-1/5"/>
        <Skeleton className="h-10 w-1/4"/>
      </div>
    </div>
  )
}

// END OF: components/artifact-grid-client-wrapper.tsx
