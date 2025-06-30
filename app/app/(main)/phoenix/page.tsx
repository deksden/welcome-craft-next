/**
 * @file app/app/(main)/phoenix/page.tsx
 * @description PHOENIX PROJECT - Admin Dashboard main page (entry point)
 * @version 2.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Рефакторинг от табов к сайдбару
 */

/** HISTORY:
 * v2.0.0 (2025-06-30): Enterprise Admin Interface - убраны табы, теперь главная страница как entry point
 * v1.0.0 (2025-06-29): PHOENIX PROJECT Step 4 - Создание Phoenix Admin Dashboard
 */

import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Flame, 
  AlertCircle,
  CheckCircle,
  Globe,
  Users,
  Activity,
  Shield,
  Download,
  Upload
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'PHOENIX Admin Dashboard - WelcomeCraft',
  description: 'Advanced administration tools for multi-environment architecture and dynamic world management'
}

/**
 * PHOENIX PROJECT Admin Dashboard Entry Point
 * 
 * Главная страница административных инструментов.
 * Теперь навигация осуществляется через сайдбар, эта страница служит приборной панелью.
 * 
 * @feature Enterprise Admin Interface - Navigation через sidebar
 * @feature APP_STAGE-aware functionality
 * @feature Security - admin role check
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
              Admin privileges required to access PHOENIX Admin Dashboard
            </CardDescription>
          </CardHeader>
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
            Enterprise administration tools with sidebar navigation
          </p>
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
              You are in PRODUCTION mode. Some dev tools are limited for security.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dev Tools Section - только для LOCAL/BETA */}
        {isDevEnvironment && (
          <>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="size-5 text-blue-500" />
                  World Management
                </CardTitle>
                <CardDescription>
                  Manage dynamic test worlds and environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/phoenix/worlds">Open World Manager</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="size-5 text-green-500" />
                  Seed Import
                </CardTitle>
                <CardDescription>
                  Import seed data from various sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/phoenix/seed-import">Import Seeds</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="size-5 text-purple-500" />
                  Seed Export
                </CardTitle>
                <CardDescription>
                  Export data from any database source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/phoenix/seed-export">Export Seeds</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Admin Tools Section - для всех окружений */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-orange-500" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage system users and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/phoenix/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-red-500" />
              System Metrics
            </CardTitle>
            <CardDescription>
              Monitor system performance and health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/phoenix/metrics">View Metrics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current environment configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Environment</div>
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

            <div className="space-y-2">
              <div className="text-sm font-medium">Admin Role</div>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  <Shield className="size-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">User</div>
              <div className="text-sm text-muted-foreground">
                {session.user?.email}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// END OF: app/app/(main)/phoenix/page.tsx