/**
 * @file site-blocks/key-contacts/index.tsx
 * @description Компонент блока Key Contacts.
 * @version 1.1.0
 * @date 2025-07-02
 * @updated BUG-077 FIX: Removed papaparse import causing server-side errors - replaced with simple CSV parsing
 */

/** HISTORY:
 * v1.1.0 (2025-07-02): BUG-077 FIX: Убран импорт papaparse, который блокировал seed данные от сохранения в UC-10 таблицы
 * v1.0.0 (2025-06-19): Улучшенный дизайн с карточками, иконками и современным layout
 * v0.1.0 (2025-06-12): Initial component.
 */

'use client'

import * as React from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import type { BlockSlotData } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export interface KeyContactsProps {
  contacts?: BlockSlotData
}

export default function KeyContactsBlock ({ contacts }: KeyContactsProps) {
  const { data } = useSWR(
    contacts?.artifactId
      ? `/api/artifact?id=${contacts.artifactId}${contacts.versionTimestamp ? `&versionTimestamp=${contacts.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )

  const contactRows: Array<{ name: string; email?: string; phone?: string }> = React.useMemo(() => {
    const content = Array.isArray(data) ? data.at(-1)?.content : data?.doc.content
    if (content) {
      try {
        // Simple CSV parsing without papaparse to avoid server-side issues
        const rows = content.split('\n').filter((row: string) => row.trim());
        return rows.map((row: string) => {
          const cols = row.split(',').map((col: string) => col.trim());
          return { name: cols[0] || '', email: cols[1] || '', phone: cols[2] || '' };
        });
      } catch (error) {
        console.warn('Error parsing contact data:', error);
        return [];
      }
    }
    return []
  }, [data])

  if (!data && contacts?.artifactId) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            Ключевые контакты
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Свяжитесь с нашей командой для быстрого решения любых вопросов
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactRows.map((contact, index) => (
            <div
              key={contact.email ?? contact.name}
              className="group relative p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-200 dark:hover:border-purple-700"
            >
              {/* Card decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                {/* Avatar placeholder */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                
                {/* Contact info */}
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {contact.name}
                </h3>
                
                {contact.email && (
                  <div className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 text-sm"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a 
                      href={`tel:${contact.phone}`}
                      className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 text-sm"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// END OF: site-blocks/key-contacts/index.tsx
