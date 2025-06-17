/**
 * @file app/api/chat/route.ts
 * @description API маршрут для обработки запросов чата, переписанный под новую архитектуру.
 * @version 5.6.0
 * @date 2025-06-17
 * @updated Fixed artifact references persistence - save all new messages including role: 'data' to database.
 *
 * ## HISTORY:
 *
 * v5.6.0 (2025-06-17): Fixed artifact references persistence - save all new messages including role: 'data' to database.
 * v5.5.0 (2025-06-13): Removed siteGenerate tool.
 * v5.4.1 (2025-06-10): Улучшена обработка ошибок InvalidToolArgumentsError и добавлена проверка в onFinish.
 * v5.4.0 (2025-06-10): Исправлены ошибки типизации (TS18046, TS2322, TS2769, TS2345) через явный парсинг `postRequestBodySchema`.
 * v5.3.0 (2025-06-10): Updated tool imports to reflect new directory structure.
 * v5.2.0 (2025-06-10): Removed invalid 'onStart' and 'onChunk' callbacks from streamText to fix TS2353.
 * v5.1.0 (2025-06-10): Added comprehensive logging callbacks to streamText to diagnose the missing response issue.
 * v5.0.0 (2025-06-10): Removed manual message conversion (`transformToCoreMessages`) and now pass request messages directly to `streamText`. Added JSDoc explaining the change.
 * v4.1.3 (2025-06-10): Replaced 'toAIStreamResponse' with 'toDataStreamResponse' based on AI SDK changes (TS2551).
 */

import {
  appendResponseMessages,
  type CoreMessage,
  InvalidToolArgumentsError,
  type Message,
  streamText,
  TypeValidationError,
  type UIMessage
} from 'ai'
import { auth, type UserType } from '@/app/app/(auth)/auth'
import { getTestSession } from '@/lib/test-auth'
import { type ArtifactContext, type RequestHints, systemPrompt } from '@/lib/ai/prompts'
import { deleteChatSoftById, getChatById, getMessageCountByUserId, getMessagesByChatId, saveChat, saveMessages, } from '@/lib/db/queries'
import { generateUUID } from '@/lib/utils'
import { generateTitleFromUserMessage } from '@/app/app/(main)/chat/actions'
import { artifactCreate } from '@/artifacts/tools/artifactCreate'
import { artifactUpdate } from '@/artifacts/tools/artifactUpdate'
import { artifactEnhance } from '@/artifacts/tools/artifactEnhance'
import { getWeather } from '@/lib/ai/tools/get-weather'
import { artifactContent } from '@/artifacts/tools/artifactContent'
import { artifactDelete } from '@/artifacts/tools/artifactDelete'
import { artifactRestore } from '@/artifacts/tools/artifactRestore'
import { myProvider } from '@/lib/ai/providers'
import { entitlementsByUserType } from '@/lib/ai/entitlements'
import { type PostRequestBody, postRequestBodySchema } from './schema'
import { geolocation } from '@vercel/functions'
import { ChatSDKError } from '@/lib/errors'
import { createLogger } from '@fab33/fab-logger'
import type { z } from 'zod'

const parentLogger = createLogger('api:chat:route')

export const maxDuration = 60

function getContextFromHistory (messages: PostRequestBody['messages']): ArtifactContext | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.parts) {
      for (const part of message.parts) {
        // @ts-ignore
        if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
          // @ts-ignore
          const { toolName, result } = part.toolInvocation
          if (result?.artifactId && ['artifactCreate', 'artifactUpdate', 'artifactContent'].includes(toolName)) {
            return { id: result.artifactId, title: result.artifactTitle, kind: result.artifactKind }
          }
        }
      }
    }
  }
  return undefined
}

