/**
 * @file components/artifact-grid-display.tsx
 * @description Компонент для отображения артефактов в виде сетки карточек.
 * @version 2.1.0
 * @date 2025-06-20
 * @updated Implemented full pagination controls with Previous/Next buttons and page numbers - BUG-022 fix.
 */

/** HISTORY:
 * v2.1.0 (2025-06-20): Implemented full pagination controls - Previous/Next buttons, page numbers, ellipsis for many pages (BUG-022 fix).
 * v2.0.0 (2025-06-09): Переименован из ContentGridDisplay и адаптирован под новую архитектуру.
 */

'use client'

import type { MouseEvent } from 'react'
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis,
  PaginationItem,
  PaginationLink, 
  PaginationNext,
  PaginationPrevious 
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ArtifactApiResponse } from '@/lib/types'
import { ArtifactCard } from './artifact-card'

const skeletonKeys = Array.from({ length: 4 }, (_, i) => `sk-${i}`)

export interface ArtifactDocument extends Pick<ArtifactApiResponse, 'id' | 'title' | 'createdAt' | 'content' | 'kind' | 'summary'> {}

interface ArtifactGridDisplayProps {
  artifacts: ArtifactDocument[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onCardClick: (doc: ArtifactDocument) => void;
}

function DisabledPaginationLink ({ href, onClick, isDisabled, children, className }: {
  href: string,
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void,
  isDisabled: boolean,
  children: React.ReactNode,
  className?: string
}) {
  return (
    <PaginationLink
      href={href}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault()
          return
        }
        onClick(e)
      }}
      className={cn(className, {
        'pointer-events-none text-muted-foreground': isDisabled,
      })}
      aria-disabled={isDisabled}
    >
      {children}
    </PaginationLink>
  )
}

export function ArtifactGridDisplay ({
  artifacts,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  onCardClick,
}: ArtifactGridDisplayProps) {

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {artifacts.map((doc) => (
          <ArtifactCard key={doc.id} artifact={doc} onRefresh={onRefresh} onCardClick={onCardClick}/>
        ))}
        {isLoading && skeletonKeys.map((key) => (
          <div key={key} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl"/>
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5"/>
              <Skeleton className="h-4 w-2/5"/>
            </div>
          </div>
        ))}
      </div>
      {artifacts.length === 0 && !isLoading && (
        <div className="col-span-full h-48 flex items-center justify-center text-muted-foreground">
          Ничего не найдено. Попробуйте другой поисковый запрос.
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            {/* Previous button */}
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 1) onPageChange(page - 1)
                }}
                className={cn({ 'pointer-events-none opacity-50': page <= 1 })}
              />
            </PaginationItem>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(pageNum)
                    }}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {/* Ellipsis if needed */}
            {totalPages > 5 && page < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Next button */}
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page < totalPages) onPageChange(page + 1)
                }}
                className={cn({ 'pointer-events-none opacity-50': page >= totalPages })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}

// END OF: components/artifact-grid-display.tsx
