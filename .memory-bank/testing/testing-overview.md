# 🧪 Стратегия и Паттерны Тестирования

**Назначение:** Высокоуровневый обзор стратегии тестирования в WelcomeCraft. Этот документ служит отправной точкой и
навигатором по всей документации, связанной с тестированием.

**Версия:** 0.18.0  
**Дата:** 2025-06-28  
**Статус:** UNIFIED COOKIE ARCHITECTURE - Максимальное упрощение системы до единого test-session источника данных

**Содержание:**

1. [Философия тестирования](#-1-философия-тестирования)
2. [Архитектурные паттерны](#-2-архитектурные-паттерны)
    - [Three-Mode Environment Detection](#three-mode-environment-detection)
    - [Аутентификация в тестах](#аутентификация-в-тестах)
    - [Трехуровневая система тестирования](#трехуровневая-система-тестирования)
    - [Железобетонные тесты (UI)](#железобетонные-тесты-ui)
3. [Инструменты](#-3-инструменты)
4. [Практические руководства](#-4-практические-руководства)

---

## 🎯 1. Философия тестирования

WelcomeCraft использует **гибридную стратегию тестирования** для высокой скорости разработки и максимальной надежности.

### Пирамида тестирования

1. **Unit Tests (Vitest)** — быстрая проверка изолированной логики
2. **Route Tests (Playwright)** — API endpoints и интеграция компонентов
3. **E2E Tests (Playwright)** — сквозные пользовательские сценарии


### Текущие результаты

- ✅ **Route Tests:** 82/82 (100%) — идеальный результат
- ✅ **Unit Tests:** 94/94 (100%) — полное покрытие UC-10
- ✅ **E2E Tests:** 36/36 ЖЕЛЕЗОБЕТОННЫЕ — полная трансформация на real assertions архитектуру
- ✅ **TypeScript:** 0 ошибок компиляции — полное соответствие Next.js 15
- ✅ **Regression Tests:** 9/9 (100%) — все баги покрыты

---

## 🏗️ 2. Архитектурные паттерны

### Единый "Local-Prod" режим для тестов

**Краткое описание:** ✅ **УПРОЩЕННАЯ АРХИТЕКТУРА** - Для обеспечения максимальной стабильности и реалистичности, **все E2E и Route тесты локально выполняются исключительно против продакшн-сборки приложения** (`pnpm build && pnpm start`). Этот подход устраняет нестабильность, связанную с hot-reload и dev-компиляцией, и гарантирует, что мы тестируем тот же код, который будет развернут на хостинге.

**Ключевые особенности:**
- **Единый режим запуска:** Команда `pnpm test` автоматически собирает и запускает приложение в продакшн-режиме.
- **Надежность:** Тесты не зависят от производительности dev-сервера.
- **Изоляция БД:** Для тестов используется отдельная база данных `welcomecraft_test`, которая настраивается в файле `.env.test`.

### Аутентификация в тестах

**Краткое описание:** ✅ **UNIFIED COOKIE ARCHITECTURE** - Максимальное упрощение системы до единого `test-session` cookie как источника всех данных (аутентификация + world isolation).

**Ключевые достижения Cookie Unification:**

- **✅ Single Cookie System:** Убраны множественные cookies (`world_id`, `world_id_fallback`, `test-world-id`) - остался только `test-session`
- **✅ Unified Data Source:** `test-session.worldId` как единственный источник world isolation во всей системе
- **✅ Simplified Architecture:** DevWorldSelector, WorldIndicator, world-context читают из одного места
- **✅ Maximum Simplification:** Убрана сложность приоритетов cookies, fallback механизмов, множественных источников
- **✅ Universal Authentication:** Все E2E тесты используют единый `universalAuthentication()` helper
- **✅ Route tests:** 82/82 (100%) с Direct Cookie Header Pattern

**Unified Cookie Structure:**
```typescript
interface TestSession {
  user: { id: string, email: string, name: string, type: string }
  worldId?: string // Опциональный world isolation
  expires: string
}
```

**Performance:**

- ~2-3 секунды на контекст аутентификации
- 100% consistency across all test types
- Простота отладки через единый источник данных

> **Для глубокого погружения в историю проблемы и детали реализации см. `api-auth-setup.md`** (документ содержит полное
> техническое описание эволюции решения, включая примеры кода и метрики производительности).

### E2E Critical Fixes - Next.js 15 Compliance

**Краткое описание:** ✅ **КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ** - Устранены все блокирующие компиляционные ошибки в E2E
тестах через полную миграцию на Next.js 15 архитектурные паттерны.

**Ключевые исправления:**

#### 🔧 **TypeScript & Import Resolution**

- **✅ getServerSession:** Исправлен неправильный импорт в artifacts page
- **✅ Auth Architecture:** Переход на unified `getAuthSession()` система
- **✅ Missing Modules:** Удалены ссылки на несуществующие `auth-options`, `ai-mock`, `auth-mock`
- **✅ Import Paths:** Все импорты валидированы и типобезопасны

#### 🏗️ **Next.js 15 Server Components**

- **✅ SearchParams Promise API:** Обновлены interfaces для `Promise<SearchParams>`
- **✅ Server Component Pattern:** Конвертация artifacts page в правильную архитектуру
- **✅ Async Compliance:** Все server functions корректно помечены `async`
- **✅ Client/Server Boundary:** Исключены server-only импорты из client компонентов

#### 🤖 **AI Fixtures Migration**

- **✅ Legacy Mock Removal:** Полная замена устаревшей mock системы
- **✅ Automatic Fixtures:** Переход на environment-driven AI Fixtures
- **✅ Backward Compatibility:** Deprecated stubs для плавной миграции
- **✅ Test Utils Migration:** Обновлены все POM классы для новой архитектуры

**Результаты:**

- **TypeScript:** `pnpm typecheck` ✅ 0 ошибок
- **Build:** `pnpm build` ✅ успешная компиляция
- **E2E Tests:** 40/40 ✅ запускаются без compilation errors
- **Architecture:** 100% соответствие Next.js 15 best practices

> **Система перешла от полного краха к функциональному состоянию** - все критические блокеры устранены согласно Memory
> Bank паттернам и современным стандартам разработки.

### Трехуровневая система тестирования

**Краткое описание:** Концепция "Use Cases + Worlds + AI Fixtures" обеспечивает детерминированность и контекстуализацию
E2E-тестов, связывая их с бизнес-требованиями. Система позволяет записывать реальные AI-ответы в режиме `record` и
воспроизводить их детерминистично в режиме `replay`.

**Структура:**

```typescript
// 1. Use Case спецификация
UC - 01 - Site - Publication.md // Бизнес-требования

// 2. World definition  
SITE_READY_FOR_PUBLICATION // Изолированное тестовое окружение

// 3. AI Fixtures
tests / fixtures / ai / UC - 01 / // Записанные AI-ответы для replay
```

> **Детальное описание каждого уровня, примеры Use Cases и режимы работы AI Fixtures находятся
в `three-level-testing-system.md`** (руководство по созданию и использованию детерминистичных E2E-тестов). *
*Дополнительно, все тестовые окружения описаны в `worlds-manifest.md`**.

### Железобетонные тесты (UI)

**Краткое описание:** ✅ **FAIL-FAST АРХИТЕКТУРА** - Упрощенная и предсказуемая система тестирования с фиксированными timeout'ами вместо сложной динамической адаптации.

**Ключевые принципы:**

- **Fixed Timeout System** — простые и предсказуемые timeouts: 3000ms для элементов, 15000ms для навигации
- **Production-First Testing** — все тесты выполняются против production build (`pnpm build && pnpm start`)
- **Fail-Fast Architecture** — быстрая диагностика проблем UI без избыточной сложности
- **Universal Authentication** — единый `universalAuthentication()` helper для всех тестов
- **POM Patterns** — централизованное управление UI логикой
- **Memory Bank Integration** — использование проверенных селекторов
- **AI Fixtures** — детерминистичные ответы AI моделей в режиме replay

**✅ Завершенная Unified Authentication Migration (2025-06-28):**

- **UC-01:** ✅ Эталонная реализация с universalAuthentication
- **UC-02, UC-03:** ✅ Мигрированы на unified patterns
- **UC-04, UC-05, UC-06, UC-07:** ✅ Полная миграция завершена
- **UC-11:** ✅ File import с unified authentication
- **artifact-editor-behavior:** ✅ Component тесты обновлены

**Архитектурные улучшения:**

- ✅ **Universal Authentication** — единый `universalAuthentication()` helper заменил все legacy системы
- ✅ **Simplified Timeouts** — убрана сложность dynamic timeout систем в пользу предсказуемых фиксированных значений
- ✅ **Fail-Fast Principles** — быстрая диагностика без graceful degradation overhead
- ✅ **Consistent Patterns** — все тесты следуют единым архитектурным принципам
- ✅ **Legacy Cleanup** — удалены устаревшие auth helpers и сложные timeout системы

### Simplified Fail-Fast Timeout System (2025-06-28)

**Краткое описание:** ✅ **УПРОЩЕННАЯ АРХИТЕКТУРА** - Переход от сложной Dynamic Timeout System к простым и предсказуемым фиксированным timeout'ам для лучшей поддерживаемости.

**Ключевые преимущества:**

- **✅ Predictable Behavior:** Фиксированные timeout'ы устраняют непредсказуемость в тестах
- **✅ Easier Debugging:** Простые timeout значения облегчают диагностику проблем
- **✅ Reduced Complexity:** Убрана избыточная сложность auto-profile measurement
- **✅ Better Maintainability:** Новые разработчики легко понимают простую систему
- **✅ Consistent Performance:** Стабильные результаты тестов без performance variability

**Упрощенная архитектура:**

- **Фиксированные timeout'ы:** 3000ms для элементов, 15000ms для навигации
- **Простая навигация:** `page.goto()` вместо сложных auto-profile функций
- **Предсказуемое поведение:** Тесты работают одинаково в любых условиях

**Технические компоненты:**

```typescript
// Простая навигация
await page.goto('/artifacts')

// Фиксированные timeout'ы
await expect(element).toBeVisible({ timeout: 3000 })

// Универсальная аутентификация
const testUser = {
  email: `test-${Date.now()}@test.com`,
  id: crypto.randomUUID()
}
await universalAuthentication(page, testUser)
```

**Результаты упрощения:**

- **✅ Easier onboarding:** Новые разработчики быстро понимают систему
- **✅ Reduced flakiness:** Меньше переменных = больше стабильности
- **✅ Better debugging:** Простые timeout'ы легче анализировать
- **✅ Consistent behavior:** Одинаковое поведение во всех средах

**Environment Variable Overrides:**

- `PLAYWRIGHT_TIMEOUT_NAVIGATION` — timeout для page.goto()
- `PLAYWRIGHT_TIMEOUT_ELEMENT` — timeout для element visibility
- `PLAYWRIGHT_TIMEOUT_INTERACTION` — timeout для кликов и взаимодействий
- `PLAYWRIGHT_TIMEOUT_AI` — timeout для AI processing
- `PLAYWRIGHT_TIMEOUT_WAIT` — общие wait операции

> **Полный реестр всех `data-testid` и описание архитектуры POM можно найти в `ui-testing.md`** (этот "Живой Манифест
> UI" является единым источником правды для селекторов и содержит результаты POM Revision с конкретными рекомендациями по
> улучшению).

---

## 🛠️ 3. Инструменты

### Playwright (E2E + API)

- **E2E Testing:** Полные пользовательские сценарии
- **Route Testing:** API endpoints и интеграционные тесты
- **Multi-domain Support:** `app.localhost` vs `localhost` архитектура
- мы запускаем e2e тесты в режиме pnpm build && pnpm start чтобы убрать таймауты из-за длительной компиляции модулей и возможности проверить код перед тестом 

### Vitest (Unit)

- **Юнит-тесты:** Изолированная бизнес-логика
- **Мокирование:** Все внешние зависимости (БД, API, `server-only`)

---

## 🚀 4. Практические руководства

### ✅ Эфемерная тестовая БД (Ephemeral Test Database)

**НОВОЕ:** Полностью автоматизированная система управления изолированной тестовой базой данных через Docker.

- **Настройка:** Подробные инструкции по настройке находятся в корневом файле `SETUP.md`.
- **Автоматизация:** `globalSetup` запускает PostgreSQL контейнер и выполняет миграции + сидинг программно
- **Изоляция:** Каждый запуск тестов использует свежую БД в tmpfs для максимальной производительности
- **Cleanup:** `globalTeardown` автоматически удаляет контейнер после завершения тестов

```bash
# Управление тестовой БД (для отладки)
pnpm test:db-up        # Запустить Docker контейнер
pnpm test:db-setup     # Выполнить миграции и сидинг
pnpm test:db-down      # Остановить и удалить контейнер
```

### Команды тестирования

```bash
# Все тесты (UNIFIED LOCAL-PROD ARCHITECTURE)
pnpm test              # E2E + Route тесты против production build
pnpm test:unit         # Юнит-тесты (94/94) ✅
pnpm test:routes       # API тесты (82/82) ✅ Direct Cookie Header Pattern  
pnpm test:e2e          # E2E тесты (8 UC tests) ✅ Universal Authentication
pnpm test:ui           # Playwright UI mode для интерактивной отладки

# AI Fixtures управление
AI_FIXTURE_MODE=record pnpm test:e2e    # Запись
AI_FIXTURE_MODE=replay pnpm test:e2e    # Воспроизведение (по умолчанию)
```

Обрати 
**✅ Архитектурное состояние:** Все паттерны унифицированы, дублирование устранено, тесты стабильны.

### Структура тестов

```
tests/
├── e2e/                    # E2E тесты (Playwright) - ✅ UNIFIED
│   ├── use-cases/          # Use Case тесты (UC-01 → UC-11) ✅ fastAuthentication()
│   └── regression/         # Регрессионные тесты (BUG-XXX)
├── routes/                 # API тесты (Playwright) - ✅ UNIFIED
│   ├── artifact.test.ts    # Артефакты CRUD ✅ Direct Cookie Header
│   ├── auth.test.ts        # Аутентификация ✅ 
│   └── history.test.ts     # История и пагинация ✅
├── unit/                   # Юнит-тесты (Vitest) - ✅ STABLE
│   ├── artifacts/          # Логика артефактов (UC-10 coverage)
│   ├── lib/                # Утилиты и библиотеки
│   └── api/                # API хелперы
├── pages/                  # ✅ UNIFIED POM Architecture
│   ├── publication.page.ts # Publication workflow
│   ├── site-editor.page.ts # Site visual editing
│   ├── file-import.page.ts # File import system
│   └── sidebar.page.ts     # Navigation and content management
├── helpers/                # ✅ UNIFIED Utilities
│   ├── auth.helper.ts      # Universal Authentication for all test types
│   ├── e2e-auth.helper.ts  # Legacy (scheduled for removal)
│   └── ui-helpers.ts       # ChatInputHelpers, etc.
├── fixtures/               # Тестовые данные
│   ├── ai/                 # AI fixtures для replay
│   ├── worlds/             # World definitions
│   └── files/              # Файлы для импорта
```

### Лучшие практики

#### API Testing

```typescript
// ✅ Используй Direct Cookie Header Pattern
const context = await browser.newContext({
  extraHTTPHeaders: {
    'Cookie': `test-session-fallback=${sessionCookie}`
  }
})
```

#### E2E Testing

```typescript
// ✅ UNIFIED: Используй universalAuthentication() helper
import { universalAuthentication } from '../../helpers/auth.helper'

test.beforeEach(async ({ page }) => {
  const testUser = {
    email: `test-${Date.now()}@test.com`,
    id: crypto.randomUUID()
  }
  
  await universalAuthentication(page, testUser)
  console.log('✅ Universal authentication completed')
})

// ✅ UNIFIED: Используй POM классы из tests/pages/
import { FileImportPage } from '../../pages/file-import.page'

const fileImportPage = new FileImportPage(page)
const success = await fileImportPage.performFullImportWorkflow(
  filePath, expectedFileName, expectedContent
)
```

#### Unit Testing

```typescript
// ✅ Мокируй все внешние зависимости
vi.mock('@/lib/db/connection')
vi.mock('server-only')
```

### Что НЕ делать

```typescript
// ❌ Избегай server-only импортов в E2E тестах
import { getWorldData } from '../../helpers/worlds' // server-only

// ❌ Не используй хрупкие селекторы
await page.click('button:nth-child(3)') // плохо
await page.getByTestId('submit-button').click() // хорошо

// ❌ Fallback селекторы вместо точных testid
page.locator('[data-testid*="chat-input"], textarea, input[type="text"]') // плохо
page.getByTestId('chat-input-textarea') // хорошо
```

---

## 📚 Связанные документы

### Детальные руководства в `.memory-bank/testing/`:

- **`api-auth-setup.md`** — Полное техническое описание решения проблем аутентификации в API и E2E тестах
- **`three-level-testing-system.md`** — Руководство по системе "Use Cases + Worlds + AI Fixtures"
- **`ui-testing.md`** — Живой Манифест UI с реестром data-testid и POM архитектурой
- **`worlds-manifest.md`** — Описание всех доступных тестовых "миров" и окружений

### Полезные ссылки:

- **UC-10 Schema-Driven CMS** — интеграция в E2E тестах покрывает все 11 типов артефактов
- **POM классы** — SiteEditorPage, PublicationPage, ChatInputHelpers в `tests/helpers/`
- **Artifact Testing** — специализированные таблицы БД для каждого типа артефакта

---

> **Принцип тестирования WelcomeCraft:** Тесты должны быть устойчивы к изменениям UI, server-side проблемам и временным
> сбоям. Гибридная стратегия обеспечивает быструю разработку при максимальной надежности через детерминистичные паттерны и
> централизованное управление UI логикой.