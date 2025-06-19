'use client'

/**
 * @file components/artifact.tsx
 * @description Основной компонент-контейнер для артефакта.
 * @version 2.6.0
 * @date 2025-06-18
 * @updated Fixed site publication button - improved SWR retry logic and dialog rendering conditions.
 */

/** HISTORY:
 * v2.6.0 (2025-06-18): Fixed site publication button - improved SWR retry logic and dialog rendering conditions.
 * v2.5.0 (2025-06-18): Fixed runtime error - added safety check for undefined latest object in SWR refreshInterval.
 * v2.4.0 (2025-06-10): Определения artifactKinds и ArtifactKind теперь импортируются из lib/types.
 * v2.3.0 (2025-06-11): Added 'use client' directive.
 * v2.2.0 (2025-06-10): Добавлен экспорт `artifactKinds` и исправлена ошибка типизации в VersionFooter.
 * v2.1.1 (2025-06-10): Renamed 'artifacts' prop to 'documents' when passing to VersionFooter to match component's expected props (TS2322).
 */
import type { Attachment, UIMessage } from 'ai'
import { formatDistance } from 'date-fns'
import { type Dispatch, memo, type SetStateAction, useCallback, useEffect, useState, } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useDebounceCallback, useWindowSize } from 'usehooks-ts'
import { fetcher } from '@/lib/utils'
import { Toolbar } from './toolbar'
import { VersionFooter } from './version-footer'
import { ArtifactActions } from './artifact-actions'
import { ArtifactCloseButton } from './artifact-close-button'
import { SitePublicationDialog } from './site-publication-dialog'
import { useArtifact } from '@/hooks/use-artifact'
import { codeArtifact } from '@/artifacts/kinds/code/client'
import { imageArtifact } from '@/artifacts/kinds/image/client'
import { sheetArtifact } from '@/artifacts/kinds/sheet/client'
import { siteArtifact } from '@/artifacts/kinds/site/client'
import { textArtifact } from '@/artifacts/kinds/text/client'
import equal from 'fast-deep-equal'
import type { UseChatHelpers } from '@ai-sdk/react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { FullscreenIcon } from './icons'
import type { Session } from 'next-auth'
import { toast } from './toast'
import { createClientLogger } from '@/lib/client-logger'
import type { ArtifactKind, ArtifactApiResponse } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ
import type { Artifact as ArtifactData } from '@/lib/db/types'

const logger = createClientLogger('Artifact')

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
  siteArtifact,
]

export type ArtifactDisplayMode = 'split' | 'full';

