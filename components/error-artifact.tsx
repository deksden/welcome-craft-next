/**
 * @file components/error-artifact.tsx
 * @description Красивый компонент для отображения ошибок в чате как артефакты с кнопкой копирования.
 * @version 1.0.0
 * @date 2025-07-02
 * @updated Создан компонент для улучшения UX отображения ошибок в чате.
 */

'use client'
import { WarningIcon, CopyIcon } from './icons'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { useCopyToClipboard } from 'usehooks-ts'
import { toast } from './toast'
import { cn } from '@/lib/utils'

interface ErrorArtifactProps {
  title?: string
  error: string
  className?: string
}

/**
 * @description Красивый компонент для отображения ошибок как артефакты
 * @param title - Заголовок ошибки (по умолчанию "Ошибка создания артефакта")
 * @param error - Текст ошибки
 * @param className - Дополнительные CSS классы
 * @feature Кнопка копирования, современный дизайн, читаемость в темной теме
 */
export function ErrorArtifact({ title = "Ошибка создания артефакта", error, className }: ErrorArtifactProps) {
  const [, copyToClipboard] = useCopyToClipboard()

  const handleCopy = () => {
    const fullText = `${title}\n\n${error}`
    copyToClipboard(fullText)
    toast({ type: 'success', description: 'Ошибка скопирована в буфер обмена' })
  }

  return (
    <div className={cn(
      "relative w-full border rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-red-50 to-orange-50",
      "dark:from-red-950/20 dark:to-orange-950/20",
      "border-red-200 dark:border-red-800/50",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-red-200 dark:border-red-800/50 bg-red-100/50 dark:bg-red-900/20">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-3">
            <div className="text-red-600 dark:text-red-400">
              <WarningIcon className="size-5" />
            </div>
            <h4 className="font-semibold text-red-800 dark:text-red-200">{title}</h4>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 text-red-600 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-800/30"
                onClick={handleCopy}
              >
                <CopyIcon size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Скопировать ошибку</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Error Content */}
      <div className="p-4">
        <div className="bg-white/70 dark:bg-gray-900/30 rounded-lg p-3 border border-red-200/50 dark:border-red-800/30">
          <p className="text-sm text-red-700 dark:text-red-300 font-mono leading-relaxed whitespace-pre-wrap">
            {error}
          </p>
        </div>
        
        {/* Helpful hint */}
        <div className="mt-3 text-xs text-red-600/80 dark:text-red-400/80">
          💡 Попробуйте переформулировать запрос или обратитесь за помощью
        </div>
      </div>
    </div>
  )
}

// END OF: components/error-artifact.tsx