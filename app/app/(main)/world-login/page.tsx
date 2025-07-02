/**
 * @file app/(main)/world-login/page.tsx
 * @description Страница быстрого переключения между тестовыми мирами для разработчиков
 * @version 1.0.0
 * @date 2025-07-02
 * @updated BUG-072 PROPER FIX: Создана отдельная страница World Login с улучшенным UX
 */

/** HISTORY:
 * v1.0.0 (2025-07-02): BUG-072 PROPER FIX - Создана отдельная страница для World Login с компонентами WorldIndicator и DevWorldSelector
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation.js'
import { getAuthSession } from '@/lib/test-auth'
import { PageHeader, PageHeaderPresets } from '@/components/page-header'
import { WorldIndicator } from '@/components/world-indicator'
import { DevWorldSelector } from '@/components/dev-world-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe } from '@/components/icons'

export default async function WorldLoginPage() {
  const session = await getAuthSession()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Only allow access in LOCAL environment for admins
  const isLocalEnv = process.env.NEXT_PUBLIC_APP_STAGE === 'LOCAL'
  const isAdmin = session.user.type === 'admin'

  if (!isLocalEnv || !isAdmin) {
    redirect('/artifacts')
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 flex-1 overflow-y-auto">
        <PageHeader
          icon={<Globe className="size-8 text-blue-600" />}
          title="World Login"
          description="Быстрое переключение между тестовыми мирами для разработки и тестирования. Выберите мир для работы с соответствующими данными и пользователями."
          badges={[
            ...PageHeaderPresets.dev.badges,
            { text: 'Admin Only', variant: 'destructive' }
          ]}
          meta="Доступно только администраторам в LOCAL окружении"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current World Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                Текущий мир
              </CardTitle>
              <CardDescription>
                Информация о текущем активном тестовом мире
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<WorldIndicatorSkeleton />}>
                <WorldIndicator />
              </Suspense>
            </CardContent>
          </Card>

          {/* World Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                Переключение миров
              </CardTitle>
              <CardDescription>
                Быстрый вход в различные тестовые миры с предустановленными пользователями
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<WorldSelectorSkeleton />}>
                <div className="flex justify-center">
                  <DevWorldSelector />
                </div>
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Информация о тестовых мирах</CardTitle>
            <CardDescription>
              Описание доступных тестовых окружений
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🧹 Чистое рабочее пространство</h4>
                <p className="text-sm text-muted-foreground">
                  Пустое окружение для тестирования AI-генерации с нуля
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🎯 Готовый сайт</h4>
                <p className="text-sm text-muted-foreground">
                  Окружение с готовым сайтом для тестирования публикации
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">📚 Библиотека контента</h4>
                <p className="text-sm text-muted-foreground">
                  Окружение с артефактами для тестирования переиспользования
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🎬 Демо-среда</h4>
                <p className="text-sm text-muted-foreground">
                  Подготовленная среда для демонстраций и презентаций
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">🏢 Корпоративный онбординг</h4>
                <p className="text-sm text-muted-foreground">
                  Enterprise-уровень с HR данными и многопользовательскими сценариями
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function WorldIndicatorSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function WorldSelectorSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-32 mx-auto" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  )
}

// END OF: app/(main)/world-login/page.tsx