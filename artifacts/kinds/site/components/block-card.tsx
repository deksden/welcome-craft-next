/**
 * @file artifacts/kinds/site/components/block-card.tsx
 * @description Визуальное представление одного блока сайта в редакторе.
 * @version 0.1.0
 * @date 2025-06-16
 * @updated Initial version for visual site editor.
 */

/** HISTORY:
 * v0.1.0 (2025-06-16): Initial implementation with slot management and block actions.
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArtifactSlot } from './artifact-slot'
import type { BlockDefinition } from '@/site-blocks/types'
import type { BlockSlotData } from '@/site-blocks/types'

interface SiteBlock {
  type: string
  slots: Record<string, BlockSlotData>
}

interface BlockCardProps {
  block: SiteBlock
  blockDefinition: BlockDefinition
  onChange: (updatedBlock: SiteBlock) => void
  isReadonly?: boolean
}

/**
 * @description Карточка блока сайта с управлением всеми его слотами
 * @param block - данные блока из siteDefinition
 * @param blockDefinition - определение блока с метаданными
 * @param onChange - обработчик изменения блока
 * @param isReadonly - если true, отключает редактирование
 */
export function BlockCard({ 
  block, 
  blockDefinition, 
  onChange,
  isReadonly = false
}: BlockCardProps) {
  const handleSlotChange = React.useCallback((
    slotName: string,
    newSlotData: BlockSlotData
  ) => {
    if (isReadonly) return; // Не позволяем изменения в readonly режиме
    
    const updatedBlock: SiteBlock = {
      ...block,
      slots: {
        ...block.slots,
        [slotName]: newSlotData,
      },
    }
    onChange(updatedBlock)
  }, [block, onChange, isReadonly])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {blockDefinition.caption}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(blockDefinition.slots).map(([slotName, slotDefinition]) => (
          <div key={slotName} className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {slotDefinition.caption}
            </div>
            <ArtifactSlot
              slotDefinition={slotDefinition}
              currentValue={block.slots[slotName] || {}}
              onChange={(newSlotData) => handleSlotChange(slotName, newSlotData)}
              isReadonly={isReadonly}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// END OF: artifacts/kinds/site/components/block-card.tsx