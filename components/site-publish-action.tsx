/**
 * @file components/site-publish-action.tsx
 * @description Action кнопка для публикации сайта.
 * @version 1.0.0
 * @date 2025-06-17
 * @updated Создание action кнопки для интеграции в artifact actions.
 */

/** HISTORY:
 * v1.0.0 (2025-06-17): Создание action кнопки публикации сайта для использования в ArtifactActions.
 */

'use client'

import { useState } from 'react'
import { GlobeIcon } from '@/components/icons'
import { SitePublicationDialog } from '@/components/site-publication-dialog'
import { isSitePublished } from '@/lib/publication-client-utils'
import type { Artifact } from '@/lib/db/types'
import type { ArtifactActionContext } from '@/components/create-artifact'

interface SitePublishActionProps {
  artifact: Artifact;
  actionContext: ArtifactActionContext;
}

export function SitePublishAction({ artifact, actionContext }: SitePublishActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [localArtifact, setLocalArtifact] = useState<Artifact>(artifact)
  
  const isPublished = isSitePublished(localArtifact)

  const handleSiteUpdate = (updatedArtifact: Artifact) => {
    setLocalArtifact(updatedArtifact)
    // Можно добавить логику обновления в родительском компоненте если нужно
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2 text-sm"
        title={isPublished ? 'Управление публикацией сайта' : 'Опубликовать сайт'}
      >
        <GlobeIcon size={16} />
        {isPublished ? 'Управление публикацией' : 'Опубликовать сайт'}
      </button>

      <SitePublicationDialog
        siteArtifact={localArtifact}
        onSiteUpdate={handleSiteUpdate}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}

// END OF: components/site-publish-action.tsx