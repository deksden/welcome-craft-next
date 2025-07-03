/**
 * @file components/chat-input.tsx
 * @description Компонент для ввода сообщений, включая текст и файлы с авто-созданием артефактов.
 * @version 2.9.0
 * @date 2025-07-02
 * @updated TASK-AI-TOOLS-IMPLEMENTATION: Добавлена поддержка drag & drop файлов с визуальными индикаторами
 */

/** HISTORY:
 * v2.8.0 (2025-07-02): PREFILL SUPPORT - Добавлен useEffect для обработки custom event 'prefill-chat-input', позволяющий CreateArtifactDialog предзаполнять поле ввода чата текстом "Я хочу создать артефакт "
 * v2.7.1 (2025-07-02): BUGFIX: Fixed Send→Stop button transformation - changed from 'streaming' to correct 'submitted' status check for useChat hook.
 * v2.7.0 (2025-07-02): FEATURE: Added Send→Stop button transformation during AI processing. Send button becomes Stop button with square icon when status is 'awaiting_response'. Properly handles button state after stopping to allow new messages.
 * v2.6.0 (2025-06-17): CRITICAL FIX: Replace addMessageWithCustomId with append() to send clipboard artifacts to AI instead of only adding to UI.
 * v2.5.0 (2025-06-17): FINAL FIX: Properly implemented custom UUID preservation using setMessages with type casting for artifact clipboard and file upload flows.
 * v2.4.0 (2025-06-17): Fixed UUID format issues by using setMessages instead of append to preserve valid UUID format.
 * v2.3.0 (2025-06-17): Fixed artifact display architecture - replaced role: 'data' with proper tool-invocation simulation.
 * v2.2.0 (2025-06-17): Fixed artifact references display - added parts[] support for new Message_v2 schema.
 * v2.1.0 (2025-06-17): Added isSubmitting state to prevent race conditions when adding site artifacts to new chat.
 * v2.0.4 (2025-06-10): Fixed TS2322 by stringifying the content for 'data' role messages, as append expects content to be a string.
 * v2.0.3 (2025-06-10): Changed message role to 'data' and content structure for appending artifact info to resolve TS2322 with useChat.append.
 * v2.0.2 (2025-06-10): Fixed TS2322 by restructuring appended 'tool' message to use 'content' field for ToolResultPart array, not 'parts'.
 * v2.0.1 (2025-06-10): Fixed TS2322 by changing message role to 'tool' when appending artifact creation tool results.
 * v2.0.0 (2025-06-09): Переименован, добавлено авто-создание артефактов.
 * v1.7.0 (2025-06-07): Исправлена логика загрузки файлов на client-side.
 */

'use client'

import type { Attachment, UIMessage } from 'ai'
import type React from 'react'
import { type ChangeEvent, type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState, } from 'react'
import Textarea from 'react-textarea-autosize'
import { upload } from '@vercel/blob/client'
import { useDropzone } from 'react-dropzone'

import { ArrowUpIcon, CrossIcon, StopIcon } from './icons'
import { PreviewAttachment } from './preview-attachment'
import { Button } from './ui/button'
import { SuggestedActions } from './suggested-actions'
import type { UseChatHelpers } from '@ai-sdk/react'
import { ModelSelector } from './model-selector'
import type { Session } from 'next-auth'
import type { UIArtifact } from './artifact'
import { toast } from './toast'
import { generateUUID } from '@/lib/utils'
import { clearArtifactFromClipboard } from '@/app/app/(main)/artifacts/actions'
import { AttachmentMenu } from './attachment-menu'

async function createArtifactFromUpload (url: string, name: string, type: string) {
  const response = await fetch('/api/artifacts/create-from-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      title: name,
      kind: type.startsWith('image/') ? 'image' : 'text'
    })
  })
  if (!response.ok) {
    throw new Error('Failed to create artifact from upload')
  }
  return response.json()
}

