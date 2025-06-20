/**
 * @file app/api/chat/[chatId]/details/route.ts
 * @description API endpoint для получения деталей чата с поддержкой публичного доступа.
 * @version 2.1.0
 * @date 2025-06-18
 * @updated Fixed Next.js 15 async params requirement - added await before params destructuring.
 */

/** HISTORY:
 * v2.1.0 (2025-06-18): Fixed Next.js 15 async params requirement - added await before params destructuring.
 * v2.0.0 (2025-06-17): Added publication system support for public access to published chats.
 * v1.0.0 (2025-06-17): Создание API endpoint для получения деталей чата с проверкой прав доступа.
 */

import type { NextRequest } from 'next/server'
import { auth } from '@/app/app/(auth)/auth'
import { getChatById } from '@/lib/db/queries'
import { isChatPublished } from '@/lib/publication-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth()
    const isAuthenticated = !!session?.user?.id

    const { chatId } = await params

    if (!chatId) {
      return Response.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    // Получаем чат из базы данных
    const chat = await getChatById({ id: chatId })

    if (!chat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Permission logic: owner + any status / non-owner + published only
    const isOwner = isAuthenticated && chat.userId === session.user.id
    const isPublished = isChatPublished(chat)
    
    if (!isOwner && !isPublished) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    return Response.json(chat)
  } catch (error) {
    console.error('Error fetching chat details:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// END OF: app/api/chat/[chatId]/details/route.ts