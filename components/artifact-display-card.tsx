/**
 * @file components/artifact-display-card.tsx
 * @description Компактная карточка артефакта для отображения в селекторах и редакторах.
 * @version 0.1.0
 * @date 2025-06-16
 * @updated Initial version for visual site editor.
 */

/** HISTORY:
 * v0.1.0 (2025-06-16): Initial implementation for site editor UI.
 */

'use client'

import * as React from 'react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { FileIcon, CodeIcon, ImageIcon, FileTextIcon } from '@/components/icons'
import type { ArtifactKind } from '@/lib/types'

export interface ArtifactDisplayData {
  id: string
  title: string
  summary?: string | null
  kind: ArtifactKind
}

interface ArtifactDisplayCardProps {
  artifact: ArtifactDisplayData
  onClick?: () => void
  className?: string
}

/**
 * @description Компактная карточка для отображения артефакта с иконкой и метаданными
 * @param artifact - данные артефакта для отображения
 * @param onClick - обработчик клика по карточке
 * @param className - дополнительные CSS классы
 */
/**
 * @description Получить иконку для типа артефакта
 * @param kind - тип артефакта
 * @returns React компонент иконки
 */
function getArtifactIcon(kind: ArtifactKind) {
  switch (kind) {
    case 'text':
      return FileTextIcon
    case 'code':
      return CodeIcon
    case 'image':
      return ImageIcon
    case 'sheet':
      return FileIcon
    case 'site':
      return FileIcon
    default:
      return FileIcon
  }
}

export function ArtifactDisplayCard({ 
  artifact, 
  onClick, 
  className = '' 
}: ArtifactDisplayCardProps) {
  const IconComponent = getArtifactIcon(artifact.kind)

  return (
    <Card 
      className={`flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="shrink-0">
        <IconComponent className="size-10 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <CardTitle className="text-sm font-semibold leading-tight">
          {artifact.title}
        </CardTitle>
        {artifact.summary && (
          <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {artifact.summary}
          </CardDescription>
        )}
      </div>
    </Card>
  )
}

// END OF: components/artifact-display-card.tsx