/**
 * @file site-blocks/hero/index.tsx
 * @description Базовый React-компонент блока Hero.
 * @version 1.0.0
 * @date 2025-06-19
 * @updated Улучшенный дизайн в стиле современных конструкторов (Tilda-style)
 */

/** HISTORY:
 * v1.0.0 (2025-06-19): Улучшенный дизайн с градиентами, красивой типографикой и современным layout
 * v0.1.0 (2025-06-12): Initial component.
 */

'use client'

import * as React from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import type { BlockSlotData } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export interface HeroBlockProps {
  heading?: BlockSlotData
  subheading?: BlockSlotData
  image?: BlockSlotData
}
export default function HeroBlock ({ heading, subheading, image }: HeroBlockProps) {
  const { data: headingData } = useSWR(
    heading?.artifactId
      ? `/api/artifact?id=${heading.artifactId}${heading.versionTimestamp ? `&versionTimestamp=${heading.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )
  const { data: subheadingData } = useSWR(
    subheading?.artifactId
      ? `/api/artifact?id=${subheading.artifactId}${subheading.versionTimestamp ? `&versionTimestamp=${subheading.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )
  const { data: imageData } = useSWR(
    image?.artifactId
      ? `/api/artifact?id=${image.artifactId}${image.versionTimestamp ? `&versionTimestamp=${image.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )

  const headingContent = Array.isArray(headingData)
    ? headingData.at(-1)?.content
    : headingData?.doc.content
  const subheadingContent = Array.isArray(subheadingData)
    ? subheadingData.at(-1)?.content
    : subheadingData?.doc.content
  const imageUrl = Array.isArray(imageData)
    ? imageData.at(-1)?.content
    : imageData?.doc.content

  return (
    <section className="relative py-16 px-4 md:py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/50 dark:to-purple-900/50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-gray-200/60 dark:bg-grid-gray-700/30 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
      <div className="absolute top-4 left-4 w-72 h-72 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-600/20" />
      <div className="absolute top-4 right-4 w-72 h-72 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-blue-600/20" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-pink-600/20" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {imageUrl ? (
          <div className="mb-8">
            <img 
              src={imageUrl} 
              alt="" 
              className="mx-auto rounded-full shadow-2xl w-32 h-32 md:w-40 md:h-40 object-cover border-4 border-white/50 backdrop-blur-sm" 
            />
          </div>
        ) : image?.artifactId ? (
          <div className="mb-8">
            <Skeleton className="mx-auto rounded-full w-32 h-32 md:w-40 md:h-40" />
          </div>
        ) : null}
        
        {headingContent ? (
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 dark:from-white dark:via-purple-200 dark:to-blue-200 bg-clip-text text-transparent leading-tight">
            {headingContent}
          </h1>
        ) : heading?.artifactId ? (
          <Skeleton className="h-12 md:h-16 lg:h-20 w-full max-w-2xl mx-auto mb-6" />
        ) : null}
        
        {subheadingContent ? (
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
            {subheadingContent}
          </p>
        ) : subheading?.artifactId ? (
          <Skeleton className="h-6 md:h-7 lg:h-8 w-full max-w-xl mx-auto" />
        ) : null}
      </div>
    </section>
  )
}

// END OF: site-blocks/hero/index.tsx
