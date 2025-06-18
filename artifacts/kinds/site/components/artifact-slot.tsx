/**
 * @file artifacts/kinds/site/components/artifact-slot.tsx
 * @description Интерактивный компонент для управления одним слотом артефакта в site editor.
 * @version 0.1.0
 * @date 2025-06-16
 * @updated Initial version for visual site editor.
 */

/** HISTORY:
 * v0.1.0 (2025-06-16): Initial implementation with artifact selection, versioning, and actions.
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PlusIcon, MoreHorizontalIcon } from 'lucide-react'
import { ArtifactDisplayCard, type ArtifactDisplayData } from '@/components/artifact-display-card'
import { ArtifactSelectorSheet } from '@/components/artifact-selector-sheet'
import type { BlockSlotDefinition, BlockSlotData } from '@/site-blocks/types'
import useSWR from 'swr'

interface ArtifactSlotProps {
  slotDefinition: BlockSlotDefinition
  currentValue: BlockSlotData
  onChange: (newValue: BlockSlotData) => void
  isReadonly?: boolean
}

interface ArtifactResponse {
  id: string
  title: string
  summary?: string | null
  kind: string
}

const fetcher = async (url: string): Promise<ArtifactResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch artifact')
  }
  const artifacts = await response.json()
  
  // API возвращает массив всех версий, берем последнюю (последний элемент)
  if (Array.isArray(artifacts) && artifacts.length > 0) {
    return artifacts[artifacts.length - 1]
  }
  
  throw new Error('No artifacts found')
}

/**
 * @description Компонент для управления одним слотом артефакта - выбор, очистка, версионирование
 * @param slotDefinition - определение слота из блока
 * @param currentValue - текущее значение слота (ID и версия)
 * @param onChange - обработчик изменения значения слота
 * @param isReadonly - если true, отключает все интерактивные действия
 */
export function ArtifactSlot({ 
  slotDefinition, 
  currentValue, 
  onChange,
  isReadonly = false
}: ArtifactSlotProps) {
  const [selectorOpen, setSelectorOpen] = React.useState(false)

  // Загружаем данные артефакта, если есть ID
  const { data: artifactData, error } = useSWR(
    currentValue.artifactId ? `/api/artifact?id=${currentValue.artifactId}` : null,
    fetcher
  )

  const handleSelect = React.useCallback((artifact: ArtifactDisplayData) => {
    onChange({
      artifactId: artifact.id,
      versionTimestamp: undefined, // Используем последнюю версию по умолчанию
    })
  }, [onChange])

  const handleClear = React.useCallback(() => {
    onChange({
      artifactId: '', // Используем пустую строку вместо undefined
      versionTimestamp: undefined,
    })
  }, [onChange])

  const handleUseLatest = React.useCallback(() => {
    onChange({
      artifactId: currentValue.artifactId,
      versionTimestamp: undefined,
    })
  }, [onChange, currentValue.artifactId])

  const handleSelectVersion = React.useCallback(() => {
    // TODO: Открыть диалог выбора версии
    console.log('Select version - to be implemented')
  }, [])

  // Если нет выбранного артефакта - показываем кнопку добавления (или просто текст в readonly режиме)
  if (!currentValue.artifactId || currentValue.artifactId === '' || error) {
    if (isReadonly) {
      return (
        <div className="w-full h-auto min-h-[60px] flex items-center justify-center border border-dashed border-muted-foreground/20 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {slotDefinition.caption} (не назначен)
          </span>
        </div>
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-auto min-h-[60px] justify-start"
              onClick={() => setSelectorOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {slotDefinition.caption}
            </Button>
          </TooltipTrigger>
          {slotDefinition.description && (
            <TooltipContent>
              <p>{slotDefinition.description}</p>
            </TooltipContent>
          )}
        </Tooltip>

        <ArtifactSelectorSheet
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          slotDefinition={slotDefinition}
          onSelect={handleSelect}
        />
      </TooltipProvider>
    )
  }

  // Если артефакт выбран - показываем карточку с действиями (или только карточку в readonly режиме)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        {artifactData ? (
          <ArtifactDisplayCard
            artifact={{
              id: artifactData.id,
              title: artifactData.title,
              summary: artifactData.summary,
              kind: artifactData.kind as any, // Type assertion для совместимости
            }}
          />
        ) : (
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-semibold">Загружается...</div>
              <div className="text-xs text-muted-foreground">ID: {currentValue.artifactId}</div>
            </div>
          </div>
        )}
      </div>

      {!isReadonly && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectorOpen(true)}>
                Выбрать другой...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUseLatest}>
                Использовать последнюю версию
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSelectVersion}>
                Выбрать версию...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClear} className="text-destructive">
                Очистить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ArtifactSelectorSheet
            open={selectorOpen}
            onOpenChange={setSelectorOpen}
            slotDefinition={slotDefinition}
            onSelect={handleSelect}
          />
        </>
      )}
    </div>
  )
}

// END OF: artifacts/kinds/site/components/artifact-slot.tsx