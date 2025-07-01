/**
 * @file components/sidebar-history.tsx
 * @description Компонент для отображения истории чатов в сайдбаре.
 * @version 1.1.2
 * @date 2025-06-10
 * @updated Corrected toast type from 'info' to 'loading' in handleRename (TS2322).
 */

/** HISTORY:
 * v1.1.2 (2025-06-10): Fixed TS2322 by changing invalid toast type 'info' to 'loading' for the rename placeholder.
 * v1.1.1 (2025-06-10): Fixed TS2741 by providing a placeholder onRename handler to ChatItem instances. Full rename functionality is pending.
 * v1.1.0 (2025-06-06): Заменен импорт `sonner` на локальную обертку `toast`.
 * v1.0.0 (2025-06-06): Начальная версия, адаптированная под новый упрощенный компонент сайдбара.
 */

'use client'

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns'
import { useParams, useRouter } from 'next/navigation.js'
import type { User } from 'next-auth'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SidebarGroup, SidebarMenu, useSidebar, } from '@/components/ui/sidebar'
import type { Chat } from '@/lib/db/types'
import { fetcher } from '@/lib/utils'
import { ChatItem } from './sidebar-history-item'
import useSWRInfinite from 'swr/infinite'
import { LoaderIcon } from './icons'
import { toast } from './toast'

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date()
  const oneWeekAgo = subWeeks(now, 1)
  const oneMonthAgo = subMonths(now, 1)

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt)

      if (isToday(chatDate)) {
        groups.today.push(chat)
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat)
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat)
      } else if (chatDate > oneMonthAgo) {
        groups.older.push(chat)
      } else {
        groups.older.push(chat)
      }

      return groups
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  )
}

export function getChatHistoryPaginationKey (
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`

  const firstChatFromPage = previousPageData.chats.at(-1)

  if (!firstChatFromPage) return null

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`
}

export function SidebarHistory ({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar()
  const { id } = useParams()

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  })

  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleRename = (chatId: string, currentTitle: string) => {
    console.log(`Rename chat requested: ${chatId}, current title: "${currentTitle}"`)
    toast({ type: 'loading', description: 'Rename feature is pending implementation.' })
  }

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    })

    toast({
      type: 'loading',
      description: 'Deleting chat...',
    })

    deletePromise.then(() => {
      mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => ({
            ...chatHistory,
            chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
          }))
        }
      })
      toast({ type: 'success', description: 'Chat deleted successfully' })
    }).catch(() => {
      toast({ type: 'error', description: 'Failed to delete chat' })
    })

    setShowDeleteDialog(false)

    if (deleteId === id) {
      router.push('/')
    }
  }

  if (!user) {
    return (
      <SidebarGroup>
        <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
          Login to save and revisit previous chats!
        </div>
      </SidebarGroup>
    )
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <div className="flex flex-col">
          {[44, 32, 28, 64, 52].map((item) => (
            <div
              key={item}
              className="rounded-md h-8 flex gap-2 px-2 items-center"
            >
              <div
                className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                style={
                  {
                    '--skeleton-width': `${item}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </SidebarGroup>
    )
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
          Your conversations will appear here once you start chatting!
        </div>
      </SidebarGroup>
    )
  }

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {paginatedChatHistories &&
            (() => {
              const chatsFromHistory = paginatedChatHistories.flatMap(
                (paginatedChatHistory) => paginatedChatHistory.chats,
              )

              const groupedChats = groupChatsByDate(chatsFromHistory)

              return (
                <div className="flex flex-col gap-6">
                  {groupedChats.today.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Today
                      </div>
                      {groupedChats.today.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId)
                            setShowDeleteDialog(true)
                          }}
                          onRename={handleRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.yesterday.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Yesterday
                      </div>
                      {groupedChats.yesterday.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId)
                            setShowDeleteDialog(true)
                          }}
                          onRename={handleRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastWeek.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Last 7 days
                      </div>
                      {groupedChats.lastWeek.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId)
                            setShowDeleteDialog(true)
                          }}
                          onRename={handleRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.lastMonth.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Last 30 days
                      </div>
                      {groupedChats.lastMonth.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId)
                            setShowDeleteDialog(true)
                          }}
                          onRename={handleRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}

                  {groupedChats.older.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        Older than last month
                      </div>
                      {groupedChats.older.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onDelete={(chatId) => {
                            setDeleteId(chatId)
                            setShowDeleteDialog(true)
                          }}
                          onRename={handleRename}
                          setOpenMobile={setOpenMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
        </SidebarMenu>

        <motion.div
          onViewportEnter={() => {
            if (!isValidating && !hasReachedEnd) {
              setSize((size) => size + 1)
            }
          }}
        />

        {hasReachedEnd ? (
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
            You have reached the end of your chat history.
          </div>
        ) : (
          <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
            <div className="animate-spin">
              <LoaderIcon/>
            </div>
            <div>Loading Chats...</div>
          </div>
        )}
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// END OF: components/sidebar-history.tsx
