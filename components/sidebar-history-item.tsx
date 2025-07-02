/**
 * @file components/sidebar-history-item.tsx
 * @description Элемент истории чата в сайдбаре с меню действий.
 * @version 2.1.0
 * @date 2025-07-02
 * @updated UI HIERARCHY: Добавлены size="sm" и text-sm классы для создания визуальной иерархии в sidebar
 */

/** HISTORY:
 * v2.1.0 (2025-07-02): UI HIERARCHY - Добавлены size="sm" и text-sm классы для chat items, чтобы соответствовать общей иерархии sidebar и выравниванию с artifact items
 * v2.0.0 (2025-06-09): Добавлено меню с переименованием, удаление теперь мягкое.
 * v1.1.0 (2025-06-06): Добавлена логика показа уведомления о загрузке при клике.
 */

import type { Chat } from '@/lib/db/types'
import { SidebarMenuButton, SidebarMenuItem, } from './ui/sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation.js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  ShareIcon,
  TrashIcon,
} from './icons'
import { memo } from 'react'
import { useChatVisibility } from '@/hooks/use-chat-visibility'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { toast } from './toast'

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  onRename,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, currentTitle: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const isPublished = chat.publishedUntil && chat.publishedUntil > new Date()
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: isPublished ? 'public' : 'private',
  })

  const router = useRouter()

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isActive) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    toast({ type: 'loading', description: `Загружаем чат "${chat.title}"...` })
    setOpenMobile(false)
    router.push(`/chat/${chat.id}`)
  }

  return (
    <SidebarMenuItem data-testid="sidebar-chat-item">
      <SidebarMenuButton asChild isActive={isActive} size="sm" className="text-sm">
        <Link href={`/chat/${chat.id}`} onClick={handleLinkClick}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="sidebar-chat-menu-button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-1 text-muted-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
              isActive ? 'opacity-100' : 'opacity-0 group-hover/menu-item:opacity-100'
            )}
          >
            <MoreHorizontalIcon className="size-4"/>
            <span className="sr-only">More</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            data-testid="sidebar-chat-rename-action"
            className="cursor-pointer"
            onSelect={() => onRename(chat.id, chat.title)}
          >
            <PencilEditIcon className="mr-2 size-4"/>
            <span>Переименовать</span>
          </DropdownMenuItem>
          <DropdownMenuSub data-testid="sidebar-chat-share-menu">
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon className="mr-2 size-4"/>
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private')
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12}/>
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon/>
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public')
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon/>
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon/> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            data-testid="sidebar-chat-delete-action"
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon className="mr-2 size-4"/>
            <span>В корзину</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false
  if (prevProps.chat.title !== nextProps.chat.title) return false
  return true
})

// END OF: components/sidebar-history-item.tsx