export interface UIArtifact {
  title: string;
  artifactId: string | null;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  saveStatus: 'idle' | 'saving' | 'saved';
  displayMode: ArtifactDisplayMode;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureArtifact ({
  append,
  status,
  stop,
  setMessages,
  isReadonly,
}: {
  chatId: string;
  input: string;
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: UseChatHelpers['stop'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  selectedVisibilityType: 'private' | 'public';
  session: Session | null
}) {
  const { artifact, setArtifact, metadata, setMetadata, toggleDisplayMode } = useArtifact()
  const artifactLogger = logger.child({ artifactId: artifact.artifactId, kind: artifact.kind })

  const [isToolbarVisible, setIsToolbarVisible] = useState(false)
  const [isSitePublicationDialogOpen, setIsSitePublicationDialogOpen] = useState(false)
  
  // Отдельный запрос для получения полной информации артефакта (включая publication_state)
  const { data: fullArtifact, error: fullArtifactError } = useSWR<ArtifactData>(
    artifact.kind === 'site' && artifact.artifactId ? `/api/artifacts/${artifact.artifactId}` : null,
    fetcher,
    { 
      refreshInterval: (data) => {
        // Retry if we don't have the data yet
        return !data ? 3000 : 0;
      },
      onError: (err) => {
        console.error('🔍 [DEBUG] Full artifact fetch error:', {
          artifactId: artifact.artifactId,
          error: err.message
        })
      }
    }
  )

  const {
    data: artifacts,
    isLoading: isArtifactsFetching,
    error: artifactsError
  } = useSWR<Array<ArtifactApiResponse>>(
    artifact.artifactId && artifact.status !== 'streaming'
      ? `/api/artifact?id=${artifact.artifactId}`
      : null,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data || data.length === 0) return 3000;
        const latest = data[data.length - 1];
        if (!latest) return 3000; // Safety check for undefined latest
        // Keep polling if content is null or summary is missing
        const needsContent = !latest.content || latest.content === '';
        const needsSummary = !latest.summary;
        return (needsContent || needsSummary) ? 3000 : 0;
      },
      onSuccess: (data) => {
        console.log('🔍 [DEBUG] Artifact - SWR success:', {
          artifactId: artifact.artifactId,
          kind: artifact.kind,
          title: artifact.title,
          dataLength: data?.length,
          latestContent: `${data?.[data.length - 1]?.content?.substring(0, 100)}...`
        })
      },
      onError: (err) => {
        console.error('🔍 [DEBUG] Artifact - SWR error:', {
          artifactId: artifact.artifactId,
          error: err.message,
          status: err.status
        })
      }
    }
  )

  useEffect(() => {
    if (!isArtifactsFetching) {
      toast.dismiss()
    }
  }, [isArtifactsFetching])

  const [mode, setMode] = useState<'edit' | 'diff'>('edit')
  const [currentArtifact, setCurrentArtifact] = useState<ArtifactApiResponse | null>(null)
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1)

  useEffect(() => {
    if (artifacts && artifacts.length > 0) {
      const mostRecentArtifact = artifacts.at(-1)
      if (mostRecentArtifact) {
        setCurrentArtifact(mostRecentArtifact)
        setCurrentVersionIndex(artifacts.length - 1)
        setArtifact((current) => ({
          ...current,
          content: mostRecentArtifact.content,
          saveStatus: 'saved'
        }))
      }
    }
  }, [artifacts, setArtifact])

  const { mutate } = useSWRConfig()

  const handleContentChange = useCallback((updatedContent: string) => {
    const { artifactId, title, kind } = artifact
    if (!artifactId) return
    setArtifact(draft => ({ ...draft, saveStatus: 'saving' }))
    mutate(`/api/artifact?id=${artifactId}`, async () => {
      await fetch(`/api/artifact?id=${artifactId}`, {
        method: 'POST',
        body: JSON.stringify({ title, content: updatedContent, kind }),
      })
      setArtifact(draft => ({ ...draft, saveStatus: 'saved' }))
    })
  }, [artifact, mutate, setArtifact])

  const debouncedHandleContentChange = useDebounceCallback(handleContentChange, 2000)

  const saveContent = useCallback((updatedContent: string, debounce: boolean) => {
    if (currentArtifact && updatedContent !== currentArtifact.content) {
      setArtifact(draft => ({ ...draft, saveStatus: 'idle' }))
      if (debounce) debouncedHandleContentChange(updatedContent)
      else handleContentChange(updatedContent)
    }
  }, [currentArtifact, debouncedHandleContentChange, handleContentChange, setArtifact])

  const getArtifactContentByIdx = (index: number) => artifacts?.[index]?.content ?? ''

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!artifacts) return
    if (type === 'latest') {
      setCurrentVersionIndex(artifacts.length - 1)
      setMode('edit')
    } else if (type === 'toggle') {
      setMode((m) => (m === 'edit' ? 'diff' : 'edit'))
    } else if (type === 'prev' && currentVersionIndex > 0) {
      setCurrentVersionIndex(i => i - 1)
    } else if (type === 'next' && currentVersionIndex < artifacts.length - 1) {
      setCurrentVersionIndex(i => i + 1)
    }
  }

  const isCurrentVersion = artifacts ? currentVersionIndex === artifacts.length - 1 : true
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  )

  useEffect(() => {
    if (artifact.artifactId && artifactDefinition?.initialize) {
      artifactDefinition.initialize({ documentId: artifact.artifactId, setMetadata })
    }
  }, [artifact.artifactId, artifactDefinition, setMetadata])

  // Обработка события открытия диалога публикации сайта
  useEffect(() => {
    const handleOpenSitePublicationDialog = () => {
      if (artifact.kind === 'site') {
        setIsSitePublicationDialogOpen(true)
      }
    }

    window.addEventListener('open-site-publication-dialog', handleOpenSitePublicationDialog)
    return () => {
      window.removeEventListener('open-site-publication-dialog', handleOpenSitePublicationDialog)
    }
  }, [artifact.kind])

  if (!artifactDefinition || !artifact.isVisible || isMobile) {
    return null
  }

  return (
    <div data-testid="artifact" className="flex flex-col size-full bg-background border-l dark:border-zinc-700">
      <div className="p-2 flex flex-row justify-between items-start border-b dark:border-zinc-700">
        <div className="flex flex-row gap-4 items-start">
          <ArtifactCloseButton/>
          <div className="flex flex-col">
            <div className="font-medium">{artifact.title}</div>
            {currentArtifact ? (
              <div className="text-sm text-muted-foreground">
                {`Updated ${formatDistance(new Date(currentArtifact.createdAt), new Date(), { addSuffix: true })}`}
              </div>
            ) : (
              <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse"/>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-fit p-2 dark:hover:bg-zinc-700" onClick={toggleDisplayMode}>
                <FullscreenIcon size={18}/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{artifact.displayMode === 'split' ? 'Enter Fullscreen' : 'Exit Fullscreen'}</TooltipContent>
          </Tooltip>
          {!isReadonly && (
            <ArtifactActions
              artifact={artifact}
              currentVersionIndex={currentVersionIndex}
              handleVersionChange={handleVersionChange}
              isCurrentVersion={isCurrentVersion}
              mode={mode}
              metadata={metadata}
              setMetadata={setMetadata}
            />
          )}
        </div>
      </div>
      <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
        {artifactDefinition && (() => {
          const ContentComponent = artifactDefinition.content as any
          return (
            <ContentComponent
              title={artifact.title}
              content={isCurrentVersion ? artifact.content : getArtifactContentByIdx(currentVersionIndex)}
              mode={mode}
              status={artifact.status}
              currentVersionIndex={currentVersionIndex}
              suggestions={[]}
              onSaveContent={isReadonly ? () => {} : saveContent}
              isInline={false}
              isCurrentVersion={isCurrentVersion}
              getDocumentContentById={getArtifactContentByIdx}
              isLoading={isArtifactsFetching || (currentArtifact && (!currentArtifact.content || currentArtifact.content === ''))}
              metadata={metadata as any}
              setMetadata={setMetadata as any}
              isReadonly={isReadonly}
            />
          )
        })()}
        {isCurrentVersion && !isReadonly && (
          <Toolbar
            append={append}
            status={status}
            artifactKind={artifact.kind}
            isToolbarVisible={isToolbarVisible}
            setIsToolbarVisible={setIsToolbarVisible}
            stop={stop}
            setMessages={setMessages}
          />
        )}
      </div>
      {!isCurrentVersion && (
        <VersionFooter
          currentVersionIndex={currentVersionIndex}
          documents={artifacts}
          handleVersionChange={handleVersionChange}
        />
      )}
      
      {/* Диалог публикации сайта */}
      {artifact.kind === 'site' && artifact.artifactId && (
        <SitePublicationDialog
          siteArtifact={fullArtifact || {
            id: artifact.artifactId,
            title: artifact.title,
            kind: 'site',
            createdAt: new Date(),
            userId: '',
            authorId: null,
            deletedAt: null,
            summary: '',
            content_site_definition: null,
            content_text: null,
            content_url: null,
            publication_state: [],
            world_id: null
          }}
          onSiteUpdate={(updatedArtifact) => {
            // Обновляем кеш с полной информацией об артефакте
            mutate(`/api/artifacts/${artifact.artifactId}`, updatedArtifact, { revalidate: false })
          }}
          open={isSitePublicationDialogOpen}
          onOpenChange={setIsSitePublicationDialogOpen}
        />
      )}
    </div>
  )
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => equal(prevProps, nextProps))

// END OF: components/artifact.tsx
