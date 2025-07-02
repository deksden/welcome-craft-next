/**
 * @file components/message.tsx
 * @description Компонент для отображения одного сообщения в чате.
 * @version 2.8.0
 * @date 2025-07-02
 * @updated CRITICAL BUGFIX: Fixed world context passing to Server Actions for regeneration to prevent "Invalid message context" errors in test worlds.
 */

/** HISTORY:
 * v2.8.0 (2025-07-02): CRITICAL BUGFIX: Fixed world context passing to Server Actions for regeneration - added client-side cookie reading to pass worldContext to regenerateFromUserMessage and regenerateAssistantResponse functions.
 * v2.7.0 (2025-07-02): CRITICAL BUGFIX: Fixed model selection to use actual selectedChatModel instead of hardcoded 'main-model' for regeneration API calls.
 * v2.6.0 (2025-07-02): REVOLUTIONARY FIX: Implemented direct AI call with message replacement - preserves all subsequent messages while regenerating specific response.
 * v2.5.0 (2025-07-02): CRITICAL FIX: Fixed reload() targeting by trimming messages array to correct context before regeneration.
 * v2.4.0 (2025-07-02): BUGFIX: Fixed message targeting in regeneration - now preserves subsequent messages and regenerates only specific assistant response.
 * v2.3.0 (2025-07-02): FEATURE: Added regeneration functionality for both user and assistant messages with RedoIcon.
 * v2.2.0 (2025-06-17): Removed legacy role: 'data' handling - now uses proper tool-invocation architecture.
 * v2.1.0 (2025-06-17): Fixed artifact references display - improved parts[] parsing for Message_v2 schema compatibility.
 * v2.0.0 (2025-06-10): Updated to handle new artifact tool names using AI_TOOL_NAMES and render ArtifactPreview component.
 * v1.9.4 (2025-06-10): Fixed TS2304 by adding DocumentToolResult to the import statement from './document'.
 * v1.9.3 (2025-06-10): Fixed TS2307 by removing import for missing DocumentPreview and updated logic to use DocumentToolCall and DocumentToolResult components for relevant tool invocations.
 * v1.9.2 (2025-06-07): Использован `as any` для обхода слишком строгой проверки типов в `hasToolResultForImage`.
 * v1.9.1 (2025-06-07): Добавлен условный рендеринг `PreviewAttachment` для оптимистичного UI.
 * v1.9.0 (2025-06-07): Удален рендеринг `experimental_attachments`.
 */

'use client'

import type { UIMessage } from 'ai'
import cx from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { ArtifactToolCall } from './artifact-tool-results'
import { CopyIcon, PencilEditIcon, RedoIcon, SparklesIcon, TrashIcon } from './icons'
import { Markdown } from './markdown'
import { PreviewAttachment } from './preview-attachment'
import { Weather } from './weather'
import equal from 'fast-deep-equal'
import { cn, sanitizeText } from '@/lib/utils'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { MessageEditor } from './message-editor'
import { MessageReasoning } from './message-reasoning'
import type { UseChatHelpers } from '@ai-sdk/react'
import { useCopyToClipboard } from 'usehooks-ts'
import { toast } from './toast'
import { deleteMessage, regenerateAssistantResponse, regenerateFromUserMessage } from '@/app/app/(main)/chat/actions'
import { AI_TOOL_NAMES } from '@/lib/ai/tools/constants'
import { ArtifactPreview } from './artifact-preview'
import { WORLD_COOKIE_KEY } from '@/lib/db/world-context'

