/**
 * @file components/artifact-preview.tsx
 * @description Компонент для отображения превью артефактов в чате.
 * @version 2.3.1
 * @date 2025-06-11
 * @updated Refactored to call React Hooks unconditionally at the top level.
 */

/** HISTORY:
 * v2.3.1 (2025-06-11): Fixed React Hooks rules by moving all hooks to the top level.
 * v2.3.0 (2025-06-10): Исправлены ошибки типизации (TS2322) путем явного приведения типов.
 */
import { memo, type MouseEvent, useCallback, useMemo, useRef, } from 'react'
import { BoxIcon, CodeIcon, FileIcon, FullscreenIcon, ImageIcon, WarningIcon } from './icons'
import { cn, fetcher } from '@/lib/utils'
import type { ArtifactApiResponse, ArtifactKind } from '@/lib/types'
import { InlineArtifactSkeleton } from './artifact-skeleton'
import useSWR from 'swr'
import { useArtifact } from '@/hooks/use-artifact'
import { ImageEditor } from './image-editor'
import { toast } from './toast'
import type { artifactCreate } from '@/artifacts/tools/artifactCreate'

type ArtifactToolResult = Awaited<ReturnType<ReturnType<typeof artifactCreate>['execute']>>;

interface ArtifactPreviewProps {
  isReadonly: boolean;
  result: ArtifactToolResult;
}

export function ArtifactPreview ({ isReadonly, result }: ArtifactPreviewProps) {
  const { setArtifact } = useArtifact()

  // Moved all hooks to the top level
  const { artifactId, artifactTitle, artifactKind, description, summary } = 'error' in result ? {
    artifactId: '',
    artifactTitle: '',
    artifactKind: 'text',
    description: '',
    summary: ''
  } : result

  const { data: artifacts, isLoading, error } = useSWR<Array<ArtifactApiResponse>>(
    artifactId ? `/api/artifact?id=${artifactId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data || data.length === 0) return 3000;
        const latest = data[data.length - 1];
        // Keep polling if content is null or summary is missing
        const needsContent = !latest.content || latest.content === '';
        const needsSummary = !latest.summary;
        return (needsContent || needsSummary) ? 3000 : 0;
      },
      onSuccess: (data) => {
        console.log('🔍 [DEBUG] ArtifactPreview - SWR success:', {
          artifactId,
          artifactKind,
          artifactTitle,
          dataLength: data?.length,
          latestContent: `${data?.[data.length - 1]?.content?.substring(0, 100)}...`,
          latestSummary: data?.[data.length - 1]?.summary
        })
      },
      onError: (err) => {
        console.error('🔍 [DEBUG] ArtifactPreview - SWR error:', {
          artifactId,
          error: err.message,
          status: err.status
        })
      }
    }
  )

  const fullArtifact = useMemo(() => {
    const latest = artifacts?.[artifacts.length - 1]
    console.log('🔍 [DEBUG] ArtifactPreview - fullArtifact computed:', {
      artifactId,
      hasArtifacts: !!artifacts,
      artifactsLength: artifacts?.length,
      latestArtifact: latest ? {
        id: latest.id,
        kind: latest.kind,
        title: latest.title,
        contentLength: latest.content?.length,
        contentPreview: `${latest.content?.substring(0, 100)}...`,
        summary: latest.summary,
        createdAt: latest.createdAt
      } : null
    })
    return latest
  }, [artifacts, artifactId])
  const hitboxRef = useRef<HTMLDivElement>(null)

  const handleOpenArtifact = useCallback((event: MouseEvent<HTMLElement>) => {
    const boundingBox = event.currentTarget.getBoundingClientRect()
    toast({ type: 'loading', description: `Открываю артефакт "${artifactTitle}"...` })
    setArtifact({
      artifactId: artifactId,
      kind: artifactKind as ArtifactKind,
      title: artifactTitle as string,
      content: fullArtifact?.content ?? '',
      status: 'idle',
      saveStatus: 'saved',
      isVisible: true,
      displayMode: 'split',
      boundingBox: {
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
    })
  }, [setArtifact, artifactId, artifactKind, artifactTitle, fullArtifact])

  // Early return for error state is now after the hooks
  if ('error' in result) {
    return (
      <div
        className="h-auto overflow-y-scroll border rounded-2xl dark:bg-muted border-destructive/50 dark:border-destructive/50 p-4 flex flex-row items-start gap-3 text-destructive">
        <WarningIcon className="size-5 shrink-0 mt-0.5"/>
        <div>
          <h4 className="font-bold">Ошибка создания артефакта</h4>
          <p className="text-sm">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full cursor-pointer" ref={hitboxRef} onClick={handleOpenArtifact} role="button"
         tabIndex={0}>
      <ArtifactHeader
        title={artifactTitle as string}
        kind={artifactKind as ArtifactKind}
        description={description as string}
      />
      <div
        className={cn('h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700', { 'p-6': artifactKind !== 'image' })}>
        {(isLoading && !fullArtifact) || (fullArtifact && (!fullArtifact.content || fullArtifact.content === '')) ? <InlineArtifactSkeleton/> :
          artifactKind === 'image' ? <ImageEditor title={artifactTitle as string}
                                                  content={fullArtifact?.content ?? ''} status="idle"
                                                  isInline={true}/> :
            <div className="prose dark:prose-invert prose-sm">
              <p
                className="text-muted-foreground italic">{fullArtifact?.summary || summary || 'Summary is being generated...'}</p>
            </div>
        }
      </div>
      <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100 z-20">
        <FullscreenIcon/>
      </div>
    </div>
  )
}

const ArtifactHeader = memo(({ title, kind, description }: {
  title: string;
  kind: ArtifactKind;
  description: string
}) => {
  const Icon = kind === 'image' ? ImageIcon : kind === 'code' ? CodeIcon : kind === 'sheet' ? BoxIcon : FileIcon
  return (
    <div className="p-4 border rounded-t-2xl flex flex-col gap-2 dark:bg-muted border-b-0 dark:border-zinc-700">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground"><Icon/></div>
        <div className="font-medium">{title}</div>
      </div>
      <p className="text-sm text-muted-foreground ml-9 -mt-2">{description}</p>
    </div>
  )
})
ArtifactHeader.displayName = 'ArtifactHeader'

// END OF: components/artifact-preview.tsx
