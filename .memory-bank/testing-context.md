# 🧪 `.memory-bank/testing-context.md`: Контекст Тестирования WelcomeCraft

## HISTORY:

* v1.0.0 (2025-06-13): Начальная версия с результатами обновления E2E тестов.

## 1. Статус тестирования

### ✅ Полностью готово:

**API тесты (100% покрытие):**
- Все 9 API endpoints покрыты тестами
- 69 тестовых случаев
- Используют аутентифицированные пользователи через fixtures

**E2E тестовая инфраструктура:**
- Обновлены под AI-first подход WelcomeCraft
- Созданы helper функции для надежного тестирования
- Добавлены data-testid в UI компоненты
- Реализованы Page Object Model и Test Utils

### 🔄 Частично готово:

**E2E тесты:**
- Тесты написаны и обновлены под AI-first подход
- Middleware и аутентификация работают корректно
- **Проблема**: Требуется решение для регистрации тестовых пользователей

## 2. Архитектурные открытия

### Мульти-доменная архитектура
```
Production:
├── welcome-onboard.ru → /site (лэндинг + хостинг)
├── app.welcome-onboard.ru → /app (админка с NextAuth)
└── welcome-onboard.ru/s/[id] → /site (хостинг сайтов)

Development:
├── localhost:3000 → /site (лэндинг + хостинг) 
├── app.localhost:3000 → /app (админка с NextAuth)
└── localhost:3000/s/[id] → /site (хостинг сайтов)
```

### Важные особенности:
- API endpoints `/api/*` доступны глобально
- Middleware контролирует роутинг по доменам
- NextAuth требует серверную аутентификацию
- E2E тесты должны использовать `app.localhost:3000`

## 3. Добавленные надежные селекторы

**Компоненты с data-testid:**
```typescript
// auth-form.tsx
<Input data-testid="auth-email-input" />
<Input data-testid="auth-password-input" />

// submit-button.tsx  
<Button data-testid="auth-submit-button" />

// chat-input.tsx (существующий)
<Textarea data-testid="chat-input" />

// Кнопки отправки
<Button data-testid="send-button" />
<Button data-testid="stop-button" />
```

## 4. Созданные тестовые файлы

### E2E тесты:
- `tests/e2e/chat.test.ts` - обновлен под AI-first (15 тестов)
- `tests/e2e/artifacts.test.ts` - обновлен под AI-first (3 теста)
- `tests/e2e/ai-first-workflow.test.ts` - новый (9 тестов)
- `tests/e2e/site-generation.test.ts` - новый (8 тестов)
- `tests/e2e/basic-chat.test.ts` - диагностический тест

### Helper функции:
- `tests/helpers/ai-mock.ts` - моки AI ответов для WelcomeCraft
- `tests/helpers/test-utils.ts` - утилиты для надежного тестирования
- `tests/helpers/auth-mock.ts` - попытка mock аутентификации

### Обновленная инфраструктура:
- `tests/fixtures.ts` - добавлены TestUtils и AIMockHelper
- `tests/pages/chat.ts` - обновлен с новыми методами
- `tests/pages/artifact.ts` - расширен функциональностью
- `playwright.config.ts` - сокращены таймауты (30с/15с)

## 5. Известные проблемы

### Регистрация пользователей:
- Тесты получают "Failed to create account!" 
- Возможные причины: база данных, валидация, дублирование пользователей
- **Решение**: Нужно настроить тестовую БД или исправить backend

### NextAuth для E2E:
- Mock аутентификация через localStorage не работает
- NextAuth использует серверную проверку через middleware
- **Решение**: Использовать реальную регистрацию или настроить test environment

## 6. Рекомендации для продолжения

### Краткосрочно:
1. Исправить проблему с регистрацией пользователей
2. Настроить тестовую базу данных
3. Запустить полный набор E2E тестов

### Долгосрочно:
1. Добавить data-testid во все критичные UI компоненты
2. Создать mock для NextAuth в test environment
3. Настроить CI/CD pipeline с автоматическими тестами

## 7. Best Practices для UI тестирования

### Надежные селекторы (приоритет):
1. `data-testid` - самый надежный
2. `role` и `aria-label` - семантический доступ
3. `text content` - для стабильного контента
4. `css selectors` - только в крайнем случае

### Паттерны для компонентов:
```typescript
// Хорошо: Семантические data-testid
<Button data-testid="chat-send-button">
<Input data-testid="chat-message-input">  
<div data-testid="artifact-content">

// Избегать: CSS селекторы и позиционные селекторы
.button:nth-child(2)
#some-dynamic-id
```

Тестовая инфраструктура готова к валидации ключевых AI-first сценариев WelcomeCraft!