export function ChatInput ({
  chatId,
  input,
  setInput,
  status,
  attachments,
  setAttachments,
  clipboardArtifact,
  setClipboardArtifact,
  messages,
  append,
  setMessages,
  handleSubmit,
  stop,
  session,
  initialChatModel,
  artifact,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  clipboardArtifact: { artifactId: string; title: string; kind: string } | null;
  setClipboardArtifact: Dispatch<SetStateAction<{ artifactId: string; title: string; kind: string } | null>>;
  messages: Array<UIMessage>;
  append: UseChatHelpers['append'];
  setMessages: UseChatHelpers['setMessages'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  stop: UseChatHelpers['stop'];
  session: Session;
  initialChatModel: string;
  artifact: UIArtifact;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Array<string>>([])

  const handleCancelClipboardArtifact = useCallback(async () => {
    try {
      await clearArtifactFromClipboard()
      setClipboardArtifact(null)
      toast({ type: 'success', description: 'Артефакт удален из буфера' })
    } catch (error) {
      toast({ type: 'error', description: 'Не удалось очистить буфер' })
    }
  }, [setClipboardArtifact])

  const handleClipboardAttach = useCallback(() => {
    // Force show the clipboard artifact if it exists but isn't shown
    if (clipboardArtifact) {
      toast({ type: 'success', description: 'Артефакт готов к отправке' })
    }
  }, [clipboardArtifact])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset isSubmitting flag when status changes (e.g., from streaming back to ready)
  useEffect(() => {
    if (status === 'ready' && isSubmitting) {
      setIsSubmitting(false)
    }
  }, [status, isSubmitting])

  // Handle prefill chat input from CreateArtifactDialog
  useEffect(() => {
    const handlePrefillChatInput = (event: CustomEvent) => {
      const { text } = event.detail
      console.log('💬 ChatInput: Received prefill-chat-input event:', text)
      setInput(text)
    }

    window.addEventListener('prefill-chat-input', handlePrefillChatInput as EventListener)
    
    return () => {
      window.removeEventListener('prefill-chat-input', handlePrefillChatInput as EventListener)
    }
  }, [setInput])

  // Helper function to add message with custom UUID
  const addMessageWithCustomId = useCallback((newMessage: UIMessage) => {
    setMessages((prev) => [...prev, newMessage as any])
  }, [setMessages])

  const submitForm = useCallback(() => {
    if (status !== 'ready') {
      toast({ type: 'error', description: 'Please wait for the model to finish its response!' })
      return
    }

    // Prevent double submissions / race conditions
    if (isSubmitting) {
      return
    }
    setIsSubmitting(true)

    const options: Parameters<typeof handleSubmit>[1] = {
      body: {
        activeArtifactId: artifact.isVisible ? artifact.artifactId : undefined,
        activeArtifactTitle: artifact.isVisible ? artifact.title : undefined,
        activeArtifactKind: artifact.isVisible ? artifact.kind : undefined,
      }
    }

    if (clipboardArtifact) {
      // Simulate user message with tool-invocation result (proper architecture)
      const toolCallId = `call_${Math.random().toString(36).substring(2, 8)}`
      const newMessageId = generateUUID()
      const toolResult = {
        artifactId: clipboardArtifact.artifactId,
        artifactKind: clipboardArtifact.kind,
        artifactTitle: clipboardArtifact.title,
        description: `Артефакт "${clipboardArtifact.title}" добавлен в чат`,
        version: 1,
        totalVersions: 1,
        updatedAt: new Date().toISOString(),
        summary: null,
      }

      const newMessage = {
        id: newMessageId,
        role: 'user' as const,
        content: input.trim() || 'Добавляю артефакт в чат',
        parts: [
          {
            type: 'text' as const,
            text: input.trim() || 'Добавляю артефакт в чат'
          },
          {
            type: 'tool-invocation' as const,
            toolInvocation: {
              toolName: 'artifactCreate',
              toolCallId: toolCallId,
              state: 'result' as const,
              args: {
                title: clipboardArtifact.title,
                kind: clipboardArtifact.kind,
                prompt: 'Артефакт добавлен из буфера'
              },
              result: toolResult
            }
          }
        ]
      }

      // Send message with clipboard artifact to AI using append
      append(newMessage, options)
      setClipboardArtifact(null)
      setInput('')
      setIsSubmitting(false)
      return
    }

    handleSubmit(undefined, options)
    setInput('')
    setIsSubmitting(false)
  }, [status, handleSubmit, setInput, input, artifact, clipboardArtifact, setClipboardArtifact, isSubmitting, append])

  // TASK-AI-TOOLS-IMPLEMENTATION: Универсальная функция для обработки файлов (drag&drop + input)
  const processFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return

      setUploadingFiles(files.map(file => file.name))
      toast({ type: 'loading', description: `Uploading ${files.length} file(s)...` })

      try {
        for (const file of files) {
          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/files/upload',
          })

          toast({ type: 'loading', description: `Creating artifact for ${file.name}...` })

          const artifactMetadata = await createArtifactFromUpload(newBlob.url, newBlob.pathname, newBlob.contentType)

          const toolCallId = `call_${Math.random().toString(36).substring(2, 8)}`
          const newMessageId = generateUUID()
          
          const newMessage = {
            id: newMessageId,
            role: 'user' as const,
            content: `Загружен файл: ${file.name}`,
            parts: [
              {
                type: 'text' as const,
                text: `Загружен файл: ${file.name}`
              },
              {
                type: 'tool-invocation' as const,
                toolInvocation: {
                  toolName: 'artifactCreate',
                  toolCallId: toolCallId,
                  state: 'result' as const,
                  args: {
                    title: file.name,
                    kind: file.type.startsWith('image/') ? 'image' : 'text',
                    prompt: 'Файл загружен пользователем'
                  },
                  result: artifactMetadata
                }
              }
            ]
          }

          // Use helper function to add message with custom UUID
          addMessageWithCustomId(newMessage)
        }
        toast({ type: 'success', description: 'Artifact(s) created successfully!' })

      } catch (error) {
        console.error('SYS_UPLOAD_ERR:', error)
        toast({ type: 'error', description: 'Failed to upload files, please try again!' })
      } finally {
        setUploadingFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [addMessageWithCustomId],
  )

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      await processFiles(files)
    },
    [processFiles],
  )

  // TASK-AI-TOOLS-IMPLEMENTATION: Dropzone конфигурация для drag & drop
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: processFiles,
    accept: {
      'text/*': ['.txt', '.md', '.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 5,
    disabled: status !== 'ready' || uploadingFiles.length > 0,
    noClick: true, // Отключаем клик по зоне (используем кнопку)
    noKeyboard: true, // Отключаем keyboard навигацию
  })

  return (
    <div data-testid="chat-input-container" className="relative w-full flex flex-col gap-2">
      {messages.length === 0 &&
        uploadingFiles.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
          />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {/* TASK-AI-TOOLS-IMPLEMENTATION: Dropzone wrapper с визуальными индикаторами */}
      <div 
        {...getRootProps()}
        className={`
          flex flex-col w-full p-2 rounded-2xl border transition-all duration-200
          ${isDragActive 
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 border-2' 
            : isDragReject 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700 border-2'
              : 'bg-muted dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
          }
        `}
      >
        {/* Скрытый input для dropzone */}
        <input {...getInputProps()} />
        
        {/* Индикатор drag & drop */}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100/80 dark:bg-blue-900/80 rounded-2xl z-10">
            <div className="text-center">
              <p className="text-blue-600 dark:text-blue-300 font-medium">
                {isDragReject ? '❌ Неподдерживаемый тип файла' : '📁 Отпустите файлы для загрузки'}
              </p>
              <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                Поддерживаются: .txt, .md, .csv, .docx, .xlsx, изображения
              </p>
            </div>
          </div>
        )}
        {clipboardArtifact && (
          <div data-testid="chat-input-clipboard-artifact" className="flex items-center justify-between p-2 mb-2 rounded-md bg-background border dark:border-zinc-700">
            <span className="text-sm truncate">{clipboardArtifact.title}</span>
            <Button variant="ghost" size="icon" onClick={handleCancelClipboardArtifact}>
              <CrossIcon size={14} />
            </Button>
          </div>
        )}
        {uploadingFiles.length > 0 && (
          <div
            data-testid="chat-input-attachments-preview"
            className="flex flex-row gap-2 overflow-x-scroll items-end p-2 border-b dark:border-zinc-700"
          >
            {uploadingFiles.map((filename) => (
              <PreviewAttachment
                key={filename}
                attachment={{ url: '', name: filename, contentType: '' }}
                isUploading={true}
              />
            ))}
          </div>
        )}

        <Textarea
          data-testid="chat-input-textarea"
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full resize-none bg-transparent !text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none p-2"
          rows={2}
          maxRows={12}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
              event.preventDefault()
              submitForm()
            }
          }}
        />

        <div className="flex w-full items-center justify-between gap-2 pt-2">
          <div className="flex gap-1">
            <AttachmentMenu
              data-testid="chat-input-attach-menu"
              onFileAttach={() => fileInputRef.current?.click()}
              onClipboardAttach={handleClipboardAttach}
              hasClipboardContent={!!clipboardArtifact}
              disabled={status !== 'ready' || uploadingFiles.length > 0}
            />
            <ModelSelector
              data-testid="chat-input-model-selector"
              session={session}
              selectedModelId={initialChatModel}
              className=""
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {status === 'submitted' ? 'Generating...' : '⌘+Enter to send'}
            </p>
            {status === 'submitted' ? (
              <Button
                data-testid="chat-input-stop-button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault()
                  stop()
                }}
              >
                <StopIcon size={16}/>
              </Button>
            ) : (
              <Button
                data-testid="chat-input-send-button"
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault()
                  submitForm()
                }}
                disabled={input.length === 0 || uploadingFiles.length > 0 || status !== 'ready' || isSubmitting}
              >
                <ArrowUpIcon size={18}/>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// END OF: components/chat-input.tsx
