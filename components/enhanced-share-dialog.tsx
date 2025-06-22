/**
 * @file components/enhanced-share-dialog.tsx
 * @description Улучшенный диалог публикации с поддержкой TTL для чатов.
 * @version 1.0.0
 * @date 2025-06-17
 * @updated Создание нового диалога публикации с поддержкой Time-To-Live.
 */

/** HISTORY:
 * v1.0.0 (2025-06-17): Создание улучшенного диалога с TTL, статусами публикации и каскадным обновлением артефактов.
 */

'use client'

import { useState, useEffect } from 'react'
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
import { CopyIcon, InfoIcon, ClockIcon, UsersIcon } from '@/components/icons'
import { toast } from '@/components/toast'
import { publishChat, unpublishChat } from '@/app/app/(main)/chat/actions'
import { isChatPublished } from '@/lib/publication-client-utils'
import type { Chat } from '@/lib/db/types'

interface EnhancedShareDialogProps {
  chat: Chat;
  onChatUpdate: (updatedChat: Chat) => void;
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

export function EnhancedShareDialog({
  chat,
  onChatUpdate,
  open,
  onOpenChange,
}: EnhancedShareDialogProps) {
  const [shareUrl, setShareUrl] = useState('')
  const [selectedTTL, setSelectedTTL] = useState<string>('never')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  
  const isPublished = isChatPublished(chat)
  
  // Определяем оставшееся время публикации
  const remainingTime = chat.publishedUntil 
    ? Math.max(0, Math.floor((new Date(chat.publishedUntil).getTime() - Date.now()) / (1000 * 60)))
    : null

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/chat/${chat.id}`)
    }
  }, [chat.id])

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

      const result = await publishChat({
        chatId: chat.id,
        expiresAt
      })

      // Обновляем локальное состояние чата
      const updatedChat: Chat = {
        ...chat,
        publishedUntil: expiresAt
      }
      
      onChatUpdate(updatedChat)

      // Копируем ссылку в буфер обмена
      await navigator.clipboard.writeText(shareUrl)
      
      toast({
        type: 'success',
        description: `Чат опубликован${expiresAt ? ` до ${expiresAt.toLocaleString()}` : ' без ограничений'}. ${result.publishedArtifacts} артефактов также опубликованы. Ссылка скопирована.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to publish chat:', error)
      toast({
        type: 'error',
        description: 'Не удалось опубликовать чат. Попробуйте еще раз.',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsUnpublishing(true)
    try {
      const result = await unpublishChat({ chatId: chat.id })

      // Обновляем локальное состояние чата
      const updatedChat: Chat = {
        ...chat,
        publishedUntil: null
      }
      
      onChatUpdate(updatedChat)

      toast({
        type: 'success',
        description: `Публикация отменена. ${result.unpublishedArtifacts} артефактов отозваны.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to unpublish chat:', error)
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
      description: 'Ссылка скопирована в буфер обмена.',
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
            <UsersIcon className="size-5" />
            Публикация чата
          </DialogTitle>
          <DialogDescription>
            {isPublished 
              ? 'Чат опубликован и доступен по ссылке. Все артефакты в сообщениях также доступны публично.'
              : 'Опубликуйте чат, чтобы поделиться им с другими. Все артефакты в сообщениях будут также опубликованы.'
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
            <Label htmlFor="link" className="sr-only">
              Ссылка
            </Label>
            <Input 
              id="link" 
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
              При публикации чата все артефакты в сообщениях становятся доступными публично.
            </p>
            {isPublished && (
              <p className="font-medium">
                Кнопка «Share» в шапке подсвечивается для опубликованных чатов.
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

// END OF: components/enhanced-share-dialog.tsx