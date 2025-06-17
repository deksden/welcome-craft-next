/**
 * @file site-blocks/useful-links/definition.ts
 * @description Определение блока Useful Links.
 * @version 0.2.0
 * @date 2025-06-12
 * @updated Extended for visual site editor.
 */

/** HISTORY:
 * v0.2.0 (2025-06-16): Added captions and descriptions for visual editor UI.
 * v0.1.0 (2025-06-12): Initial definition for useful links block.
 */

import type { BlockDefinition } from '../types'

export const usefulLinksBlockDefinition: BlockDefinition = {
  type: 'useful-links',
  title: 'Useful Links', // ✅ Обратная совместимость
  caption: 'Полезные ссылки', // ✅ Название блока для UI
  slots: {
    links: { 
      kind: 'sheet', 
      caption: 'Список ссылок',
      description: 'Таблица с полезными ссылками для нового сотрудника (название, URL, описание).',
      tags: ['links']
    },
  },
}

// END OF: site-blocks/useful-links/definition.ts
