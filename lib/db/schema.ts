/**
 * @file lib/db/schema.ts
 * @description Определения таблиц базы данных с использованием Drizzle ORM.
 * @version 2.3.0
 * @date 2025-06-18
 * @updated Добавлены поля world_id для поддержки трехуровневой системы тестирования (Phase 2).
 */

/** HISTORY:
 * v2.3.0 (2025-06-18): Добавлены поля world_id во все основные таблицы для изоляции тестовых миров (Phase 2).
 * v2.2.0 (2025-06-17): Добавлены поля publication_state (Artifact) и published_until (Chat) для системы публикации с TTL.
 * v2.1.0 (2025-06-12): Поле content переведено на JSON и добавлен тип 'site'.
 * v2.0.0 (2025-06-09): Переименована таблица Document->Artifact, добавлены поля deletedAt и isDismissed.
 * v1.4.0 (2025-06-09): Удалена неиспользуемая таблица `stream`.
 * v1.3.0 (2025-06-07): Добавлено поле `summary` в таблицу `Document`.
*/

import type { InferSelectModel } from 'drizzle-orm'
import { boolean, foreignKey, json, jsonb, pgTable, primaryKey, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core'
import type { PublicationInfo } from '@/lib/types'

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  name: text('name'), // Имя пользователя для UI
  // Phase 2: Поле для изоляции тестовых миров
  // NULL = production user, 'WORLD_ID' = test user в конкретном мире
  world_id: varchar('world_id', { length: 64 }),
})

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  published_until: timestamp('published_until'), // NULL = private, timestamp = published until this date
  deletedAt: timestamp('deletedAt'), // Для мягкого удаления
  // Phase 2: Поле для изоляции тестовых миров
  // NULL = production chat, 'WORLD_ID' = test chat в конкретном мире
  world_id: varchar('world_id', { length: 64 }),
})

export type Chat = InferSelectModel<typeof chat>;

// Старая таблица Message удалена для исключения путаницы с новым форматом AI SDK

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  // Phase 2: Поле для изоляции тестовых миров (наследуется от chat)
  // NULL = production message, 'WORLD_ID' = test message в конкретном мире
  world_id: varchar('world_id', { length: 64 }),
})

export type DBMessage = InferSelectModel<typeof message>;

export const artifact = pgTable(
  'Artifact',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    
    // Типизированные колонки контента (Sparse Columns approach)
    // Для kind: 'text', 'code', 'sheet'
    content_text: text('content_text'),
    
    // Для kind: 'image' 
    content_url: varchar('content_url', { length: 2048 }),
    
    // Для kind: 'site'
    content_site_definition: jsonb('content_site_definition'),
    
    summary: text('summary').notNull().default(''),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet', 'site'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    authorId: uuid('authorId').references(() => user.id),
    deletedAt: timestamp('deletedAt'), // Для мягкого удаления
    
    // Система публикации - массив объектов с информацией о публикации из разных источников
    publication_state: jsonb('publication_state').$type<PublicationInfo[]>().default([]).notNull(),
    
    // Phase 2: Поле для изоляции тестовых миров
    // NULL = production artifact, 'WORLD_ID' = test artifact в конкретном мире
    world_id: varchar('world_id', { length: 64 }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    }
  },
)

export type Artifact = InferSelectModel<typeof artifact>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(), // Имя поля сохранено для обратной совместимости миграций
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    isDismissed: boolean('isDismissed').notNull().default(false), // Для отклоненных предложений
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
    // Phase 2: Поле для изоляции тестовых миров (наследуется от artifact)
    // NULL = production suggestion, 'WORLD_ID' = test suggestion в конкретном мире
    world_id: varchar('world_id', { length: 64 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    artifactRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [artifact.id, artifact.createdAt],
    }),
  }),
)

export type Suggestion = InferSelectModel<typeof suggestion>;

// END OF: lib/db/schema.ts
