/**
 * @file lib/db/schema.ts
 * @description Определения таблиц базы данных с использованием Drizzle ORM.
 * @version 3.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Добавлены специализированные таблицы артефактов и новые типы.
 */

/** HISTORY:
 * v3.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Добавлены специализированные таблицы A_Text, A_Image, A_Person, A_Address, A_FaqItem, A_Link, A_SetDefinition, A_SetItems, A_Site. Обновлен ArtifactKind enum с новыми типами.
 * v2.5.0 (2025-06-20): PHASE1 UC-08 CLEANUP - Удалены поля интеллектуального поиска: metadata, quality_score, last_analyzed_at, search_vector.
 * v2.4.0 (2025-06-20): Добавлены поля для интеллектуального поиска артефактов (UC-08 Intelligent Artifact Search).
 * v2.3.0 (2025-06-18): Добавлены поля world_id во все основные таблицы для изоляции тестовых миров (Phase 2).
 * v2.2.0 (2025-06-17): Добавлены поля publication_state (Artifact) и published_until (Chat) для системы публикации с TTL.
 * v2.1.0 (2025-06-12): Поле content переведено на JSON и добавлен тип 'site'.
 * v2.0.0 (2025-06-09): Переименована таблица Document->Artifact, добавлены поля deletedAt и isDismissed.
 * v1.4.0 (2025-06-09): Удалена неиспользуемая таблица `stream`.
 * v1.3.0 (2025-06-07): Добавлено поле `summary` в таблицу `Document`.
*/

import type { InferSelectModel } from 'drizzle-orm'
import { boolean, decimal, foreignKey, integer, json, jsonb, pgTable, primaryKey, text, timestamp, uuid, varchar, } from 'drizzle-orm/pg-core'
import type { PublicationInfo } from '@/lib/types'
// REMOVED UC-08 import: import type { ArtifactMetadata } from '@/lib/types/intelligent-search'

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
    summary: text('summary').notNull().default(''),
    
    // SCHEMA-DRIVEN: Убираем sparse columns, все данные хранятся в специализированных таблицах
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet', 'site', 'person', 'address', 'faq-item', 'link', 'set-definition', 'set'] })
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

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Специализированные таблицы для данных артефактов
// =============================================================================

// Таблица для текстового контента (text, code, sheet)
export const artifactText = pgTable('A_Text', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  content: text('content').notNull(),
  wordCount: integer('wordCount'),
  charCount: integer('charCount'),
  language: varchar('language', { length: 10 }), // Для code артефактов
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactText = InferSelectModel<typeof artifactText>;

// Таблица для изображений
export const artifactImage = pgTable('A_Image', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  altText: text('altText'),
  width: integer('width'),
  height: integer('height'),
  fileSize: integer('fileSize'),
  mimeType: varchar('mimeType', { length: 100 }),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactImage = InferSelectModel<typeof artifactImage>;

// Таблица для персон (новый тип)
export const artifactPerson = pgTable('A_Person', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  fullName: text('fullName').notNull(),
  position: text('position'),
  photoUrl: varchar('photoUrl', { length: 2048 }),
  quote: text('quote'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  department: text('department'),
  location: text('location'),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactPerson = InferSelectModel<typeof artifactPerson>;

// Таблица для адресов (новый тип)
export const artifactAddress = pgTable('A_Address', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  streetAddress: text('streetAddress').notNull(),
  city: text('city').notNull(),
  state: text('state'),
  postalCode: varchar('postalCode', { length: 20 }),
  country: text('country').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  timezone: varchar('timezone', { length: 50 }),
  createdAtInternal: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactAddress = InferSelectModel<typeof artifactAddress>;

// Таблица для FAQ элементов (новый тип)
export const artifactFaqItem = pgTable('A_FaqItem', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category'),
  priority: integer('priority').default(0),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAtInternal: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactFaqItem = InferSelectModel<typeof artifactFaqItem>;

// Таблица для ссылок (новый тип)
export const artifactLink = pgTable('A_Link', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  iconUrl: varchar('iconUrl', { length: 2048 }),
  isInternal: boolean('isInternal').default(false),
  createdAtInternal: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactLink = InferSelectModel<typeof artifactLink>;

// Таблица для определений наборов (новый тип)
export const artifactSetDefinition = pgTable('A_SetDefinition', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  definition: jsonb('definition').notNull(), // { allowedKinds: string[], maxItems?: number, requiredFields?: string[] }
  validationRules: jsonb('validationRules').default({}),
  defaultSorting: varchar('defaultSorting', { length: 50 }).default('createdAt'),
  allowDuplicates: boolean('allowDuplicates').default(false),
  createdAtInternal: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactSetDefinition = InferSelectModel<typeof artifactSetDefinition>;

// Таблица для связей элементов наборов (новый тип)
export const artifactSetItems = pgTable('A_SetItems', {
  setId: uuid('setId').notNull(),
  setCreatedAt: timestamp('setCreatedAt').notNull(),
  itemId: uuid('itemId').notNull(),
  itemCreatedAt: timestamp('itemCreatedAt').notNull(),
  order: integer('order').notNull().default(0),
  metadata: jsonb('metadata').default({}), // Дополнительные данные связи
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.setId, table.itemId] }),
  setRef: foreignKey({
    columns: [table.setId, table.setCreatedAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
  itemRef: foreignKey({
    columns: [table.itemId, table.itemCreatedAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactSetItems = InferSelectModel<typeof artifactSetItems>;

// Таблица для сайтов (заменяет content_site_definition)
export const artifactSite = pgTable('A_Site', {
  artifactId: uuid('artifactId').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  siteDefinition: jsonb('siteDefinition').notNull(), // Полное определение сайта
  theme: varchar('theme', { length: 100 }).default('default'),
  reasoning: text('reasoning'), // UC-09 optional field
  blocksCount: integer('blocksCount').default(0),
  lastOptimized: timestamp('lastOptimized'),
  createdAtInternal: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.artifactId, table.createdAt] }),
  artifactRef: foreignKey({
    columns: [table.artifactId, table.createdAt],
    foreignColumns: [artifact.id, artifact.createdAt],
  }),
}))

export type ArtifactSite = InferSelectModel<typeof artifactSite>;

// END OF: lib/db/schema.ts