const PurePreviewMessage = ({
  chatId,
  message,
  messages,
  isLoading,
  setMessages,
  reload,
  append,
  isReadonly,
  selectedChatModel,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  messages: Array<UIMessage>;
  vote: undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  append: UseChatHelpers['append'];
  isReadonly: boolean;
  selectedChatModel: string;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [, copyToClipboard] = useCopyToClipboard()
  
  // Get world context from client-side cookies for Server Actions
  const getWorldContextFromCookies = () => {
    if (typeof document === 'undefined') return null
    
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${WORLD_COOKIE_KEY}=`))
    
    if (!cookie) return null
    
    try {
      const sessionData = JSON.parse(decodeURIComponent(cookie.split('=')[1]))
      if (sessionData?.worldId) {
        return {
          worldId: sessionData.worldId,
          isTestMode: true,
          isolationPrefix: `test-${sessionData.worldId}`
        }
      }
    } catch (error) {
      console.error('Failed to parse world context from cookies:', error)
    }
    
    return null
  }

  const handleCopy = () => {
    const textContent = message.parts
      .filter(part => part.type === 'text')
      // @ts-ignore
      .map(part => part.text)
      .join('\n')

    if (!textContent) {
      toast({ type: 'error', description: 'Нечего копировать.' })
      return
    }

    copyToClipboard(textContent)
    toast({ type: 'success', description: 'Сообщение скопировано.' })
  }

  const handleDelete = async () => {
    const result = await deleteMessage({ messageId: message.id })
    if (result.success) {
      setMessages((messages) => messages.filter((m) => m.id !== message.id))
      toast({ type: 'success', description: 'Сообщение удалено.' })
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось удалить сообщение.' })
    }
  }

  const handleRegenerateAssistant = async () => {
    toast({ type: 'loading', description: 'Перегенерация ответа...' })
    try {
      const worldContext = getWorldContextFromCookies()
      setMessages((messages) => messages.filter((m) => m.id !== message.id))
      await regenerateAssistantResponse({ assistantMessageId: message.id, worldContext })
      reload()
    } catch (error) {
      toast({ type: 'error', description: 'Не удалось перегенерировать ответ.' })
    }
  }

  const handleRegenerateFromUser = async () => {
    toast({ type: 'loading', description: 'Перегенерация с этого сообщения...' })
    try {
      // Найти индекс текущего user сообщения
      const messageIndex = messages.findIndex(m => m.id === message.id)
      if (messageIndex === -1) {
        throw new Error('Message not found in messages array')
      }
      
      // Найти следующее сообщение модели (если есть)
      const nextMessageIndex = messageIndex + 1
      const nextMessage = messages[nextMessageIndex]
      
      console.log('🔧 REGENERATE FRONTEND DEBUG:', {
        currentMessageId: message.id,
        currentMessageRole: message.role,
        currentMessageContent: message.content?.slice(0, 100) + '...',
        messageIndex,
        nextMessageIndex,
        nextMessageId: nextMessage?.id,
        nextMessageRole: nextMessage?.role,
        nextMessageContent: nextMessage?.content?.slice(0, 100) + '...',
        totalMessages: messages.length
      })
      
      if (nextMessage && nextMessage.role === 'assistant') {
        // Получить информацию о сообщениях
        const worldContext = getWorldContextFromCookies()
        const result = await regenerateFromUserMessage({ userMessageId: message.id, worldContext })
        
        // Создать копию массива сообщений и обрезать до нужного user message
        const contextMessages = messages.slice(0, messageIndex + 1)
        
        // Преобразовать в CoreMessage формат для AI
        const coreMessages = contextMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
        
        // Получить новый ответ от модели напрямую
        const response = await fetch('/api/chat/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: coreMessages,
            chatId: chatId,
            replaceMessageId: nextMessage.id, // Передаем ID сообщения для замены
            selectedChatModel: selectedChatModel // Используем ту же модель что и в основном чате
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to regenerate response')
        }
        
        const newAssistantMessage = await response.json()
        
        // Заменить сообщение модели в оригинальном массиве, сохранив тот же ID
        const updatedMessages = [...messages]
        updatedMessages[nextMessageIndex] = {
          ...newAssistantMessage,
          id: nextMessage.id, // Сохраняем оригинальный ID
          createdAt: nextMessage.createdAt, // Сохраняем оригинальное время
        }
        
        // Обновить UI с новым массивом
        setMessages(updatedMessages)
        
        toast({ type: 'success', description: 'Сообщение перегенерировано.' })
      } else {
        // Если нет ответа модели, просто запустить генерацию
        reload()
      }
    } catch (error) {
      console.error('Regeneration error:', error)
      toast({ type: 'error', description: 'Не удалось перегенерировать с этого сообщения.' })
    }
  }

  const hasToolResultForImage = message.parts?.some(
    part => (part as any).type === 'tool-result' && (part as any).result?.kind === 'image'
  )

  // Legacy 'data' role handling removed - now using proper tool-invocation architecture

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div
              className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14}/>
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments && !hasToolResultForImage && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part
              const key = `message-${message.id}-part-${index}`

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                )
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="grow">
                        <div
                          data-testid="message-content"
                          className={cn('flex flex-col gap-4', {
                            'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                              message.role === 'user',
                          })}
                        >
                          <Markdown>{sanitizeText(part.text)}</Markdown>
                        </div>
                      </div>
                      {!isReadonly && (
                        <div
                          className="shrink-0 flex items-center opacity-0 group-hover/message:opacity-100 transition-opacity">
                          {message.role === 'user' ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7"
                                                                onClick={handleCopy}><CopyIcon
                                  size={14}/></Button></TooltipTrigger>
                                <TooltipContent>Скопировать</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7"
                                                                onClick={() => setMode('edit')}><PencilEditIcon
                                  size={14}/></Button></TooltipTrigger>
                                <TooltipContent>Редактировать</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7"
                                                                onClick={handleRegenerateFromUser}><RedoIcon
                                  size={14}/></Button></TooltipTrigger>
                                <TooltipContent>Перегенерировать</TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7"
                                                                onClick={handleCopy}><CopyIcon
                                  size={14}/></Button></TooltipTrigger>
                                <TooltipContent>Скопировать</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7"
                                                                onClick={handleRegenerateAssistant}><RedoIcon
                                  size={14}/></Button></TooltipTrigger>
                                <TooltipContent>Перегенерировать</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon"
                                                            className="size-7 text-destructive"
                                                            onClick={handleDelete}><TrashIcon
                              size={14}/></Button></TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  )
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  )
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part
                const { toolName, toolCallId, state } = toolInvocation

                if (state === 'call') {
                  const { args } = toolInvocation

                  switch (toolName) {
                    case AI_TOOL_NAMES.GET_WEATHER:
                      return <div key={toolCallId} className="skeleton"><Weather/></div>
                    case AI_TOOL_NAMES.ARTIFACT_CREATE:
                      return <ArtifactToolCall key={toolCallId} type="create" args={args} isReadonly={isReadonly}/>
                    case AI_TOOL_NAMES.ARTIFACT_UPDATE:
                      return <ArtifactToolCall key={toolCallId} type="update" args={args} isReadonly={isReadonly}/>
                    default:
                      return null
                  }
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  switch (toolName) {
                    case AI_TOOL_NAMES.GET_WEATHER:
                      return <Weather key={toolCallId} weatherAtLocation={result}/>;
                    case AI_TOOL_NAMES.ARTIFACT_CREATE:
                    case AI_TOOL_NAMES.ARTIFACT_UPDATE:
                    case AI_TOOL_NAMES.ARTIFACT_ENHANCE:
                    case AI_TOOL_NAMES.ARTIFACT_DELETE:
                    case AI_TOOL_NAMES.ARTIFACT_RESTORE:
                    case AI_TOOL_NAMES.ARTIFACT_CONTENT:
                      return <ArtifactPreview key={toolCallId} result={result} isReadonly={isReadonly}/>;
                    default:
                      return null;
                  }
                }
              }

              return null
            })}

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false
    if (prevProps.message.id !== nextProps.message.id) return false
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false
    return true
  },
)

export const ThinkingMessage = () => {
  const role = 'assistant'

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14}/>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// END OF: components/message.tsx
