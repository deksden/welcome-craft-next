/**
 * @file lib/types.ts
 * @description Общие типы данных для всего приложения.
 * @version 2.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Добавлены новые типы артефактов для схема-ориентированной архитектуры.
 */

/** HISTORY:
 * v2.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Добавлены новые типы артефактов: person, address, faq-item, link, set-definition, set. Обновлен ArtifactApiResponse для совместимости с новой архитектурой.
 * v1.3.0 (2025-06-17): Добавлен PublicationInfo интерфейс для системы публикации с TTL.
 * v1.2.0 (2025-06-12): Добавлен тип 'site' в artifactKinds.
 * v1.1.0 (2025-06-10): Добавлены ArtifactKind и artifactKinds.
 * v1.0.0 (2025-06-06): Создан файл и добавлен тип VisibilityType.
 */

export type DataPart = { type: 'append-message'; message: string };

export type VisibilityType = 'public' | 'private';

// Определения, связанные с артефактами, вынесены сюда для общего доступа
// как для сервера, так и для клиента.
// UC-10 SCHEMA-DRIVEN CMS: Расширенный список типов артефактов
export const artifactKinds = [
  'text', 'code', 'image', 'sheet', 'site', 
  'person', 'address', 'faq-item', 'link', 'set-definition', 'set'
] as const
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
  worldId: string | null
  publicationState: PublicationInfo[]
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

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Интерфейсы для специализированных данных артефактов
// =============================================================================

/**
 * @description Интерфейс для текстовых артефактов с метаданными
 * @feature Поддержка языков программирования для code артефактов
 */
export interface ArtifactTextData {
  content: string;
  wordCount?: number;
  charCount?: number;
  language?: string; // Для code артефактов
}

/**
 * @description Интерфейс для изображений с расширенными метаданными
 * @feature Поддержка размеров, типов файлов и альтернативного текста
 */
export interface ArtifactImageData {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
}

/**
 * @description Интерфейс для персон в HR-системе
 * @feature Полная информация о сотрудниках для онбординга
 */
export interface ArtifactPersonData {
  fullName: string;
  position?: string;
  photoUrl?: string;
  quote?: string;
  email?: string;
  phone?: string;
  department?: string;
  location?: string;
}

/**
 * @description Интерфейс для структурированных адресов
 * @feature Поддержка геолокации и часовых поясов
 */
export interface ArtifactAddressData {
  streetAddress: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude?: string; // Decimal as string
  longitude?: string; // Decimal as string
  timezone?: string;
}

/**
 * @description Интерфейс для FAQ элементов
 * @feature Категоризация и приоритизация вопросов
 */
export interface ArtifactFaqItemData {
  question: string;
  answer: string;
  category?: string;
  priority?: number;
  tags?: string[];
}

/**
 * @description Интерфейс для ссылок с метаданными
 * @feature Поддержка внутренних/внешних ссылок и иконок
 */
export interface ArtifactLinkData {
  url: string;
  title: string;
  description?: string;
  category?: string;
  iconUrl?: string;
  isInternal?: boolean;
}

/**
 * @description Интерфейс для определений наборов
 * @feature Валидация и ограничения для коллекций артефактов
 */
export interface ArtifactSetDefinitionData {
  definition: {
    allowedKinds: string[];
    maxItems?: number;
    requiredFields?: string[];
  };
  validationRules?: Record<string, any>;
  defaultSorting?: string;
  allowDuplicates?: boolean;
}

/**
 * @description Интерфейс для элементов наборов
 * @feature Упорядочивание и метаданные связей
 */
export interface ArtifactSetItemData {
  setId: string;
  itemId: string;
  order: number;
  metadata?: Record<string, any>;
}

/**
 * @description Интерфейс для сайтов
 * @feature UC-09 совместимость с reasoning и блоками
 */
export interface ArtifactSiteData {
  siteDefinition: Record<string, any>; // SiteDefinition
  theme?: string;
  reasoning?: string; // UC-09 optional field
  blocksCount?: number;
  lastOptimized?: string; // ISO-8601
}

// =============================================================================
// UC-10 SCHEMA-DRIVEN CMS: Метаданные артефактов для tool-result сообщений
// =============================================================================

/**
 * @description Стандартизированный объект метаданных для tool-result сообщений
 * @feature Единообразная обработка результатов AI инструментов в чате
 */
export interface ArtifactMetadata {
  /** ID созданного/обновленного артефакта */
  artifactId: string
  /** Тип артефакта */
  artifactKind: ArtifactKind
  /** Название артефакта */
  artifactTitle: string
  /** Человекочитаемое описание результата операции */
  description: string
  /** Номер версии артефакта */
  version: number
  /** Общее количество версий артефакта */
  totalVersions: number
  /** Дата последнего обновления в ISO 8601 формате */
  updatedAt: string
  /** Саммари артефакта (заполняется асинхронно) */
  summary?: string | null
}

// END OF: lib/types.ts