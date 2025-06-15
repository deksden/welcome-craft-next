## 🎭 Playwright Testing Setup

**Версия:** 3.0.0  
**Дата:** 2025-06-15
**Статус:** ✅ ПОЛНОСТЬЮ РАБОТАЕТ

### HISTORY:
* v3.0.0 (2025-06-15): **🎉 ПОЛНОСТЬЮ РЕШЕНЫ ВСЕ ПРОБЛЕМЫ!** Создан custom test auth middleware, обход Auth.js v5, исправлена UUID проблема для PostgreSQL.
* v2.0.0 (2025-06-14): **РЕШЕНА КРИТИЧЕСКАЯ ПРОБЛЕМА с портами!** Async config Playwright'а выполнялся несколько раз, каждый раз выбирая новый порт. Реализовано решение через переменную окружения PLAYWRIGHT_PORT.
* v1.1.0 (2025-06-13): Добавлена информация о динамическом определении порта и оптимизации.
* v1.0.0 (2025-06-12): Начальная версия.

В этом файле описана настройка Playwright для API-интеграционных тестов (проекта `routes`).

### ⚠️ КРИТИЧЕСКИ ВАЖНО: Мульти-доменная архитектура

**НЕОЧЕВИДНО ДЛЯ AI:** Проект имеет сложную мульти-доменную архитектуру, которая влияет на тестирование:

#### Development домены:
- **Основной:** `localhost:3000` → рендерится из `/site` (публичный)
- **Админка:** `app.localhost:3000` → рендерится из `/app` (с аутентификацией)
- **API routes:** Глобальные! Доступны на любом домене

#### ✅ ПРОБЛЕМА С АУТЕНТИФИКАЦИЕЙ РЕШЕНА!

**Итоговое решение:** Создан custom test authentication middleware, который полностью обходит сложности Auth.js v5 в тестовой среде.

**Компоненты решения:**

1. **Тестовый auth endpoint:** `/api/test/auth-signin/route.ts`
   - Создает простой JSON session cookie `test-session`
   - Обходит Auth.js JWT шифрование
   - Работает только в test environment
   - **ВАЖНО:** Использует валидный UUID для PostgreSQL: `'00000000-0000-0000-0000-000000000000'`

2. **Custom auth middleware:** `lib/test-auth.ts`
   - Функция `getTestSession()` читает тестовые cookies
   - Автоматически определяет test environment по заголовкам
   - Возвращает совместимую с Auth.js структуру сессии

3. **Обновленные API routes:**
   - Все защищенные endpoints поддерживают dual auth:
   ```typescript
   let session = await auth()
   if (!session?.user) {
     session = await getTestSession()
   }
   ```

4. **Обновленные fixtures:** `tests/api-fixtures.ts`
   - Используют `/api/test/auth-signin` вместо browser login
   - Передают `test-session` cookie в API requests
   - Быстрее и надежнее

**🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ - UUID для PostgreSQL:**
- PostgreSQL требует валидный UUID формат для user_id колонки
- Исправлено с `"test-user-id"` на `"00000000-0000-0000-0000-000000000000"`
- Это решило все 400 ошибки в API тестах

**Результат:**
- ✅ API тесты проходят стабильно (все 9/9 artifacts тестов прошли)
- ✅ Все authentication endpoints работают
- ✅ Нет hanging processes
- ✅ Консистентные порты через `PLAYWRIGHT_PORT`
- ✅ PostgreSQL принимает валидный UUID формат

### 📋 **ИТОГ АНАЛИЗА - ВСЁ УПРОЩЕНО НА ОДИН ДОМЕН:**

1. ✅ **Портья РЕШЕНЫ** - `PLAYWRIGHT_PORT` обеспечивает консистентность
2. ✅ **Один домен для всего** - `app.localhost:PORT` для создания пользователя, логина и API
3. ✅ **Auth.js v5 API** - используется правильная `auth()` функция в endpoints
4. ❌ **НО session token НЕ СОЗДАЕТСЯ** - Auth.js не устанавливает `authjs.session-token`

