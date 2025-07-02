/**
 * @file site-blocks/useful-links/index.tsx
 * @description Компонент блока Useful Links.
 * @version 1.1.0
 * @date 2025-07-02
 * @updated BUG-077 FIX: Removed papaparse import causing server-side errors - replaced with simple CSV parsing
 */

/** HISTORY:
 * v1.1.0 (2025-07-02): BUG-077 FIX: Убран импорт papaparse, который блокировал seed данные от сохранения в UC-10 таблицы
 * v1.0.0 (2025-06-19): Улучшенный дизайн с интерактивными кнопками, иконками и современным layout
 * v0.1.0 (2025-06-12): Initial component.
 */

'use client'

import * as React from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import type { BlockSlotData } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export interface UsefulLinksProps {
  links?: BlockSlotData
}

export default function UsefulLinksBlock ({ links }: UsefulLinksProps) {
  const { data } = useSWR(
    links?.artifactId
      ? `/api/artifact?id=${links.artifactId}${links.versionTimestamp ? `&versionTimestamp=${links.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )

  const parsedLinks: Array<{ label: string; url: string }> = React.useMemo(() => {
    const content = Array.isArray(data) ? data.at(-1)?.content : data?.doc.content
    if (content) {
      try {
        // Simple CSV parsing without papaparse to avoid server-side issues
        const rows = content.split('\n').filter((row: string) => row.trim());
        return rows.map((row: string) => {
          const cols = row.split(',').map((col: string) => col.trim());
          return { label: cols[0] || '', url: cols[1] || '' };
        });
      } catch (error) {
        console.warn('Error parsing links data:', error);
        return [];
      }
    }
    return []
  }, [data])

  if (!data && links?.artifactId) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Полезные ссылки
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Быстрый доступ к важным ресурсам и инструментам для эффективной работы
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parsedLinks.map((link, index) => (
            <a
              key={link.url}
              href={link.url}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              
              <div className="relative z-10 flex items-center">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {link.url}
                  </p>
                </div>
                
                {/* Arrow */}
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// END OF: site-blocks/useful-links/index.tsx
