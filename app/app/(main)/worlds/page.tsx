/**
 * @file app/app/(main)/worlds/page.tsx
 * @description PHOENIX PROJECT - World Management Page (simplified routing)
 * @version 2.1.0
 * @date 2025-07-02
 * @updated PAGE HEADER UNIFICATION: Добавлен PageHeader компонент с dev badges и environment indicators
 */

/** HISTORY:
 * v2.1.0 (2025-07-02): PAGE HEADER UNIFICATION - Добавлен PageHeader компонент для стандартизации заголовка, dev badges, environment indicators
 * v2.0.0 (2025-07-01): Simplified routing - убран phoenix/ prefix, убраны ссылки на dashboard
 * v1.0.0 (2025-06-30): Enterprise Admin Interface - создана отдельная страница для world management
 */

import { getAuthSession } from '@/lib/test-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Globe } from 'lucide-react'
import Link from 'next/link'
import { WorldManagementPanel } from '@/components/phoenix/world-management-panel'
import { PageHeader, PageHeaderPresets } from '@/components/page-header'

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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 space-y-6 max-h-screen overflow-y-auto">
      <PageHeader
        icon={<Globe className="size-8 text-blue-600" />}
        title="World Management"
        description="Управление динамическими тестовыми мирами и окружениями для разработки и тестирования системы."
        badges={[
          ...PageHeaderPresets.dev.badges,
          { text: currentEnvironment, variant: 'secondary' }
        ]}
        meta="Доступно только администраторам в DEV окружениях (LOCAL/BETA)"
      />

      {/* World Management Component */}
      <WorldManagementPanel />
    </div>
  )
}

// END OF: app/app/(main)/phoenix/worlds/page.tsx