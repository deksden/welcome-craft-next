/**
 * @file app/(main)/artifacts/page.tsx
 * @description Server Component страница для артефактов с правильной архитектурой
 * @version 3.2.0
 * @date 2025-06-27
 * @updated Integrated FileImportDemo component for UC-11 E2E tests support
 */

/** HISTORY:
 * v3.2.0 (2025-06-27): Integrated FileImportDemo component for UC-11 E2E tests support
 * v3.1.0 (2025-06-23): Fixed Next.js 15 searchParams promise + correct auth imports
 * v3.0.0 (2025-06-23): Fixed server-only import issues - converted to proper Server Component architecture
 * v2.1.0 (2025-06-11): Refactored to use `useSearchParams` hook.
 * v2.0.0 (2025-06-09): Переименовано в "Артефакты".
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation.js'
import { getAuthSession } from '@/lib/test-auth'
import { ArtifactGridClientWrapper } from '@/components/artifact-grid-client-wrapper'
import { FileImportDemo } from '@/components/file-import-demo'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const skeletonKeys = Array.from({ length: 8 }, (_, i) => `sk-${i}`)

interface ArtifactsPageProps {
  searchParams: Promise<{ openArtifactId?: string }>
}

export default async function ArtifactsPage({ searchParams }: ArtifactsPageProps) {
  const session = await getAuthSession()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const openArtifactId = resolvedSearchParams.openArtifactId

  return (
    <div className="flex h-full overflow-hidden">
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 flex-1 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Мои Артефакты
          </h1>
          <p className="text-muted-foreground">
            Здесь вы можете управлять всеми вашими артефактами: текстами, кодом и другими материалами.
          </p>
        </header>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">📚 Библиотека</TabsTrigger>
            <TabsTrigger value="import">📁 Импорт файлов</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="mt-6">
            <Suspense fallback={<GridSkeleton/>}>
              <ArtifactGridClientWrapper userId={session.user.id} openArtifactId={openArtifactId}/>
            </Suspense>
          </TabsContent>
          
          <TabsContent value="import" className="mt-6">
            <FileImportDemo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function GridSkeleton () {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4"/>
        <Skeleton className="h-10 w-32"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {skeletonKeys.map((key) => (
          <Skeleton key={key} className="h-48 w-full rounded-lg"/>
        ))}
      </div>
      <div className="p-4 flex justify-between items-center">
        <Skeleton className="h-8 w-1/5"/>
        <Skeleton className="h-10 w-1/4"/>
      </div>
    </div>
  )
}

// END OF: app/(main)/artifacts/page.tsx
