/**
 * @file hooks/use-chat-publication.ts
 * @description Хук для управления публикацией чата с поддержкой TTL.
 * @version 1.0.0
 * @date 2025-06-17
 * @updated Создание хука для работы с системой публикации чатов.
 */

/** HISTORY:
 * v1.0.0 (2025-06-17): Создание хука для управления статусом публикации чата с real-time обновлениями.
 */

'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import type { Chat } from '@/lib/db/types'

interface UseChatPublicationProps {
  chatId?: string;
  initialChat?: Chat | null;
}

interface UseChatPublicationReturn {
  chat: Chat | null;
  isLoading: boolean;
  error: any;
  updateChat: (updatedChat: Chat) => void;
}

// Fetcher function для SWR
const fetcher = async (url: string): Promise<Chat> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch chat')
  }
  return response.json()
}

export function useChatPublication({
  chatId,
  initialChat = null,
}: UseChatPublicationProps): UseChatPublicationReturn {
  const [localChat, setLocalChat] = useState<Chat | null>(initialChat)

  // SWR для получения данных чата
  const { data: swrChat, error, mutate } = useSWR(
    chatId ? `/api/chat/${chatId}/details` : null,
    fetcher,
    {
      fallbackData: initialChat || undefined,
      refreshInterval: 0, // Отключаем автоматическое обновление
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  // Используем локальные данные если они есть, иначе из SWR
  const chat = localChat || swrChat || null
  const isLoading = !chat && !error && !!chatId

  // Обновляем локальное состояние при изменении SWR данных
  useEffect(() => {
    if (swrChat && !localChat) {
      setLocalChat(swrChat)
    }
  }, [swrChat, localChat])

  // Функция для обновления чата локально и в SWR кеше
  const updateChat = (updatedChat: Chat) => {
    setLocalChat(updatedChat)
    
    // Обновляем кеш SWR без revalidation
    mutate(updatedChat, false)
  }

  return {
    chat,
    isLoading,
    error,
    updateChat,
  }
}

// END OF: hooks/use-chat-publication.ts