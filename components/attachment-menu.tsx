/**
 * @file components/attachment-menu.tsx
 * @description Меню для выбора типа прикрепления в чате.
 * @version 1.0.0
 * @date 2025-06-17
 * @updated Initial implementation with file and clipboard artifact options.
 */

'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PaperclipIcon, FileIcon, LinkIcon } from './icons'

interface AttachmentMenuProps {
  onFileAttach: () => void
  onClipboardAttach?: () => void
  hasClipboardContent: boolean
  disabled?: boolean
  'data-testid'?: string
}

export function AttachmentMenu({
  onFileAttach,
  onClipboardAttach,
  hasClipboardContent,
  disabled = false,
  'data-testid': testId = 'attachment-menu'
}: AttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFileAttach = () => {
    onFileAttach()
    setIsOpen(false)
  }

  const handleClipboardAttach = () => {
    if (onClipboardAttach) {
      onClipboardAttach()
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid={testId}
          variant="ghost"
          size="icon"
          disabled={disabled}
        >
          <PaperclipIcon size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuItem onClick={handleFileAttach}>
          <FileIcon className="mr-2 size-4" />
          Прикрепить файл
        </DropdownMenuItem>
        {hasClipboardContent && (
          <DropdownMenuItem onClick={handleClipboardAttach}>
            <LinkIcon className="mr-2 size-4" />
            Артефакт из буфера
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// END OF: components/attachment-menu.tsx