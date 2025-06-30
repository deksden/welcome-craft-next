/**
 * @file app/app/(main)/phoenix/page.tsx
 * @description PHOENIX PROJECT - Admin Dashboard для управления динамическими мирами
 * @version 1.0.0
 * @date 2025-06-29
 * @updated PHOENIX PROJECT Step 4 - Dev & Admin Tools UI
 */

/** HISTORY:
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 4 - Создание Phoenix Admin Dashboard
 */

import { Suspense } from 'react'
import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Flame, 
  Database, 
  Settings, 
  Globe, 
  Activity, 
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { WorldManagementPanel } from '@/components/phoenix/world-management-panel'
import { EnvironmentStatusPanel } from '@/components/phoenix/environment-status-panel'
import { SystemMetricsPanel } from '@/components/phoenix/system-metrics-panel'

export const metadata = {
  title: 'PHOENIX Admin Dashboard - WelcomeCraft',
  description: 'Advanced administration tools for multi-environment architecture and dynamic world management'
}

/**
 * PHOENIX PROJECT Admin Dashboard
 * 
 * Предоставляет comprehensive административные инструменты для:
 * - Dynamic World Management (создание, редактирование, мониторинг миров)
 * - Environment Status Monitoring (LOCAL/BETA/PROD статус)
 * - System Metrics & Analytics
 * - Database Operations (миграции, cleanup, backup)
 * 
 * @feature PHOENIX PROJECT Step 4 - Enterprise Admin Tools
 * @feature APP_STAGE-aware functionality
 * @feature Real-time monitoring и management
 */
export default async function PhoenixAdminPage() {
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
              Please sign in to access PHOENIX Admin Dashboard
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

  // Определяем текущее окружение
  const currentEnvironment = process.env.APP_STAGE || 'PROD'
  const isDevEnvironment = currentEnvironment === 'LOCAL' || currentEnvironment === 'BETA'

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Flame className="size-8 text-orange-500" />
            <h1 className="text-3xl font-bold">PHOENIX Admin Dashboard</h1>
            <Badge variant={isDevEnvironment ? "secondary" : "default"} className="ml-2">
              {currentEnvironment}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Advanced administration tools for multi-environment architecture
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="size-4 mr-2" />
            Create World
          </Button>
        </div>
      </div>

      {/* Environment Warning for PROD */}
      {currentEnvironment === 'PROD' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="size-5" />
              Production Environment
            </CardTitle>
            <CardDescription className="text-amber-600">
              You are in PRODUCTION mode. World management and dev tools are limited for security.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="worlds" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="worlds" className="flex items-center gap-2">
            <Globe className="size-4" />
            Worlds
          </TabsTrigger>
          <TabsTrigger value="environments" className="flex items-center gap-2">
            <Database className="size-4" />
            Environments
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Activity className="size-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* World Management Tab */}
        <TabsContent value="worlds" className="space-y-4">
          <Suspense fallback={<WorldManagementSkeleton />}>
            <WorldManagementPanel />
          </Suspense>
        </TabsContent>

        {/* Environment Status Tab */}
        <TabsContent value="environments" className="space-y-4">
          <Suspense fallback={<EnvironmentStatusSkeleton />}>
            <EnvironmentStatusPanel />
          </Suspense>
        </TabsContent>

        {/* System Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Suspense fallback={<MetricsSkeleton />}>
            <SystemMetricsPanel />
          </Suspense>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PHOENIX Configuration</CardTitle>
              <CardDescription>
                System-wide settings and configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Current Environment</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentEnvironment}</Badge>
                    {isDevEnvironment && (
                      <CheckCircle className="size-4 text-green-500" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">World Isolation</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isDevEnvironment ? "secondary" : "outline"}>
                      {isDevEnvironment ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Available Actions</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export Configuration
                  </Button>
                  <Button variant="outline" size="sm">
                    View Logs
                  </Button>
                  <Button variant="outline" size="sm">
                    System Health Check
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading Skeletons
function WorldManagementSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 bg-muted rounded-lg animate-pulse" />
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}

function EnvironmentStatusSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

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

// END OF: app/app/(main)/phoenix/page.tsx