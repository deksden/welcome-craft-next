/**
 * @file artifacts/kinds/site/client.tsx
 * @description Визуальный редактор артефакта типа "Сайт".
 * @version 0.2.0
 * @date 2025-06-12
 * @updated Refactored to visual block-based editor with dynamic UI.
 */

/** HISTORY:
 * v0.2.0 (2025-06-16): Complete refactor to visual editor with BlockCard components.
 * v0.1.0 (2025-06-12): Initial version of site artifact editor.
 */

'use client'

import * as React from 'react'
import { Artifact } from '@/components/create-artifact'
import { BlockCard } from './components/block-card'
import { blockDefinitions } from '@/site-blocks'
import { GlobeIcon } from '@/components/icons'
import type { BlockSlotData } from '@/site-blocks/types'

interface SiteBlock {
  type: string
  slots: Record<string, BlockSlotData>
}

interface SiteDefinition {
  theme: string
  blocks: Array<SiteBlock>
}

type Metadata = undefined

/**
 * @description Компонент визуального редактора сайта
 * @param content - JSON-строка с определением сайта
 * @param onSaveContent - функция сохранения изменений
 */
function SiteEditor({ 
  content, 
  onSaveContent,
  isLoading = false,
  isReadonly = false
}: { 
  content?: string | null
  onSaveContent: (content: string, debounce?: boolean) => void
  isLoading?: boolean
  isReadonly?: boolean
}) {
  const [siteDefinition, setSiteDefinition] = React.useState<SiteDefinition>(() => {
    try {
      return content ? JSON.parse(content) : { theme: 'default', blocks: [] }
    } catch {
      return { theme: 'default', blocks: [] }
    }
  })

  // АВТОСОХРАНЕНИЕ ОТКЛЮЧЕНО - сохраняем только при замене слотов
  // React.useEffect отключен - сохранение происходит только в handleBlockChange

  // Функция для создания структурного отпечатка сайта (без конкретных artifactId)
  const getStructuralFingerprint = React.useCallback((definition: SiteDefinition) => {
    return JSON.stringify({
      theme: definition.theme,
      blocks: definition.blocks.map(block => ({
        type: block.type,
        slots: Object.fromEntries(
          Object.entries(block.slots).map(([slotName, _]) => [slotName, 'present'])
        )
      }))
    })
  }, [])

  const [lastStructuralFingerprint, setLastStructuralFingerprint] = React.useState<string>('')

  React.useEffect(() => {
    // Устанавливаем начальный структурный отпечаток
    setLastStructuralFingerprint(getStructuralFingerprint(siteDefinition))
  }, []) // Только при первой загрузке

  const handleBlockChange = React.useCallback((
    blockIndex: number, 
    updatedBlock: SiteBlock
  ) => {
    if (isReadonly) return; // Не позволяем изменения в readonly режиме
    
    setSiteDefinition(prev => {
      const newDefinition = { ...prev }
      newDefinition.blocks = [...prev.blocks]
      newDefinition.blocks[blockIndex] = updatedBlock
      
      // Проверяем, изменилась ли структура (а не только слоты)
      const newFingerprint = getStructuralFingerprint(newDefinition)
      const structureChanged = newFingerprint !== lastStructuralFingerprint
      
      // Сохраняем при изменении слотов (замене артефактов)
      // Но генерируем summary только при изменении структуры
      onSaveContent(JSON.stringify(newDefinition), true)
      
      if (structureChanged) {
        setLastStructuralFingerprint(newFingerprint)
        // TODO: Здесь можно добавить отдельный флаг для принудительной генерации summary
      }
      
      return newDefinition
    })
  }, [onSaveContent, getStructuralFingerprint, lastStructuralFingerprint, isReadonly])

  // Show loading skeleton while content is being loaded
  if (isLoading || (!content && !siteDefinition.blocks.length)) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
            <div key={key} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded" />
                <div className="h-2 bg-muted rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-muted-foreground mt-8">
          <p className="text-sm">Загружается контент сайта...</p>
        </div>
      </div>
    )
  }

  if (siteDefinition.blocks.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-medium mb-2">Сайт пустой</h3>
        <p className="text-sm">
          Этот сайт пока не содержит блоков. Используйте AI для генерации контента сайта.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {siteDefinition.blocks.map((block, index) => {
          const blockDefinition = blockDefinitions[block.type]
          
          if (!blockDefinition) {
            return (
              <div 
                key={`${block.type}-${index}`} 
                className="p-4 border border-destructive rounded-lg"
              >
                <h4 className="font-medium text-destructive">
                  Неизвестный блок: {block.type}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Определение блока не найдено в системе
                </p>
              </div>
            )
          }

          return (
            <BlockCard
              key={`${block.type}-${index}`}
              block={block}
              blockDefinition={blockDefinition}
              onChange={(updatedBlock) => handleBlockChange(index, updatedBlock)}
              isReadonly={isReadonly}
            />
          )
        })}
      </div>
    </div>
  )
}

export const siteArtifact = new Artifact<'site', Metadata>({
  kind: 'site',
  description: 'Visual site editor with dynamic block management',
  initialize: async () => {},
  onStreamPart: () => {},
  content: ({ content, onSaveContent, isLoading }) => (
    <SiteEditor 
      content={content} 
      onSaveContent={(content, debounce = true) => onSaveContent(content, debounce)} 
      isLoading={isLoading}
    />
  ),
  actions: [
    {
      icon: <GlobeIcon size={16} />,
      label: 'Публикация',
      description: 'Управление публикацией сайта',
      onClick: (context) => {
        // Открываем диалог публикации сайта
        // Используем custom event для коммуникации
        window.dispatchEvent(new CustomEvent('open-site-publication-dialog', {
          detail: { content: context.content }
        }))
        return Promise.resolve()
      }
    }
  ],
  toolbar: [],
})

// END OF: artifacts/kinds/site/client.tsx
