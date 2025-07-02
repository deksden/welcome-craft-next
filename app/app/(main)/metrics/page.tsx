/**
 * @file app/app/(main)/metrics/page.tsx
 * @description PHOENIX PROJECT - System Metrics Page (simplified routing)
 * @version 2.1.0
 * @date 2025-07-02
 * @updated PAGE HEADER UNIFICATION: Добавлен PageHeader компонент с admin badges и environment indicators
 */

/** HISTORY:
 * v2.1.0 (2025-07-02): PAGE HEADER UNIFICATION - Добавлен PageHeader компонент для стандартизации заголовка с admin badges
 * v2.0.0 (2025-07-01): Simplified routing - убран phoenix/ prefix, убраны ссылки на dashboard, добавлена прокрутка
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана отдельная страница для system metrics
 */

import { Suspense } from 'react'
import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Activity } from 'lucide-react'
import Link from 'next/link'
import { SystemMetricsPanel } from '@/components/phoenix/system-metrics-panel'
import { PageHeader, PageHeaderPresets } from '@/components/page-header'

export const metadata = {
  title: 'System Metrics - PHOENIX Admin Dashboard',
  description: 'Monitor system performance and health metrics'
}

/**
 * Phoenix System Metrics Page
 * 
 * Полноценная страница для мониторинга системы:
 * - Доступна для админов в любом окружении
 * - Требует admin права
 * - Использует существующий SystemMetricsPanel компонент
 * 
 * @feature Enterprise Admin Interface - Sidebar navigation
 * @feature Security - admin rights check
 * @feature System monitoring and analytics
 */
export default async function SystemMetricsPage() {
  // Проверяем аутентификацию
  const session = await getAuthSession()
  
  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please sign in to access System Metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Проверяем права администратора
  const isAdmin = session.user?.type === 'admin'
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Admin privileges required to access System Metrics
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Определяем текущее окружение
  const currentEnvironment = process.env.APP_STAGE || 'PROD'

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 space-y-6 max-h-screen overflow-y-auto">
      <PageHeader
        icon={<Activity className="size-8 text-red-600" />}
        title="System Metrics"
        description="Мониторинг производительности системы, health checks и аналитика использования WelcomeCraft Platform."
        badges={[
          ...PageHeaderPresets.admin.badges,
          { text: currentEnvironment, variant: 'outline' }
        ]}
        meta="Phoenix System: комплексный мониторинг и аналитика"
      />

      {/* System Metrics Component */}
      <Suspense fallback={<MetricsSkeleton />}>
        <SystemMetricsPanel />
      </Suspense>
    </div>
  )
}

// Loading Skeleton
function MetricsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}

// END OF: app/app/(main)/metrics/page.tsx