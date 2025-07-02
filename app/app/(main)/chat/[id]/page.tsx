// app/(main)/chat/[id]/page.tsx

/**
 * @file app/(main)/chat/[id]/page.tsx
 * @description Страница отображения конкретного чата.
 * @version 1.4.0
 * @date 2025-06-20
 * @updated Исправлен критический баг - заменен несуществующий '/api/auth/guest' на '/login'.
 */

/** HISTORY:
 * v1.4.0 (2025-06-20): Исправлен критический баг BUG-016 - заменен несуществующий '/api/auth/guest' на '/login'.
 * v1.3.0 (2025-06-17): Fixed artifact references display - extract content from parts[] for legacy compatibility.
 * v1.2.0 (2025-06-11): Добавлено логирование.
 * v1.1.0 (2025-06-09): Удален компонент DataStreamHandler.
 */
import { cookies } from 'next/headers.js'
import { notFound, redirect } from 'next/navigation.js'

import { getAuthSession } from '@/lib/test-auth'
import { Chat } from '@/components/chat'
import { getChatById, getMessagesByChatId } from '@/lib/db/queries'
import { getCurrentWorldContextSync } from '@/lib/db/world-context'
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models'
import type { DBMessage } from '@/lib/db/schema'
import type { Attachment, UIMessage } from 'ai'
import { createLogger } from '@fab33/fab-logger'

const logger = createLogger('page:chat:[id]')

function convertToUIMessages (messages: Array<DBMessage>, chatId: string): Array<UIMessage> {
  return messages.map((message) => {
    let parts: UIMessage['parts'] = []
    if (Array.isArray(message.parts)) {
      parts = message.parts as UIMessage['parts']
    } else {
      logger.warn(
        { chatId, messageId: message.id, partsData: message.parts },
        'Поле \'parts\' в сообщении не является массивом. Используется пустой массив. Это может указывать на проблему с целостностью данных для старых сообщений.'
      )
      parts = []
    }

    let attachments: Array<Attachment> = []
    if (Array.isArray(message.attachments)) {
      attachments = message.attachments as Array<Attachment>
    } else {
      logger.warn(
        { chatId, messageId: message.id, attachmentsData: message.attachments },
        'Поле \'attachments\' в сообщении не является массивом. Используется пустой массив.'
      )
      attachments = []
    }

    // Extract text content from parts for legacy compatibility
    let content = ''
    if (parts.length > 0) {
      const textPart = parts.find(part => part.type === 'text')
      if (textPart) {
        content = textPart.text
      }
    }

    return {
      id: message.id,
      parts: parts,
      role: message.role as UIMessage['role'],
      content: content, // Extract from parts for compatibility
      createdAt: message.createdAt,
      experimental_attachments: attachments,
    }
  })
}

export default async function Page (props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { id } = params
  const session = await getAuthSession()

  if (!session) {
    redirect('/login')
  }

  const chat = await getChatById({ id })

  // Если чат не найден, но сессия есть - разрешаем создание нового чата
  if (!chat) {
    // Для нового чата - пустые сообщения и только создатель может его редактировать
    const cookieStore = await cookies()
    const chatModelFromCookie = cookieStore.get('chat-model')

    return (
      <Chat
        id={id}
        initialMessages={[]}
        initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        isReadonly={false}
        session={session}
        autoResume={false}
      />
    )
  }

  // Если чат существует - проверяем права доступа
  const isPublished = chat.published_until && chat.published_until > new Date()
  if (!isPublished) {
    if (!session.user) {
      return notFound()
    }

    if (session.user.id !== chat.userId) {
      return notFound()
    }
  }

  const worldContext = getCurrentWorldContextSync()
  const messagesFromDb = await getMessagesByChatId({
    id,
    worldContext
  })

  // Передаем ID чата в функцию для более детального логирования
  const initialMessages = convertToUIMessages(messagesFromDb, id)

  const cookieStore = await cookies()
  const chatModelFromCookie = cookieStore.get('chat-model')

  return (
    <Chat
      id={chat.id}
      initialMessages={initialMessages}
      initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
      isReadonly={session?.user?.id !== chat.userId}
      session={session}
      autoResume={true}
    />
  )
}

// END OF: app/(main)/chat/[id]/page.tsx
