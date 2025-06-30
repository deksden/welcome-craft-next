/**
 * @file app/app/(main)/phoenix/metrics/page.tsx
 * @description PHOENIX PROJECT - System Metrics Page
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Перенесена логика из SystemMetricsPanel в отдельную страницу
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана отдельная страница для system metrics
 */

import { Suspense } from 'react'
import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Activity, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SystemMetricsPanel } from '@/components/phoenix/system-metrics-panel'

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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Activity className="size-8 text-red-500" />
            <h1 className="text-3xl font-bold">System Metrics</h1>
            <Badge variant="outline">{currentEnvironment}</Badge>
          </div>
          <p className="text-muted-foreground">
            Monitor system performance and health metrics
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/phoenix">
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

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

// END OF: app/app/(main)/phoenix/metrics/page.tsx