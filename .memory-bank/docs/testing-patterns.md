# 🧪 Паттерны Тестирования WelcomeCraft

## HISTORY:
* v1.0.0 (2025-06-15): Создан документ с единообразными подходами к тестированию

---

## 🎯 Цель документа

Этот документ фиксирует единообразные подходы к тестированию в системе WelcomeCraft, основанные на опыте решения проблем с мульти-доменной архитектурой и Auth.js.

---

## 🏗️ Архитектура Тестирования

### 1. API Routes Tests (Unit/Integration)
**Статус:** ✅ Полностью работают (71/71 passed)
**Подход:** Custom test auth middleware

```typescript
// Использование test auth в API routes
import { getTestSession } from '@/lib/test-auth';

// В каждом API route добавлен dual auth:
const session = await auth(); // NextAuth.js
const testSession = await getTestSession(); // Test auth fallback
```

**Ключевые особенности:**
- Использует валидный UUID для PostgreSQL: `"test-user-${timestamp}"`  
- Обходит Auth.js v5 проблемы в тестовой среде
- Поддерживает мульти-доменную архитектуру

### 2. E2E Tests (End-to-End)
**Статус:** ⚠️ Частично работают

#### ✅ Рабочие E2E тесты (используют test auth)
```typescript
// Правильный паттерн E2E теста:
import { setupTestAuth } from '../helpers/auth-helper';

test('My E2E test', async ({ page }) => {
  // 1. Настройка auth через test API
  await setupTestAuth(page, generateTestUser());
  
  // 2. Навигация на защищенную страницу
  await page.goto('/');
  
  // 3. Тестирование функциональности
  await page.getByTestId('chat-input').click();
});
```

**Примеры:** `simple-test.test.ts`, `basic-chat.test.ts`, `auth-test.test.ts`

#### ❌ Проблемные E2E тесты (используют Auth.js)
```typescript
// Устаревший паттерн (НЕ ИСПОЛЬЗОВАТЬ):
await authPage.register(email, password); // Auth.js flow
await page.waitForURL('/'); // Redirect проблемы
```

**Проблемы:** `session.test.ts`, `chat.test.ts`, `artifacts.test.ts`

---

## 🔧 Обязательные Компоненты

### 1. Централизованная Конфигурация
```typescript
// tests/helpers/test-config.ts
export function getTestPort(): number {
  return process.env.PLAYWRIGHT_PORT ? Number(process.env.PLAYWRIGHT_PORT) : 3000;
}

export function getTestUrls() {
  const port = getTestPort();
  return {
    publicBaseUrl: `http://localhost:${port}`,
    adminBaseUrl: `http://app.localhost:${port}`,
  };
}
```

### 2. Test Auth Helper
```typescript
// tests/helpers/auth-helper.ts
export async function setupTestAuth(page: Page, user: TestUser) {
  const response = await page.request.post('/api/test/auth-signin', {
    data: { email: user.email, userId: user.id }
  });
  
  expect(response.ok()).toBeTruthy();
}
```

### 3. Universal Auth System
```typescript
// lib/test-auth.ts
export async function getAuthSession(): Promise<Session | null> {
  const testSession = await getTestSession();
  if (testSession) return testSession;
  return await auth(); // NextAuth.js fallback
}
```

---

## 📐 Правила и Принципы

### DO ✅
1. **Используйте test auth** для всех новых E2E тестов
2. **Централизуйте конфигурацию** портов/доменов
3. **Валидные UUID** для PostgreSQL: `"test-user-${timestamp}"`  
4. **Динамические URL** через `getTestUrls()`
5. **Dual auth support** в API routes
6. **Быстрые тесты** (30-60s vs 2-3min с Auth.js)

### DON'T ❌
1. **Не используйте Auth.js flow** в E2E тестах
2. **Не hardcode порты** (3000, 3001, etc.)
3. **Не полагайтесь на redirect'ы** между доменами
4. **Не создавайте реальных пользователей** в БД для тестов
5. **Не используйте `JSON.parse()`** на уже распарсенных Drizzle данных

---

## 🚀 Миграция Старых Тестов

### Шаги миграции E2E теста с Auth.js на test auth:

1. **Замените AuthPage usage:**
```typescript
// Старый код:
await authPage.register(email, password);
await authPage.login(email, password);

// Новый код:
await setupTestAuth(page, generateTestUser());
```

2. **Добавьте динамические URL:**
```typescript
// Старый код:
expect(chain).toEqual(['http://localhost:3000/']);

// Новый код:
const { publicBaseUrl } = getTestUrls();
expect(chain).toEqual([`${publicBaseUrl}/`]);
```

3. **Уберите redirect ожидания:**
```typescript
// Старый код:
await page.waitForURL('/'); // Может зависнуть

// Новый код:
await expect(page.getByTestId('chat-input')).toBeVisible();
```

---

## 📊 Метрики Производительности

| Тип теста | Время выполнения | Статус |
|-----------|------------------|---------|
| API Routes | 1-5s каждый | ✅ 71/71 |
| E2E с test auth | 30-60s | ✅ Быстрые |
| E2E с Auth.js | 2-3min | ❌ Медленные |

---

## 🔮 Будущие Улучшения

1. **Переписать проблемные E2E тесты** на test auth систему
2. **Стандартизировать mock'и** для AI ответов  
3. **Добавить версионирование артефактов** в тесты
4. **Увеличить покрытие** Redis clipboard функциональности

---

## 📚 Связанные Документы

- `.memory-bank/dev-context.md` - контекст разработки
- `tests/helpers/test-config.ts` - конфигурация тестов
- `lib/test-auth.ts` - система test auth
- `tests/routes/` - примеры API route тестов
- `tests/e2e/basic-chat.test.ts` - пример правильного E2E теста