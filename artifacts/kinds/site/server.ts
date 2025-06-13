/**
 * @file artifacts/kinds/site/server.ts
 * @description Серверный обработчик для артефакта типа "Сайт".
 * @version 1.0.0
 * @date 2025-06-13
 * @updated Логика генерации сайта перенесена из siteGenerate в метод create.
 */

/** HISTORY:
 * v1.0.0 (2025-06-13): Moved site generation logic from the separate tool into the create method.
 * v0.1.0 (2025-06-12): Initial placeholder implementation.
 */

import type { Session } from 'next-auth'
import { createLogger } from '@fab33/fab-logger'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
import { blockDefinitions } from '@/site-blocks'
import type { ArtifactTool } from '@/artifacts/kinds/artifact-tools'

const logger = createLogger('artifacts:kinds:site:server')

interface SiteBlockDefinition {
  type: string;
  slots: Record<string, { artifactId: string }>;
}

interface SiteDefinition {
  theme: string;
  blocks: Array<SiteBlockDefinition>;
}

export const siteTool: ArtifactTool = {
  kind: 'site',
  create: async ({ prompt, session }) => {
    // В данном контексте `prompt` - это тема сайта или описание.
    // Пока мы используем упрощенную логику для поиска блоков.
    const childLogger = logger.child({ userId: session.user.id, prompt })
    childLogger.trace('Entering siteTool.create')

    const siteDefinition: SiteDefinition = { theme: 'default', blocks: [] }

    // TODO: В будущем здесь будет логика AI для выбора блоков на основе промпта.
    // Сейчас мы просто берем все доступные блоки для демонстрации.
    const blockTypesToInclude = Object.keys(blockDefinitions)

    for (const blockType of blockTypesToInclude) {
      const definition = blockDefinitions[blockType]
      if (!definition) continue

      const block: SiteBlockDefinition = { type: blockType, slots: {} }

      for (const [slotName, slotDef] of Object.entries(definition.slots)) {
        let artifactId = ''
        // Ищем первый подходящий артефакт по первому тегу
        const firstTag = slotDef.tags?.[0]
        if (firstTag) {
          const { data } = await getPagedArtifactsByUserId({
            userId: session.user.id as string, // сессия проверена на уровне выше
            searchQuery: firstTag,
            page: 1,
            pageSize: 1,
            kind: slotDef.kind,
          })
          artifactId = data[0]?.id ?? ''
          childLogger.info({ blockType, slotName, tag: firstTag, foundArtifactId: artifactId }, 'Searched for artifact for slot')
        }
        block.slots[slotName] = { artifactId }
      }
      siteDefinition.blocks.push(block)
    }

    childLogger.info({ siteDefinition: JSON.stringify(siteDefinition) }, 'Generated site definition')
    return JSON.stringify(siteDefinition)
  },
  async update () {
    // Логика обновления сайта может быть сложной и будет реализована позже.
    // Например, "добавь блок FAQ" или "поменяй заголовок".
    logger.warn('Update operation for "site" artifact is not yet implemented.')
    return ''
  },
}

// END OF: artifacts/kinds/site/server.ts
