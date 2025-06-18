/**
 * @file app/(site)/(hosting)/s/[siteId]/page.tsx
 * @description Страница для отображения опубликованного сайта с проверкой публикации на сервере.
 * @version 2.0.0
 * @date 2025-06-17
 * @updated Added publication system support with server-side validation.
 */

/** HISTORY:
 * v2.0.0 (2025-06-17): Added publication system support with server-side validation.
 * v1.1.0 (2025-06-12): Load site artifact via SiteRenderer.
 * v1.0.0 (2025-06-12): Начальная версия.
 */

import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
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

  // Server-side validation for published sites
  const siteResult = await db
    .select()
    .from(artifact)
    .where(eq(artifact.id, siteId))
    .orderBy(artifact.createdAt)
    .limit(1)

  if (siteResult.length === 0) {
    notFound()
  }

  const siteArtifact = siteResult[0] as Artifact

  // Check if site is published
  if (!isSitePublished(siteArtifact)) {
    notFound()
  }

  // Parse site definition
  if (!siteArtifact.content_site_definition) {
    notFound()
  }

  const siteDefinition = siteArtifact.content_site_definition as SiteDefinition

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
