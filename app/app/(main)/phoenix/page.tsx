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

      <Card>
        <CardHeader>
          <CardTitle>Welcome to PHOENIX</CardTitle>
          <CardDescription>
            Use the sidebar to navigate to the different admin sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the central dashboard for all administrative tasks.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// END OF: app/app/(main)/phoenix/page.tsx