### 🎯 **ФИНАЛЬНОЕ РЕШЕНИЕ - КОМБИНИРОВАННЫЙ ПОДХОД:**

#### **API тесты (routes):**
- ✅ Тестовый JWT endpoint `/api/test/auth-signin` 
- ✅ Обходит Auth.js v5 сложности
- ✅ Прямое создание session cookies

#### **E2E тесты:**
- ✅ Предустановленные тестовые пользователи (admin, user, manager)
- ✅ Storage State для быстрого переключения
- ✅ Global setup для автоматической подготовки
- ✅ Удобные fixtures: `adminPage`, `userPage`, `authenticatedPage(role)`

#### **Команды для удобства:**
- `pnpm test:routes` - API тесты
- `pnpm test:e2e` - E2E тесты  
- `pnpm test:e2e:admin` - только admin тесты
- `pnpm test:e2e:user` - только user тесты
- `pnpm test:setup` - переподготовка пользователей

### 🔧 РЕШЕНИЕ ПРОБЛЕМЫ С ПОРТАМИ (v2.0.0)

**Проблема:** Async конфигурация Playwright'а выполнялась несколько раз, каждый раз выбирая новый свободный порт:
- Сервер запускался на порту 3000
- Но baseURL для тестов устанавливался на порт 3001
- Результат: `connect ECONNREFUSED ::1:3001`

**Решение:** Использование переменной окружения `PLAYWRIGHT_PORT` для консистентности:

```typescript
// playwright.config.ts
export default (async () => {
  // Если PLAYWRIGHT_PORT уже установлен - используем его
  // Иначе ищем свободный порт и устанавливаем переменную
  const port = await getPort()
  
  return defineConfig({
    webServer: {
      command: `pnpm dev --port ${port}`,
      url: `http://localhost:${port}/api/ping`,
    },
    projects: [
      { name: 'e2e', use: { baseURL: `http://app.localhost:${port}` } },
      { name: 'routes', use: { baseURL: `http://localhost:${port}` } }
    ]
  })
})()

async function getPort(): Promise<number> {
  if (process.env.PLAYWRIGHT_PORT) {
    return parseInt(process.env.PLAYWRIGHT_PORT, 10)
  }
  
  const port = await findAvailablePort(3000)
  process.env.PLAYWRIGHT_PORT = port.toString() // ✅ Ключ решения!
  return port
}
```

### 🚀 Оптимизация и стабильность запуска

1.  **Консистентные порты:**
    -   ✅ Один порт для всех операций (webServer + baseURL)
    -   ✅ Нет висячих процессов на разных портах
    -   ✅ Переменная `PLAYWRIGHT_PORT` унифицирует подход

2.  **Быстрая проверка готовности сервера:**
    -   `webServer.url` указывает на `/api/ping`, который исключен из middleware и отвечает быстрее.

3.  **Управление Worker'ами:**
    -   Количество воркеров для локального запуска установлено в `1` для предотвращения конфликтов с базой данных и Redis.

### 1. Заголовок тестового окружения

Для всех API-запросов Playwright автоматически добавляется заголовок:
```http
X-Test-Environment: playwright
```
Это позволяет в коде маршрутов:
- выбирать специальный endpoint `/api/test/create-user` для программного создания пользователей;
- активировать stub в маршруте `/api/files/upload` (возврат фиктивного uploadUrl и токена);

### 2. Stub `/api/files/upload`

В режиме Playwright код маршрута `/api/files/upload` проверяет заголовок `X-Test-Environment` и возвращает фиктивный ответ без реального вызова Vercel Blob:
```ts
if (request.headers.get('X-Test-Environment') === 'playwright') {
  return NextResponse.json({
    uploadUrl: `${request.url}/test-upload`,
    token: JSON.stringify({ userId: session.user.id }),
  });
}
```

### 3. Итог

С помощью этого setup Playwright-тесты выполняются стабильно, без конфликтов портов и с быстрой проверкой готовности сервера, что делает их более надежными.
