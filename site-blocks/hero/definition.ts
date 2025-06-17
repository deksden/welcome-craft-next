/**
 * @file site-blocks/hero/definition.ts
 * @description Определение блока Hero.
 * @version 0.2.0
 * @date 2025-06-12
 * @updated Extended for visual site editor.
 */

/** HISTORY:
 * v0.2.0 (2025-06-16): Added captions and descriptions for visual editor UI.
 * v0.1.0 (2025-06-12): Initial definition for hero block.
 */

import type { BlockDefinition } from '../types'

export const heroBlockDefinition: BlockDefinition = {
  type: 'hero',
  title: 'Hero', // ✅ Обратная совместимость
  caption: 'Главный экран', // ✅ Название блока для UI
  slots: {
    heading: { 
      kind: 'text', 
      caption: 'Заголовок', // ✅ Название слота
      description: 'Основной приветственный текст. Выберите текстовый артефакт.', // ✅ Подсказка
      tags: ['hero', 'heading'] 
    },
    subheading: { 
      kind: 'text', 
      caption: 'Подзаголовок',
      description: 'Краткое пояснение или слоган под основным заголовком.',
      tags: ['hero', 'subheading'] 
    },
    image: { 
      kind: 'image', 
      caption: 'Фоновое изображение',
      description: 'Выберите яркое изображение, отражающее суть компании или команды.',
      tags: ['hero', 'image'] 
    },
  },
}

// END OF: site-blocks/hero/definition.ts
