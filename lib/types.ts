/**
 * @file lib/types.ts
 * @description Общие типы данных для всего приложения.
 * @version 1.3.0
 * @date 2025-06-17
 * @updated Добавлен PublicationInfo интерфейс для системы публикации.
 */

/** HISTORY:
 * v1.3.0 (2025-06-17): Добавлен PublicationInfo интерфейс для системы публикации с TTL.
 * v1.2.0 (2025-06-12): Добавлен тип 'site' в artifactKinds.
 * v1.1.0 (2025-06-10): Добавлены ArtifactKind и artifactKinds.
 * v1.0.0 (2025-06-06): Создан файл и добавлен тип VisibilityType.
 */

export type DataPart = { type: 'append-message'; message: string };

export type VisibilityType = 'public' | 'private';

// Определения, связанные с артефактами, вынесены сюда для общего доступа
// как для сервера, так и для клиента.
export const artifactKinds = ['text', 'code', 'image', 'sheet', 'site'] as const
export type ArtifactKind = (typeof artifactKinds)[number];

// API response type for normalized artifacts (with unified content field)
export interface ArtifactApiResponse {
  id: string
  createdAt: Date
  title: string
  summary: string
  kind: ArtifactKind
  userId: string
  authorId: string | null
  deletedAt: Date | null
  content: string  // Unified content field from normalizeArtifactForAPI
}

/**
 * @description Информация о публикации артефакта из определенного источника
 * @feature Система публикации с поддержкой TTL и множественных источников
 */
export interface PublicationInfo {
  /** Источник, инициировавший публикацию */
  source: 'direct' | 'chat' | 'site';
  /** ID чата или сайта-источника */
  sourceId: string;
  /** Дата публикации */
  publishedAt: string; // ISO-8601
  /** Дата истечения публикации (null = бессрочно) */
  expiresAt: string | null; // ISO-8601
}

// END OF: lib/types.ts