/**
 * @file app/(main)/import/page.tsx
 * @description Страница импорта файлов как отдельный раздел приложения
 * @version 1.0.0
 * @date 2025-07-02
 * @updated BUG-073 FIX: Создана отдельная страница импорта файлов, вынесенная из табов артефактов
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): BUG-073 FIX - Создана отдельная страница импорта файлов, перенесен FileImportDemo компонент из артефактов/табов
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation.js'
import { getAuthSession } from '@/lib/test-auth'
import { FileImportDemo } from '@/components/file-import-demo'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'

export default async function ImportPage() {
  const session = await getAuthSession()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 flex-1 overflow-y-auto">
        <PageHeader
          icon="📁"
          title="Импорт файлов"
          description="Загрузка и импорт файлов различных форматов в систему артефактов. Поддерживаются документы Word, Excel, CSV, текстовые файлы и изображения."
        />

        <Suspense fallback={<ImportSkeleton />}>
          <FileImportDemo />
        </Suspense>
      </div>
    </div>
  )
}

function ImportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}

// END OF: app/(main)/import/page.tsx