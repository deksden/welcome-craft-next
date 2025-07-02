/**
 * @file artifacts/kinds/artifact-tools.ts
 * @description Центральный реестр для инструментов-обработчиков артефактов с Spectrum Schema-Driven CMS поддержкой.
 * @version 2.0.0
 * @date 2025-06-21
 * @updated Spectrum SCHEMA-DRIVEN CMS - Объединены AI tools и schema-driven savers в единый реестр.
 */

/** HISTORY:
 * v2.0.0 (2025-06-21): Spectrum SCHEMA-DRIVEN CMS - Расширен интерфейс ArtifactTool для поддержки save/load/delete операций. Добавлены все новые типы артефактов Spectrum.
 * v1.2.0 (2025-06-12): Added siteTool to registry.
 * v1.1.0 (2025-06-10): Импорт ArtifactKind теперь из lib/types.
 * v1.0.0 (2025-06-10): Initial version. Defines the ArtifactTool contract and exports all available tools.
 */
import type { Session } from 'next-auth'
import type { Artifact } from '@/lib/db/schema'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ
// Import individual tools - Legacy AI tools + Spectrum schema-driven functions
import { textTool } from './text/server'
import { codeTool } from './code/server' 
import { imageTool } from './image/server'
import { sheetTool } from './sheet/server'
import { siteTool } from './site/server'

// Spectrum SCHEMA-DRIVEN CMS: New artifact types with schema-driven functions only
import { personTool } from './person/server'
import { addressTool } from './address/server' 
import { faqItemTool } from './faq-item/server'
import { linkTool } from './link/server'
import { setDefinitionTool } from './set-definition/server'
import { setTool } from './set/server'

/**
 * @interface ArtifactTool
 * @description Spectrum SCHEMA-DRIVEN CMS - Расширенный контракт для инструментов артефактов.
 * Включает как AI operations (create, update), так и schema-driven операции (save, load, delete).
 * @feature Полная поддержка Spectrum специализированных таблиц
 */
export interface ArtifactTool {
  kind: ArtifactKind;
  
  // AI-инструменты (legacy, для совместимости)
  create?: (props: {
    id: string,
    title: string,
    prompt: string,
    session: Session
  }) => Promise<string>;
  update?: (props: {
    document: Artifact,
    description: string,
    session: Session
  }) => Promise<string>;
  
  // Spectrum Schema-Driven операции
  /**
   * @description Сохраняет артефакт с типизированными данными в специализированную таблицу
   * @param artifact - Базовая информация об артефакте (из таблицы Artifact)
   * @param content - Контент артефакта (string для compatibility)
   * @param metadata - Дополнительные метаданные для сохранения
   * @returns Promise с результатом операции
   */
  save?: (artifact: Artifact, content: string, metadata?: Record<string, any>) => Promise<void>;
  
  /**
   * @description Загружает данные артефакта из специализированной таблицы
   * @param artifactId - ID артефакта для загрузки
   * @param createdAt - Timestamp версии артефакта (composite key)
   * @returns Promise с данными артефакта или null если не найден
   */
  load?: (artifactId: string, createdAt: Date) => Promise<any | null>;
  
  /**
   * @description Удаляет данные артефакта из специализированной таблицы
   * @param artifactId - ID артефакта для удаления
   * @param createdAt - Timestamp версии артефакта (composite key)
   * @returns Promise с результатом операции
   */
  delete?: (artifactId: string, createdAt: Date) => Promise<void>;
}

/**
 * @const {ArtifactTool[]} artifactTools
 * @description Spectrum SCHEMA-DRIVEN CMS - Полный реестр всех типов артефактов.
 * Включает как legacy AI tools, так и новые schema-driven типы.
 * @feature Поддержка 11 типов артефактов с унифицированным интерфейсом
 */
export const artifactTools: ArtifactTool[] = [
  // Legacy типы с AI + schema-driven операциями
  textTool,
  codeTool,
  imageTool,
  sheetTool,
  siteTool,
  
  // Spectrum новые типы (только schema-driven операции)
  personTool,
  addressTool,
  faqItemTool,
  linkTool,
  setDefinitionTool,
  setTool,
]

/**
 * @description Spectrum SCHEMA-DRIVEN CMS - Диспетчер для операций сохранения
 * @feature Автоматическая маршрутизация на основе ArtifactKind
 * @param artifact - Базовая информация об артефакте
 * @param content - Контент для сохранения
 * @param metadata - Дополнительные метаданные
 * @returns Promise с результатом операции
 * @throws Ошибка если тип артефакта не поддерживается
 */
export async function saveArtifact(
  artifact: { kind: ArtifactKind } & Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const tool = artifactTools.find(t => t.kind === artifact.kind)
  
  if (!tool || !tool.save) {
    throw new Error(`No save handler found for artifact kind: ${artifact.kind}`)
  }
  
  return tool.save(artifact, content, metadata)
}

/**
 * @description Spectrum SCHEMA-DRIVEN CMS - Диспетчер для операций загрузки
 * @feature Автоматическая маршрутизация на основе ArtifactKind
 * @param artifactKind - Тип артефакта
 * @param artifactId - ID артефакта для загрузки
 * @param createdAt - Timestamp версии артефакта
 * @returns Promise с данными артефакта или null
 * @throws Ошибка если тип артефакта не поддерживается
 */
export async function loadArtifact(
  artifactKind: ArtifactKind,
  artifactId: string, 
  createdAt: Date
): Promise<any | null> {
  const tool = artifactTools.find(t => t.kind === artifactKind)
  
  if (!tool || !tool.load) {
    throw new Error(`No load handler found for artifact kind: ${artifactKind}`)
  }
  
  return tool.load(artifactId, createdAt)
}

/**
 * @description Spectrum SCHEMA-DRIVEN CMS - Диспетчер для операций удаления
 * @feature Автоматическая маршрутизация на основе ArtifactKind
 * @param artifactKind - Тип артефакта
 * @param artifactId - ID артефакта для удаления
 * @param createdAt - Timestamp версии артефакта
 * @returns Promise с результатом операции
 * @throws Ошибка если тип артефакта не поддерживается
 */
export async function deleteArtifact(
  artifactKind: ArtifactKind,
  artifactId: string, 
  createdAt: Date
): Promise<void> {
  const tool = artifactTools.find(t => t.kind === artifactKind)
  
  if (!tool || !tool.delete) {
    throw new Error(`No delete handler found for artifact kind: ${artifactKind}`)
  }
  
  return tool.delete(artifactId, createdAt)
}

// END OF: artifacts/kinds/artifact-tools.ts
