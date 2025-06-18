/**
 * @file app/(site)/(hosting)/s/[siteId]/site-renderer.tsx
 * @description Client component that loads published site artifacts and renders blocks.
 * @version 1.0.0
 * @date 2025-06-17
 * @updated Added publication system support and public access control.
 */

/** HISTORY:
 * v1.0.0 (2025-06-17): Added publication system support and public access control.
 * v0.1.0 (2025-06-12): Initial version.
 */

'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { blockComponents } from '@/site-blocks'
import { Skeleton } from '@/components/ui/skeleton'

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

export function SiteRenderer ({ siteId }: { siteId: string }) {
  const { data, isLoading, error } = useSWR<any>(`/api/artifact?id=${siteId}`, fetcher)

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-full" />
      </div>
    )
  }

  // Handle error responses (site not published or not found)
  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Сайт не найден
        </h1>
        <p className="text-gray-600">
          Этот сайт не опубликован или не существует.
        </p>
      </div>
    )
  }

  const siteArtifact = Array.isArray(data) ? data.at(-1) : data.doc
  
  // Handle case where site artifact has no content yet
  if (!siteArtifact?.content) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Сайт еще не готов
        </h1>
        <p className="text-gray-600">
          Содержимое сайта находится в процессе генерации.
        </p>
      </div>
    )
  }

  const siteDefinition: SiteDefinition = JSON.parse(siteArtifact.content)

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

export { SiteRenderer as default }

// END OF: app/(site)/(hosting)/s/[siteId]/site-renderer.tsx
