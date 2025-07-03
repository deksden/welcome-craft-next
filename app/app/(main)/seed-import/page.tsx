/**
 * @file app/(main)/seed-import/page.tsx
 * @description Phoenix Seed Import Page with PageHeader unification
 * @version 1.1.0
 * @date 2025-07-02
 * @updated PAGE HEADER UNIFICATION: Добавлен PageHeader компонент с dev/admin badges
 */

/** HISTORY:
 * v1.1.0 (2025-07-02): PAGE HEADER UNIFICATION - Добавлен PageHeader компонент для стандартизации заголовка с dev/admin badges
 * v1.0.0 (2025-06-30): Initial seed import page
 */

import { getAuthSession } from '@/lib/test-auth';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Download } from 'lucide-react';
import { SeedImportTab } from '@/components/phoenix/seed-import-tab';
import { PageHeader, PageHeaderPresets } from '@/components/page-header';

export default async function SeedImportPage() {
  const session = await getAuthSession();

  if (!session || session.user?.type !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Admin privileges required to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Определяем текущее окружение
  const currentEnvironment = process.env.APP_STAGE || 'PROD'

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 space-y-6 max-h-screen overflow-y-auto">
      <PageHeader
        icon={<Download className="size-8 text-green-600" />}
        title="Seed Data Import"
        description="Импорт и управление seed данными для тестовых миров. Загрузка готовых наборов данных из экспортированных seed-директорий."
        badges={[
          ...PageHeaderPresets.dev.badges,
          ...PageHeaderPresets.admin.badges,
          { text: currentEnvironment, variant: 'outline' }
        ]}
        meta="Phoenix System: управление seed данными для тестовых миров"
      />

      <SeedImportTab />
    </div>
  );
}