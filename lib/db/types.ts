/**
 * @file lib/db/types.ts
 * @description Типы данных БД для использования в клиентских компонентах (без server-only).
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Перенесены типы из schema.ts для решения server-only проблемы
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Создан файл с типами User, Chat, Artifact, Suggestion без server-only импортов.
 */

import type { ArtifactKind, PublicationInfo } from '@/lib/types'

// Базовые типы пользователей
export interface User {
  id: string
  email: string
  password: string | null
}

// Типы чатов с системой публикации
export interface Chat {
  id: string
  createdAt: Date
  title: string
  userId: string
  published_until: Date | null // NULL = private, timestamp = published until this date
  deletedAt: Date | null // Для мягкого удаления
}

// Типы сообщений (deprecated)
export interface MessageDeprecated {
  id: string
  chatId: string
  role: string
  content: unknown
  createdAt: Date
}

// Современные типы сообщений (v2)
export interface DBMessage {
  id: string
  chatId: string
  role: string
  parts: unknown
  attachments: unknown
  createdAt: Date
}

// Типы артефактов с системой публикации
export interface Artifact {
  id: string
  createdAt: Date
  title: string
  
  // Типизированные колонки контента (Sparse Columns approach)
  content_text: string | null // Для kind: 'text', 'code', 'sheet'
  content_url: string | null // Для kind: 'image' 
  content_site_definition: unknown | null // Для kind: 'site'
  
  summary: string
  kind: ArtifactKind
  userId: string
  authorId: string | null
  deletedAt: Date | null // Для мягкого удаления
  
  // Система публикации - массив объектов с информацией о публикации из разных источников
  publication_state: PublicationInfo[]
}

// Типы предложений
export interface Suggestion {
  id: string
  documentId: string // Имя поля сохранено для обратной совместимости миграций
  documentCreatedAt: Date
  originalText: string
  suggestedText: string
  description: string | null
  isResolved: boolean
  isDismissed: boolean // Для отклоненных предложений
  userId: string
  createdAt: Date
}

// END OF: lib/db/types.ts