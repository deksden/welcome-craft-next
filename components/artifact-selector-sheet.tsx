/**
 * @file components/artifact-selector-sheet.tsx
 * @description Выезжающая панель для поиска и выбора артефактов в site editor.
 * @version 0.1.0
 * @date 2025-06-16
 * @updated Initial version for visual site editor.
 */

/** HISTORY:
 * v0.1.0 (2025-06-16): Initial implementation with search, filtering and pagination.
 */

'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SearchIcon } from 'lucide-react'
import { useDebounceCallback } from 'usehooks-ts'
import useSWRInfinite from 'swr/infinite'
import { ArtifactDisplayCard, type ArtifactDisplayData } from './artifact-display-card'
import type { ArtifactKind } from '@/lib/types'
import type { BlockSlotDefinition } from '@/site-blocks/types'

interface ArtifactSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slotDefinition: BlockSlotDefinition
  onSelect: (artifact: ArtifactDisplayData) => void
  title?: string
}

interface ArtifactsResponse {
  artifacts: ArtifactDisplayData[]
  hasMore: boolean
  nextCursor?: string
}

const fetcher = async (url: string): Promise<ArtifactsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch artifacts')
  }
  return response.json()
}

/**
 * @description Выезжающая панель для выбора артефактов с поиском и фильтрацией
 * @param open - состояние открытия панели
 * @param onOpenChange - обработчик изменения состояния
 * @param slotDefinition - определение слота для настройки фильтров
 * @param onSelect - обработчик выбора артефакта
 * @param title - заголовок панели (опционально)
 */
export function ArtifactSelectorSheet({
  open,
  onOpenChange,
  slotDefinition,
  onSelect,
  title,
}: ArtifactSelectorSheetProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedKind, setSelectedKind] = React.useState<ArtifactKind | 'all'>('all')

  const debouncedSearch = useDebounceCallback(setSearchQuery, 300)

  // Определяем поддерживаемые типы артефактов
  const supportedKinds = React.useMemo(() => {
    if (Array.isArray(slotDefinition.kind)) {
      return slotDefinition.kind
    }
    return [slotDefinition.kind]
  }, [slotDefinition.kind])

  // Автоматически устанавливаем тип, если поддерживается только один
  React.useEffect(() => {
    if (supportedKinds.length === 1) {
      setSelectedKind(supportedKinds[0])
    }
  }, [supportedKinds])

  const getKey = React.useCallback(
    (pageIndex: number, previousPageData: ArtifactsResponse | null) => {
      if (previousPageData && !previousPageData.hasMore) return null

      const params = new URLSearchParams()
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }
      
      if (selectedKind !== 'all') {
        params.set('kind', selectedKind)
      }
      
      if (slotDefinition.tags && slotDefinition.tags.length > 0) {
        params.set('tags', slotDefinition.tags.join(','))
      }
      
      if (previousPageData?.nextCursor) {
        params.set('cursor', previousPageData.nextCursor)
      }

      return `/api/artifacts?${params.toString()}`
    },
    [searchQuery, selectedKind, slotDefinition.tags]
  )

  const {
    data,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite<ArtifactsResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
  })

  const artifacts = React.useMemo(() => {
    return data?.flatMap(page => page.artifacts) ?? []
  }, [data])

  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const hasMore = data?.[data.length - 1]?.hasMore ?? false

  const handleLoadMore = React.useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setSize(size + 1)
    }
  }, [isLoadingMore, hasMore, size, setSize])

  const handleSelect = React.useCallback((artifact: ArtifactDisplayData) => {
    onSelect(artifact)
    onOpenChange(false)
  }, [onSelect, onOpenChange])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {title || `Выберите ${slotDefinition.caption.toLowerCase()}`}
          </SheetTitle>
          {slotDefinition.description && (
            <SheetDescription>
              {slotDefinition.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Поиск */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Поиск артефактов..."
              className="pl-10"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>

          {/* Фильтр по типу (если поддерживается несколько типов) */}
          {supportedKinds.length > 1 && (
            <div>
              <div className="text-sm font-medium mb-2 block">Тип артефакта</div>
              <ToggleGroup
                type="single"
                value={selectedKind}
                onValueChange={(value) => setSelectedKind(value as ArtifactKind || 'all')}
                className="justify-start"
              >
                <ToggleGroupItem value="all">Все</ToggleGroupItem>
                {supportedKinds.map(kind => (
                  <ToggleGroupItem key={kind} value={kind}>
                    {kind}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {/* Список артефактов */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {error && (
              <div className="text-center text-sm text-destructive py-4">
                Ошибка загрузки артефактов
              </div>
            )}

            {artifacts.length === 0 && !isLoading && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Артефакты не найдены
              </div>
            )}

            {artifacts.map((artifact) => (
              <ArtifactDisplayCard
                key={artifact.id}
                artifact={artifact}
                onClick={() => handleSelect(artifact)}
              />
            ))}

            {/* Кнопка "Загрузить еще" */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {isLoadingMore ? 'Загружается...' : 'Загрузить еще'}
                </button>
              </div>
            )}

            {isLoading && artifacts.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                Загружается...
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// END OF: components/artifact-selector-sheet.tsx