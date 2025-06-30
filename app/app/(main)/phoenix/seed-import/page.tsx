/**
 * @file app/app/(main)/phoenix/seed-import/page.tsx
 * @description PHOENIX PROJECT - Seed Import Page
 * @version 1.0.0
 * @date 2025-06-30
 * @updated Enterprise Admin Interface - Перенесена логика из SeedImportTab в отдельную страницу
 */

/** HISTORY:
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана отдельная страница для seed import
 */

import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { SeedImportTab } from '@/components/phoenix/seed-import-tab'

export const metadata = {
  title: 'Seed Import - PHOENIX Admin Dashboard',
  description: 'Import seed data with conflict resolution'
}

/**
 * Phoenix Seed Import Page
 * 
 * Полноценная страница для импорта seed данных:
 * - Только для dev окружений (LOCAL/BETA)
 * - Требует admin права
 * - Использует существующий SeedImportTab компонент
 * 
 * @feature Enterprise Admin Interface - Sidebar navigation
 * @feature Security - admin + dev environment checks
 * @feature Seed import with conflict resolution
 */
export default async function SeedImportPage() {
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
              Please sign in to access Seed Import
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
              Admin privileges required to access Seed Import
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
              Seed Import is only available in LOCAL and BETA environments for security reasons
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
            <Download className="size-8 text-green-500" />
            <h1 className="text-3xl font-bold">Seed Import</h1>
          </div>
          <p className="text-muted-foreground">
            Import seed data with advanced conflict resolution
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/phoenix">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Seed Import Component */}
      <SeedImportTab />
    </div>
  )
}

// END OF: app/app/(main)/phoenix/seed-import/page.tsx