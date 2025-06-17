/**
 * @file site-blocks/types.ts
 * @description Типы для системы блоков сайта.
 * @version 0.2.0
 * @date 2025-06-12
 * @updated Extended for visual site editor UI.
 */

/** HISTORY:
 * v0.2.0 (2025-06-16): Extended interfaces for visual editor - added caption, description, allowMultiple, defaultFilters.
 * v0.1.0 (2025-06-12): Initial version.
 */

import type { ArtifactKind } from '@/lib/types'

export interface BlockSlotDefinition {
  kind: ArtifactKind | ArtifactKind[]  // ✅ Поддержка одного или нескольких типов артефактов
  caption: string                       // ✅ Название слота для UI, e.g., "Главный заголовок"
  description?: string                  // ✅ Детальное описание для tooltip'а
  allowMultiple?: boolean               // ✅ Флаг для выбора нескольких артефактов (для галерей, списков)
  tags?: Array<string>                  // ✅ Теги для автоматического поиска
  defaultFilters?: {                    // ✅ Фильтры по умолчанию для окна выбора
    tags?: string[]
    searchQuery?: string
  }
}

export interface BlockDefinition {
  type: string
  caption: string  // ✅ Название блока для UI, e.g., "Приветственный блок"
  title: string    // ✅ Сохраняем для обратной совместимости
  slots: Record<string, BlockSlotDefinition>
}

export interface BlockSlotData {
  artifactId?: string
  versionTimestamp?: string
}

// END OF: site-blocks/types.ts
