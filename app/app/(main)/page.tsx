/**
 * @file app/(main)/page.tsx
 * @description Страница для создания нового чата.
 * @version 1.6.0
 * @date 2025-06-20
 * @updated Исправлен критический баг - заменен несуществующий '/api/auth/guest' на '/login'.
 */

/** HISTORY:
 * v1.6.0 (2025-06-20): Исправлен критический баг BUG-016 - заменен несуществующий '/api/auth/guest' на '/login'.
 * v1.5.1 (2025-06-06): Удален проп `initialVisibilityType`.
 * v1.5.0 (2025-06-06): Удалена логика discussArtifact, чтобы избежать ошибок с searchParams.
 * v1.4.0 (2025-06-06): Добавлен `export const dynamic` для решения проблемы с `searchParams`.
 * v1.3.0 (2025-06-06): Исправлен доступ к searchParams путем деструктуризации из props.
 * v1.2.0 (2025-06-06): Исправлен доступ к searchParams.
 * v1.1.0 (2025-06-05): Добавлена обработка discussArtifact.
 * v1.0.0 (2025-06-05): Начальная версия.
 */

// Удалены неиспользуемые импорты после изменения логики на прямой редирект
import { generateUUID } from '@/lib/utils';
import { getAuthSession } from '@/lib/test-auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const id = generateUUID();

  // Редирект на созданный чат
  redirect(`/chat/${id}`);
}

// END OF: app/(main)/page.tsx
