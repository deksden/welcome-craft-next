/**
 * @file app/(site)/(hosting)/s/[siteId]/page.tsx
 * @description Страница для отображения опубликованного сайта с проверкой публикации на сервере.
 * @version 2.1.0
 * @date 2025-06-19
 * @updated Fixed critical bug: orderBy now gets LATEST version instead of FIRST + added diagnostic logging.
 */

/** HISTORY:
 * v2.1.0 (2025-06-19): Fixed critical bug: orderBy(desc()) for latest version + diagnostic logging for BUG-013.
 * v2.0.0 (2025-06-17): Added publication system support with server-side validation.
 * v1.1.0 (2025-06-12): Load site artifact via SiteRenderer.
 * v1.0.0 (2025-06-12): Начальная версия.
 */

import { notFound } from 'next/navigation'
import { eq, desc, } from 'drizzle-orm'
import { artifact } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { isSitePublished } from '@/lib/publication-utils'
import { blockComponents } from '@/site-blocks'
import type { Artifact } from '@/lib/db/schema'

interface SitePageProps {
  params: Promise<{ siteId: string }>
}

interface BlockSlotData {
  artifactId?: string
  versionTimestamp?: string
}

interface SiteDefinition {
  theme: string
  blocks: Array<{
    type: string
    slots: Record<string, BlockSlotData>
  }>
}

export default async function HostedSitePage (props: SitePageProps) {
  const { siteId } = await props.params

  console.log('🌐 PUBLIC SITE REQUEST:', { siteId })

  // Server-side validation for published sites - get LATEST version
  // IMPORTANT: Public sites can be from ANY world (production or test)
  // We search across all worlds to find published sites
  const siteResult = await db
    .select()
    .from(artifact)
    .where(eq(artifact.id, siteId))
    .orderBy(desc(artifact.createdAt))
    .limit(1)

  console.log('🌐 SITE QUERY RESULT:', { 
    found: siteResult.length > 0,
    siteId,
    artifactKind: siteResult[0]?.kind,
    hasPublicationState: !!siteResult[0]?.publication_state,
    publicationCount: siteResult[0]?.publication_state?.length || 0
  })

  if (siteResult.length === 0) {
    console.log('🌐 SITE NOT FOUND:', { siteId })
    notFound()
  }

  const siteArtifact = siteResult[0] as Artifact

  // Check if site is published
  const isPublished = isSitePublished(siteArtifact)
  console.log('🌐 PUBLICATION CHECK:', { 
    siteId,
    isPublished,
    publicationState: siteArtifact.publication_state 
  })
  
  if (!isPublished) {
    console.log('🌐 SITE NOT PUBLISHED:', { siteId })
    notFound()
  }

  // UC-10 TODO: Load site definition from A_Site table using artifact-tools
  // For now, create a minimal fallback definition to prevent crash
  const siteDefinition: SiteDefinition = {
    theme: 'default',
    blocks: []
  }

  return (
    <div className="space-y-6">
      {siteDefinition.blocks.map((block, index) => {
        const Block = (blockComponents as any)[block.type]
        if (!Block) return null
        return <Block key={`${block.type}-${index}`} {...block.slots} />
      })}
    </div>
  )
}

// END OF: app/(site)/(hosting)/s/[siteId]/page.tsx
