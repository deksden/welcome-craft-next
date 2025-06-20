/**
 * @file artifacts/kinds/site/components/block-card.tsx
 * @description Визуальное представление одного блока сайта в редакторе.
 * @version 0.2.0
 * @date 2025-06-20
 * @updated Added UC-09 compatibility with slot normalization for backward compatibility.
 */

/** HISTORY:
 * v0.2.0 (2025-06-20): Added UC-09 compatibility - support for both UC-08 (BlockSlotData) and UC-09 (SiteSlotUC09) slot formats with automatic normalization.
 * v0.1.0 (2025-06-16): Initial implementation with slot management and block actions.
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArtifactSlot } from './artifact-slot'
import type { BlockDefinition } from '@/site-blocks/types'
import type { BlockSlotData } from '@/site-blocks/types'

// ✅ UC-09 slot format (from holistic generation)
interface SiteSlotUC09 {
  artifactId: string
}

// ✅ Updated to support both UC-08 and UC-09 formats
interface SiteBlock {
  type: string
  slots: Record<string, BlockSlotData | SiteSlotUC09>
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
  // ✅ Helper function to normalize UC-09 slots to UC-08 format
  const normalizeSlot = React.useCallback((slot: BlockSlotData | SiteSlotUC09): BlockSlotData => {
    // If it's already UC-08 format (has artifactId property but with more fields)
    if ('artifactId' in slot && Object.keys(slot).length > 1) {
      return slot as BlockSlotData
    }
    
    // If it's UC-09 format (only artifactId), convert to UC-08
    if ('artifactId' in slot && Object.keys(slot).length === 1) {
      return {
        artifactId: slot.artifactId,
        versionTimestamp: undefined // Default value for UC-08
      }
    }
    
    // If it's empty or malformed, return empty UC-08 format
    return {} as BlockSlotData
  }, [])

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
              currentValue={normalizeSlot(block.slots[slotName] || {})}
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