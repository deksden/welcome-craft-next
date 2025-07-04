/**
 * @file components/image-editor.tsx
 * @description Компонент для отображения артефакта-изображения.
 * @version 1.3.1
 * @date 2025-06-11
 * @updated Disabled next/image lint rule for dynamic external images.
 */

/** HISTORY:
 * v1.3.1 (2025-06-11): Disabled next/image lint rule as sizes are unknown for external URLs.
 * v1.3.0 (2025-06-11): Added 'use client' directive to resolve useState hook error.
 */
'use client'

import { useState } from 'react'
import { LoaderIcon } from './icons'
import cn from 'classnames'

interface ImageEditorProps {
  title: string;
  content: string; // URL новой картинки
  status: string;
  isInline: boolean;
  mode?: 'edit' | 'diff';
  isCurrentVersion?: boolean;
  getDocumentContentById?: (index: number) => string;
  currentVersionIndex?: number;
}

export function ImageEditor ({
  title,
  content,
  status,
  isInline,
  mode = 'edit',
  isCurrentVersion = true,
  currentVersionIndex = 0,
  getDocumentContentById = () => '',
}: ImageEditorProps) {
  console.log('🔍 [DEBUG] ImageEditor - Props:', {
    title,
    contentLength: content?.length,
    contentPreview: `${content?.substring(0, 100)}...`,
    status,
    isInline,
    mode,
    isValidUrl: content && (content.startsWith('http') || content.startsWith('data:'))
  })
  
  const [sliderValue, setSliderValue] = useState(50)

  const oldContentUrl = (mode === 'diff' && !isCurrentVersion && currentVersionIndex > 0)
    ? getDocumentContentById(currentVersionIndex - 1)
    : null

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('🔍 [DEBUG] ImageEditor - Image load error:', {
      title,
      originalSrc: content,
      error: e.type
    })
    // В случае ошибки загрузки по URL, можно заменить src на плейсхолдер
    e.currentTarget.src = 'https://via.placeholder.com/400x300.png?text=Image+not+found'
  }

  const containerClasses = cn('flex flex-col items-center justify-center w-full relative', {
    'h-[calc(100dvh-60px)] p-4 md:p-20': !isInline,
    'h-[200px]': isInline,
  })

  if (status === 'streaming' && !isInline) {
    return (
      <div className={containerClasses}>
        <div className="flex flex-row gap-4 items-center">
          <div className="animate-spin">
            <LoaderIcon/>
          </div>
          <div>Generating Image...</div>
        </div>
      </div>
    )
  }

  if (mode === 'diff' && oldContentUrl && !isInline) {
    return (
      <div className={containerClasses}>
        <div className="relative w-full max-w-[800px] aspect-auto overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={oldContentUrl}
            alt={`${title} (old version)`}
            className="absolute top-0 left-0 w-full h-auto"
            onError={handleError}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content}
            alt={`${title} (new version)`}
            className="absolute top-0 left-0 w-full h-auto"
            style={{ clipPath: `inset(0 0 0 ${sliderValue}%)` }}
            onError={handleError}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full max-w-[800px] mt-4"
        />
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <picture>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={cn('w-full h-fit max-w-[800px]', {
            'p-0': isInline,
          })}
          src={content}
          alt={title}
          onError={handleError}
        />
      </picture>
    </div>
  )
}

// END OF: components/image-editor.tsx
