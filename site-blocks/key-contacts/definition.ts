/**
 * @file site-blocks/key-contacts/definition.ts
 * @description Определение блока Key Contacts.
 * @version 0.2.0
 * @date 2025-06-12
 * @updated Extended for visual site editor.
 */

/** HISTORY:
 * v0.2.0 (2025-06-16): Added captions and descriptions for visual editor UI.
 * v0.1.0 (2025-06-12): Initial definition for key contacts block.
 */

import type { BlockDefinition } from '../types'

export const keyContactsBlockDefinition: BlockDefinition = {
  type: 'key-contacts',
  title: 'Key Contacts', // ✅ Обратная совместимость
  caption: 'Ключевые контакты', // ✅ Название блока для UI
  slots: {
    contacts: { 
      kind: 'sheet', 
      caption: 'Список контактов',
      description: 'Таблица с важными контактами компании (имена, должности, телефоны, email).',
      tags: ['contacts']
    },
  },
}

// END OF: site-blocks/key-contacts/definition.ts
