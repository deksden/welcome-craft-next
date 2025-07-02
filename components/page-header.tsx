/**
 * @file components/page-header.tsx
 * @description Унифицированный компонент заголовка страницы с иконкой, названием, подзаголовком и индикаторами
 * @version 1.0.0
 * @date 2025-07-02
 * @updated Создан для унификации заголовков всех страниц приложения
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): Создан унифицированный компонент PageHeader для стандартизации заголовков страниц
 */

import * as React from 'react'
import { Badge } from '@/components/ui/badge'

interface PageHeaderProps {
  /** Иконка страницы (emoji или React element) */
  icon?: React.ReactNode
  /** Основной заголовок страницы */
  title: string
  /** Описание/подзаголовок страницы */
  description?: string
  /** Дополнительные элементы (кнопки, индикаторы) в правой части */
  actions?: React.ReactNode
  /** Индикаторы статуса, окружения и т.д. */
  badges?: Array<{
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }>
  /** Дополнительная информация под описанием */
  meta?: React.ReactNode
  /** CSS классы для кастомизации */
  className?: string
}

export function PageHeader({
  icon,
  title,
  description,
  actions,
  badges,
  meta,
  className
}: PageHeaderProps) {
  return (
    <header className={`mb-8 ${className || ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title with icon */}
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="flex-shrink-0 text-2xl">
                {typeof icon === 'string' ? (
                  <span className="text-2xl">{icon}</span>
                ) : (
                  icon
                )}
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
          </div>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant || 'secondary'}
                  className={badge.className}
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}

          {/* Meta information */}
          {meta && (
            <div className="mt-3 text-sm text-muted-foreground">
              {meta}
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex-shrink-0 ml-6">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

// Предустановленные варианты для разных типов страниц
export const PageHeaderPresets = {
  /** Заголовок для админских страниц */
  admin: {
    badges: [{ text: 'Admin', variant: 'destructive' as const }]
  },
  
  /** Заголовок для dev-страниц */
  dev: {
    badges: [{ text: 'Dev', variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-800 border-yellow-200' }]
  },
  
  /** Заголовок для beta-функций */
  beta: {
    badges: [{ text: 'Beta', variant: 'secondary' as const }]
  }
}

// END OF: components/page-header.tsx