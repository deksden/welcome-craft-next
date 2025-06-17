# 📚 Auth.js v5 Official Documentation for Testing

**Версия:** 1.0.0  
**Дата:** 2025-06-14  
**Источник:** https://authjs.dev/guides/testing и https://authjs.dev/reference/core/jwt

## 🔗 Официальные ссылки

- **Testing Guide:** https://authjs.dev/guides/testing  
- **JWT Reference:** https://authjs.dev/reference/core/jwt
- **Debugging:** https://authjs.dev/guides/debugging
- **Migration v5:** https://authjs.dev/getting-started/migrating-to-v5

## 🎯 Рекомендуемые подходы для тестирования

### **1. Credentials Provider (для разработки/тестов)**

```typescript
// auth.ts - только для development
if (process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      authorize: (credentials) => {
        if (credentials.password === "password") {
          return {
            email: "bob@alice.com",
            name: "Bob Alice",
            id: "test-user-id"
          }
        }
      },
    })
  )
}
```

**⚠️ Важно:** Строго для development! Не оставлять в production.

### **2. Keycloak OAuth Provider** 

Для production-like тестирования рекомендуется настроить собственный Keycloak instance.

## 🔧 JWT Configuration (Auth.js v5)

### **Ключевые особенности:**

- **Шифрование по умолчанию:** A256CBC-HS512 algorithm
- **AUTH_SECRET:** Используется для шифрования
- **Внутреннее использование:** JWT предназначены для того же приложения

### **Важные функции:**

- `encode()`: Создает JWT
- `decode()`: Декодирует Auth.js JWT  
- `getToken()`: Получает JWT из cookies или Authorization header

### **⚠️ Предупреждение из документации:**

> "This module _will_ be refactored/changed. We do not recommend relying on it right now."

## 📝 Структура Playwright тестов (официальная)

```typescript
test("Basic auth", async ({ page }) => {
  await test.step("should login", async () => {
    // Login steps
    // Verify session details
  })

  await test.step("should logout", async () => {
    // Logout steps  
    // Verify session is null
  })
})
```

## 🚨 Критические замечания

1. **JWT methods не рекомендуются** для server-side auth в v5
2. **Новый API:** `auth()` функция вместо `getServerSession()`
3. **Credentials provider** только для тестов/development
4. **OAuth сложности:** Geographic/IP verification challenges

## 💡 Выводы для нашего проекта

- Использовать Credentials provider для тестов
- Избегать самодельных JWT tokens
- Следовать официальным паттернам тестирования
- Рассмотреть database session approach как альтернативу