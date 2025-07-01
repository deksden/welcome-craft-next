/**
 * @file app/app/(main)/phoenix/worlds/page.tsx
 * @description PHOENIX PROJECT - World Management Page
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Перенесена логика из WorldManagementPanel в отдельную страницу
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана отдельная страница для world management
 */

import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Globe, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { WorldManagementPanel } from '@/components/phoenix/world-management-panel'

export const metadata = {
  title: 'World Management - PHOENIX Admin Dashboard',
  description: 'Manage dynamic test worlds and environments'
}

/**
 * Phoenix World Management Page
 * 
 * Полноценная страница для управления динамическими мирами:
 * - Только для dev окружений (LOCAL/BETA)
 * - Требует admin права
 * - Использует существующий WorldManagementPanel компонент
 * 
 * @feature Enterprise Admin Interface - Sidebar navigation
 * @feature Security - admin + dev environment checks
 * @feature Dynamic world management
 */
export default async function WorldManagementPage() {
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
              Please sign in to access World Management
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
              Admin privileges required to access World Management
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Проверяем dev окружение
  const currentEnvironment = process.env.APP_STAGE || 'PROD'
  const isDevEnvironment = currentEnvironment === 'LOCAL' || currentEnvironment === 'BETA'
  
  if (!isDevEnvironment) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              Dev Environment Required
            </CardTitle>
            <CardDescription>
              World Management is only available in LOCAL and BETA environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Current environment: <strong>{currentEnvironment}</strong>
            </p>
            <Button asChild variant="outline">
              <Link href="/phoenix">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Globe className="size-8 text-blue-500" />
            <h1 className="text-3xl font-bold">World Management</h1>
            <Badge variant="secondary">{currentEnvironment}</Badge>
          </div>
          <p className="text-muted-foreground">
            Manage dynamic test worlds and environments
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/phoenix">
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* World Management Component */}
      <WorldManagementPanel />
    </div>
  )
}

// END OF: app/app/(main)/phoenix/worlds/page.tsx