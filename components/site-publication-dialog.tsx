/**
 * @file components/site-publication-dialog.tsx
 * @description Диалог публикации сайта с поддержкой TTL.
 * @version 1.0.0
 * @date 2025-06-17
 * @updated Создание диалога публикации специально для сайтов.
 */

/** HISTORY:
 * v1.0.0 (2025-06-17): Создание диалога публикации сайтов с TTL поддержкой и визуальными индикаторами.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CopyIcon, InfoIcon, ClockIcon, GlobeIcon } from '@/components/icons'
import { toast } from '@/components/toast'
import { publishSite, unpublishSite } from '@/app/app/(main)/artifacts/actions'
import { isSitePublished, getActivePublications } from '@/lib/publication-client-utils'
import type { Artifact } from '@/lib/db/types'

interface SitePublicationDialogProps {
  siteArtifact: Artifact;
  onSiteUpdate: (updatedArtifact: Artifact) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TTLOption = {
  label: string;
  value: string;
  hours?: number;
}

const TTL_OPTIONS: TTLOption[] = [
  { label: 'Без ограничений', value: 'never' },
  { label: '1 час', value: '1h', hours: 1 },
  { label: '24 часа', value: '24h', hours: 24 },
  { label: '1 неделя', value: '1w', hours: 168 },
  { label: '1 месяц', value: '1m', hours: 720 },
]

export function SitePublicationDialog({
  siteArtifact,
  onSiteUpdate,
  open,
  onOpenChange,
}: SitePublicationDialogProps) {
  const [shareUrl, setShareUrl] = useState('')
  const [selectedTTL, setSelectedTTL] = useState<string>('never')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  
  const isPublished = isSitePublished(siteArtifact)
  const activePublications = getActivePublications(siteArtifact)
  const sitePublication = activePublications.find(pub => pub.source === 'site')
  
  // Определяем оставшееся время публикации
  const remainingTime = sitePublication?.expiresAt 
    ? Math.max(0, Math.floor((new Date(sitePublication.expiresAt).getTime() - Date.now()) / (1000 * 60)))
    : null

  // Устанавливаем URL сайта при открытии диалога
  useState(() => {
    if (typeof window !== 'undefined' && open) {
      setShareUrl(`${window.location.origin}/s/${siteArtifact.id}`)
    }
  })

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // Вычисляем дату истечения на основе выбранного TTL
      let expiresAt: Date | null = null
      if (selectedTTL !== 'never') {
        const selectedOption = TTL_OPTIONS.find(opt => opt.value === selectedTTL)
        if (selectedOption?.hours) {
          expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + selectedOption.hours)
        }
      }

      const result = await publishSite({
        siteId: siteArtifact.id,
        expiresAt
      })

      if (result.success) {
        // Обновляем локальное состояние артефакта
        const newPublication = {
          source: 'site' as const,
          sourceId: siteArtifact.id,
          publishedAt: new Date().toISOString(),
          expiresAt: expiresAt ? expiresAt.toISOString() : null
        }

        const filteredPublications = (siteArtifact.publication_state || []).filter(
          pub => !(pub.source === 'site' && pub.sourceId === siteArtifact.id)
        )

        const updatedArtifact: Artifact = {
          ...siteArtifact,
          publication_state: [...filteredPublications, newPublication]
        }
        
        onSiteUpdate(updatedArtifact)

        // Копируем ссылку в буфер обмена
        await navigator.clipboard.writeText(shareUrl)
        
        toast({
          type: 'success',
          description: `Сайт опубликован${expiresAt ? ` до ${expiresAt.toLocaleString()}` : ' без ограничений'}. Ссылка скопирована.`,
        })

        onOpenChange(false)
      } else {
        toast({
          type: 'error',
          description: result.error || 'Не удалось опубликовать сайт.',
        })
      }
    } catch (error) {
      console.error('Failed to publish site:', error)
      toast({
        type: 'error',
        description: 'Не удалось опубликовать сайт. Попробуйте еще раз.',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true)
    try {
      const result = await unpublishSite({ siteId: siteArtifact.id })

      if (result.success) {
        // Обновляем локальное состояние артефакта
        const filteredPublications = (siteArtifact.publication_state || []).filter(
          pub => !(pub.source === 'site' && pub.sourceId === siteArtifact.id)
        )

        const updatedArtifact: Artifact = {
          ...siteArtifact,
          publication_state: filteredPublications
        }
        
        onSiteUpdate(updatedArtifact)

        toast({
          type: 'success',
          description: 'Публикация сайта отменена.',
        })

        onOpenChange(false)
      } else {
        toast({
          type: 'error',
          description: result.error || 'Не удалось отменить публикацию.',
        })
      }
    } catch (error) {
      console.error('Failed to unpublish site:', error)
      toast({
        type: 'error',
        description: 'Не удалось отменить публикацию. Попробуйте еще раз.',
      })
    } finally {
      setIsUnpublishing(false)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast({
      type: 'success',
      description: 'Ссылка на сайт скопирована в буфер обмена.',
    })
  }

  const formatRemainingTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин.`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours} ч.`
    } else {
      const days = Math.floor(minutes / 1440)
      return `${days} дн.`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GlobeIcon className="size-5" />
            Публикация сайта
          </DialogTitle>
          <DialogDescription>
            {isPublished 
              ? 'Сайт опубликован и доступен по публичной ссылке.'
              : 'Опубликуйте сайт, чтобы сделать его доступным для всех по прямой ссылке.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Статус публикации */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">Статус:</span>
          <div className="flex items-center gap-2">
            {isPublished ? (
              <>
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Опубликован
                </Badge>
                {remainingTime !== null && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {formatRemainingTime(remainingTime)}
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="secondary">
                Приватный
              </Badge>
            )}
          </div>
        </div>

        {/* URL для копирования */}
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="site-link" className="sr-only">
              Ссылка на сайт
            </Label>
            <Input 
              id="site-link" 
              value={shareUrl} 
              readOnly 
              className={isPublished ? '' : 'opacity-50'}
            />
          </div>
          <Button 
            type="button" 
            size="sm" 
            className="px-3" 
            onClick={handleCopyLink}
            disabled={!isPublished}
          >
            <span className="sr-only">Копировать</span>
            <CopyIcon />
          </Button>
        </div>

        {/* TTL Selector для новых публикаций */}
        {!isPublished && (
          <div className="grid gap-2">
            <Label htmlFor="ttl-select">Время действия публикации</Label>
            <Select value={selectedTTL} onValueChange={setSelectedTTL}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите время действия" />
              </SelectTrigger>
              <SelectContent>
                {TTL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Информационное уведомление */}
        <div className="flex items-start space-x-2 text-muted-foreground mt-2 p-3 bg-muted/50 rounded-md">
          <InfoIcon className="size-4 shrink-0 mt-0.5"/>
          <div className="text-xs space-y-1">
            <p>
              Опубликованный сайт будет доступен всем пользователям по прямой ссылке без необходимости регистрации.
            </p>
            {isPublished && (
              <p className="font-medium">
                Ссылка на сайт: {shareUrl}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-start pt-2">
          {isPublished ? (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleUnpublish}
              disabled={isUnpublishing}
            >
              {isUnpublishing ? 'Отмена...' : 'Отменить публикацию'}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Публикация...' : 'Опубликовать и скопировать ссылку'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// END OF: components/site-publication-dialog.tsx