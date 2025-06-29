/**
 * @file components/artifact-card.tsx
 * @description Компонент карточки для одного артефакта.
 * @version 2.3.0
 * @date 2025-06-28
 * @updated BUG-046 RESOLVED: Полностью интегрирован SitePublicationDialog с корректной типизацией и API integration
 */

/** HISTORY:
 * v2.3.0 (2025-06-28): BUG-046 RESOLVED - Полностью интегрирован SitePublicationDialog с правильной типизацией (ArtifactApiResponse → Artifact адаптер) + исправлены TypeScript ошибки
 * v2.2.0 (2025-06-28): BUG-046 FIX - Интегрирован полноценный SitePublicationDialog вместо заглушки + исправлено название кнопки с "Опубликовать" на "Публикация"
 * v2.1.0 (2025-06-27): BUG-034 FIX - Добавлен data-testid="artifact-card" и кнопка публикации для site артефактов для поддержки UC-01 E2E тестов
 * v2.0.0 (2025-06-09): Рефакторинг в ArtifactCard, добавлены новые действия.
 * v1.3.0 (2025-06-07): Добавлено отображение поля `summary`.
 */
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BoxIcon,
  CodeIcon,
  FileIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
  UserIcon,
  FileIcon as MapPinIcon,
  FileIcon as HelpCircleIcon,
  LinkIcon,
  FileIcon as SettingsIcon,
  BoxIcon as PackageIcon
} from '@/components/icons'
import { deleteArtifact } from '@/app/app/(main)/artifacts/actions'
import { toast } from '@/components/toast'
import { useRouter } from 'next/navigation'
import { Skeleton } from './ui/skeleton'
import { SitePublicationDialog } from './site-publication-dialog'
import type { ArtifactApiResponse } from '@/lib/types'

export interface ArtifactDocument extends Pick<ArtifactApiResponse, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'> {}

interface ArtifactCardProps {
  artifact: ArtifactDocument;
  onRefresh: () => void;
  onCardClick: (doc: ArtifactDocument) => void;
}

const kindIcons = {
  text: FileIcon,
  code: CodeIcon,
  image: ImageIcon,
  sheet: BoxIcon,
  site: FileIcon,
  person: UserIcon,
  address: MapPinIcon,
  'faq-item': HelpCircleIcon,
  link: LinkIcon,
  'set-definition': SettingsIcon,
  set: PackageIcon,
}

export function ArtifactCard ({ artifact, onRefresh, onCardClick }: ArtifactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublicationDialogOpen, setIsPublicationDialogOpen] = useState(false)
  const [artifactForPublication, setArtifactForPublication] = useState<ArtifactApiResponse | null>(null)
  const router = useRouter()
  const Icon = kindIcons[artifact.kind] || FileIcon

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteArtifact(artifact.id)
    if (result.success) {
      toast({ type: 'success', description: `Артефакт "${artifact.title}" перемещен в корзину.` })
      onRefresh()
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось удалить артефакт.' })
    }
    setIsDeleting(false)
  }


  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({ type: 'success', description: 'Функция переименования будет добавлена в будущем.' })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="artifact-card"
      className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onCardClick(artifact)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(artifact) }}
    >
      <div className="p-4 grow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <Icon className="size-6 text-muted-foreground mb-2"/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}>
                <MoreHorizontalIcon className="size-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleRename}>
                <PencilEditIcon className="mr-2 size-4"/>
                Переименовать
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                disabled={isDeleting}
              >
                <TrashIcon className="mr-2 size-4"/>
                {isDeleting ? 'Удаление...' : 'В корзину'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold leading-tight mb-1 truncate">{artifact.title}</h3>

          {artifact.summary ? (
            <p className="text-xs text-muted-foreground line-clamp-2">{artifact.summary}</p>
          ) : (
            <div className="space-y-1">
              <Skeleton className="h-3 w-4/5"/>
              <Skeleton className="h-3 w-3/5"/>
            </div>
          )}

          {/* Publication button for site artifacts */}
          {artifact.kind === 'site' && (
            <Button
              data-testid="artifact-publication-button"
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  // Fetch full artifact data needed for publication dialog
                  const response = await fetch(`/api/artifact/${artifact.id}`)
                  if (response.ok) {
                    const fullArtifact = await response.json()
                    setArtifactForPublication(fullArtifact)
                    setIsPublicationDialogOpen(true)
                  } else {
                    toast({ type: 'error', description: 'Не удалось загрузить данные артефакта.' })
                  }
                } catch (error) {
                  console.error('Error fetching artifact for publication:', error)
                  toast({ type: 'error', description: 'Ошибка при загрузке артефакта.' })
                }
              }}
            >
              🌐 Публикация
            </Button>
          )}

          <p className="text-xs text-muted-foreground pt-1">
            {`Обновлено ${formatDistanceToNow(new Date(artifact.createdAt), { addSuffix: true, locale: ru })}`}
          </p>
        </div>
      </div>
      
      {/* Site Publication Dialog */}
      {artifact.kind === 'site' && artifactForPublication && (
        <SitePublicationDialog
          siteArtifact={{
            id: artifactForPublication.id,
            createdAt: artifactForPublication.createdAt,
            title: artifactForPublication.title,
            summary: artifactForPublication.summary,
            kind: artifactForPublication.kind,
            userId: artifactForPublication.userId,
            authorId: artifactForPublication.authorId,
            deletedAt: artifactForPublication.deletedAt,
            worldId: artifactForPublication.worldId,
            publicationState: artifactForPublication.publicationState,
          }}
          onSiteUpdate={(updatedArtifact) => {
            // Update local state with updated publication info
            setArtifactForPublication({
              ...artifactForPublication,
              publicationState: updatedArtifact.publicationState
            })
            onRefresh()
          }}
          open={isPublicationDialogOpen}
          onOpenChange={setIsPublicationDialogOpen}
        />
      )}
    </div>
  )
}

// END OF: components/artifact-card.tsx