export async function POST (request: Request) {
  const logger = parentLogger.child({ requestId: generateUUID(), method: 'POST' })
  logger.trace('Entering POST /api/chat')
  try {
    const requestBody = postRequestBodySchema.parse(await request.json())
    const {
      id: chatId,
      messages,
      selectedChatModel,
      selectedVisibilityType,
      activeArtifactId,
      activeArtifactTitle,
      activeArtifactKind
    } = requestBody

    let session = await auth()
    if (!session?.user) {
      session = await getTestSession()
    }
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
    }

    const childLogger = logger.child({ chatId, userId: session.user.id })

    const latestMessage = messages.at(-1)
    if (!latestMessage) {
      throw new ChatSDKError('bad_request:api', 'No message found in request.')
    }

    const messageCount = await getMessageCountByUserId({ id: session.user.id, differenceInHours: 24 })
    if (messageCount > entitlementsByUserType[session.user.type as UserType].maxMessagesPerDay) {
      throw new ChatSDKError('rate_limit:chat')
    }

    const chat = await getChatById({ id: chatId })
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: latestMessage as UIMessage })
      await saveChat({ id: chatId, userId: session.user.id, title, visibility: selectedVisibilityType })
    } else if (chat.userId !== session.user.id) {
      throw new ChatSDKError('forbidden:chat')
    }

    const { longitude, latitude, city, country } = geolocation(request)
    const requestHints: RequestHints = { longitude, latitude, city, country }

    const artifactContext = activeArtifactId && activeArtifactTitle && activeArtifactKind
      ? { id: activeArtifactId, title: activeArtifactTitle, kind: activeArtifactKind }
      : getContextFromHistory(messages)

    // Save all new user messages, including those with role: 'data' (artifact references)
    // We need to determine which messages are new by checking what's already in the DB
    const existingMessages = await getMessagesByChatId({ id: chatId })
    const existingMessageIds = new Set(existingMessages.map(m => m.id))
    
    const newMessages = messages.filter(msg => !existingMessageIds.has(msg.id))
    
    if (newMessages.length > 0) {
      await saveMessages({
        messages: newMessages.map(msg => ({
          chatId,
          id: msg.id,
          role: msg.role,
          parts: msg.parts ?? [{ type: 'text', text: msg.content }],
          attachments: msg.experimental_attachments ?? [],
          createdAt: new Date(),
        }))
      })
      childLogger.info({ newMessagesCount: newMessages.length }, 'Saved new user messages to database')
    }

    childLogger.info('Starting text stream with AI model')

    const result = await streamText({
      model: myProvider.languageModel(selectedChatModel),
      system: systemPrompt({ selectedChatModel, requestHints, artifactContext }),
      messages: messages as CoreMessage[],
      maxSteps: 6,
      tools: {
        getWeather,
        artifactContent,
        artifactCreate: artifactCreate({ session }),
        artifactUpdate: artifactUpdate({ session }),
        artifactEnhance: artifactEnhance({ session }),
        artifactDelete: artifactDelete({ session }),
        artifactRestore: artifactRestore({ session }),
      },
      onFinish: async ({ response, finishReason, usage }) => {
        childLogger.info({ finishReason, usage }, 'Text stream finished, saving assistant response')
        const [, assistantMessage] = appendResponseMessages({
          messages: [latestMessage as Message],
          responseMessages: response.messages
        })

        if (!assistantMessage) {
          childLogger.warn('onFinish callback executed, but no valid assistant message was generated. This can happen after a tool call error. Skipping message save.')
          return
        }

        await saveMessages({
          messages: [{
            id: generateUUID(),
            chatId,
            role: assistantMessage.role,
            parts: assistantMessage.parts,
            attachments: assistantMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          }]
        })
      },
      onError: (error) => {
        childLogger.error({ err: error as unknown as Error }, 'An error occurred during the stream.')
      }
    })

    return result.toDataStreamResponse()

  } catch (error) {
    if (error instanceof InvalidToolArgumentsError) {
      const zodIssues = (error.cause instanceof TypeValidationError) ? (error.cause.cause as z.ZodError)?.issues : 'N/A'
      logger.error({
        err: error,
        toolName: error.toolName,
        toolArgs: error.toolArgs,
        zodIssues,
      }, `Invalid tool arguments for tool: ${error.toolName}`)

      return new ChatSDKError(
        'bad_request:api',
        `Произошла внутренняя ошибка при вызове инструмента. Пожалуйста, попробуйте переформулировать запрос.`
      ).toResponse()
    }

    logger.error({ err: error as Error }, 'Failed to process chat POST request')
    if (error instanceof ChatSDKError) return error.toResponse()
    return new ChatSDKError('bad_request:api', 'Failed to process request.').toResponse()
  }
}

export async function DELETE (request: Request) {
  const logger = parentLogger.child({ method: 'DELETE' })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return new ChatSDKError('bad_request:api').toResponse()

  let session = await auth()
  if (!session?.user) {
    session = await getTestSession()
  }
  if (!session?.user?.id) return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse()
  }

  const deletedChat = await deleteChatSoftById({ id, userId: session.user.id })
  logger.info('Chat soft-deleted successfully')
  return Response.json(deletedChat, { status: 200 })
}

// END OF: app/api/chat/route.ts
