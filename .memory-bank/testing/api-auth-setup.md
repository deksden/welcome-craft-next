# 🔐 Решение проблемы аутентификации в API тестах

## HISTORY:

* v1.0.0 (2025-06-13): Документация полного решения проблемы аутентификации в Playwright API тестах.

---

## Проблема

API тесты в Playwright не могли пройти аутентификацию, получая 401 ошибки, несмотря на то что пользователи создавались и логинились через браузерный интерфейс.

### Корневая причина
NextAuth.js использует HTTP-only cookies для хранения сессионной информации. При создании API fixtures через браузер:
1. Пользователь создается через тестовый endpoint ✅
2. Пользователь логинится через браузерную форму ✅  
3. NextAuth создает cookies (включая `authjs.session-token`) ✅
4. **НО** API request context НЕ получает эти cookies автоматически ❌

## Решение

### 1. Передача cookies из browser context в API request context

```typescript
// tests/api-fixtures.ts
const cookies = await context.cookies();
const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

// Переопределяем методы для автоматического добавления cookies
authenticatedRequest.get = (url: string, options: any = {}) => {
  return originalGet(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': cookieHeader,
    }
  });
};
```

### 2. Ключевые cookies для NextAuth
- `authjs.session-token` - основной JWT токен сессии
- `authjs.csrf-token` - CSRF защита  
- `authjs.callback-url` - URL для редиректов

### 3. Важные детали реализации

**Domain consistency:** Использовать одинаковый домен для браузера и API:
```typescript
// Было: localhost для API, app.localhost для браузера ❌
// Стало: app.localhost для всего ✅
```

**Force click:** Кнопки могут быть disabled, используем force click:
```typescript
await page.click('[data-testid="auth-submit-button"]', { force: true });
```

**Network idle:** Ждем завершения сетевой активности после логина:
```typescript
await page.waitForLoadState('networkidle', { timeout: 10000 });
```

## Результат

- **До исправления:** 8 passed, 8 failed (401 ошибки аутентификации)
- **После исправления:** 12 passed, 8 failed (проблемы аутентификации решены!)

Оставшиеся 8 failed тестов связаны с логикой API endpoints, а не с аутентификацией.

## Применимость

Это решение применимо для любых NextAuth.js приложений с Playwright API тестами, где нужно:
- Создавать пользователей программно
- Логиниться через браузерный интерфейс  
- Тестировать защищенные API endpoints

## Альтернативные подходы

1. **Прямое создание JWT токенов** - сложнее, требует знания внутренностей NextAuth
2. **Mock authentication** - не тестирует реальный auth flow
3. **Программный логин через API** - требует дополнительных endpoints

Выбранный подход оптимален, так как тестирует реальный flow аутентификации.