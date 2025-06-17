
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
    // При создании артефакта типа 'site' через AI инструменты
    const childLogger = logger.child({ userId: session.user.id, prompt })
    childLogger.trace('Entering siteTool.create')

    const siteDefinition: SiteDefinition = { theme: 'default', blocks: [] }

    // Автоматически создаем базовые блоки для сайта
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
          // ✅ Handle both single kind and array of kinds
          const kindToSearch = Array.isArray(slotDef.kind) ? slotDef.kind[0] : slotDef.kind
          
          // Сначала ищем по тегу
          let { data } = await getPagedArtifactsByUserId({
            userId: session.user.id as string,
            searchQuery: firstTag,
            page: 1,
            pageSize: 1,
            kind: kindToSearch,
          })
          
          // Если не нашли по тегу, ищем любой артефакт нужного типа
          if (data.length === 0) {
            const fallbackSearch = await getPagedArtifactsByUserId({
              userId: session.user.id as string,
              searchQuery: '',
              page: 1,
              pageSize: 1,
              kind: kindToSearch,
            })
            data = fallbackSearch.data
            childLogger.info({ 
              blockType, 
              slotName, 
              fallbackUsed: true,
              kindToSearch,
              fallbackResultsCount: data.length 
            }, 'Used fallback search for slot')
          }
          
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
