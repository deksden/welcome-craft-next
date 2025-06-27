# 🧪 Стратегия и Паттерны Тестирования

**Назначение:** Высокоуровневый обзор стратегии тестирования в WelcomeCraft. Этот документ служит отправной точкой и
навигатором по всей документации, связанной с тестированием.

**Версия:** 0.16.0  
**Дата:** 2025-06-26  
**Статус:** THREE-MODE ENVIRONMENT INTEGRATION - Полная интеграция с архитектурой трех режимов работы (Local Dev, Local Prod, Real Prod)

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

**Краткое описание:** ✅ **УНИФИЦИРОВАННАЯ АРХИТЕКТУРА** - Завершена полная унификация аутентификации через единый
`fastAuthentication()` helper для всех E2E тестов и "Direct Cookie Header Pattern" для API тестов.

**Ключевые достижения унификации:**

- **✅ E2E Unified Auth:** Все 8 UC тестов используют `fastAuthentication()` helper
- **✅ Route tests:** 82/82 (100%) с Direct Cookie Header Pattern
- **✅ Deprecated code removal:** Удалены дублированные auth helpers
- **✅ POM Migration:** Все POM классы перенесены в `tests/pages/`
- **✅ Consistent imports:** Унифицированы импорты в E2E тестах

**Performance:**

- ~2-3 секунды на контекст аутентификации
- 100% consistency across all test types

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

**Краткое описание:** Наш подход к UI-тестированию основан на Page Object Model (POM) и строгой системе `data-testid`. Система таймаутов упрощена и адаптирована для двух основных окружений: `local` (для локальной машины разработчика) и `ci` (для GitHub Actions).

**Ключевые принципы:**

- **Simplified Timeout System** — адаптация только для local (15s navigation) и CI (45s navigation) режимов
- **Production-First Testing** — все тесты выполняются против production build (`pnpm build && pnpm start`)
- **Fail-Fast Architecture** — быстрая диагностика проблем UI с правильными timeout'ами
- **System Health Checks** — проверка базовой функциональности
- **POM Patterns** — централизованное управление UI логикой
- **Memory Bank Integration** — использование проверенных селекторов
- **AI Fixtures** — детерминистичные ответы AI моделей в режиме replay

**✅ Завершенная POM Унификация (2025-06-23):**

- **UC-01:** ✅ Использует PublicationPage POM
- **UC-05:** ✅ Обновлен - ChatInputHelpers + прямые селекторы заменены на POM
- **UC-11:** ✅ Полностью переписан с FileImportPage POM
- **UC-02,03,04,06,07:** ✅ Обновлены импорты и аутентификация

**Архитектурные улучшения:**

- ✅ Единый `fastAuthentication()` helper для всех E2E тестов
- ✅ Миграция всех POM в `tests/pages/` директорию
- ✅ Удаление deprecated auth helpers
- ✅ Консистентные импорты и паттерны
- ✅ **Dynamic Timeout System (NEW)** — умная адаптация к производительности компиляции

### Auto-Profile Performance Measurement System (ENHANCED - 2025-06-25)

**Краткое описание:** ✅ **РЕВОЛЮЦИОННАЯ СИСТЕМА** - Enhanced Dynamic Timeout System с автоматическим измерением производительности компиляции в реальном времени и интеллектуальным выбором оптимальных timeout профилей.

**Ключевые достижения:**

- **✅ Real-time Performance Measurement:** Автоматическое измерение времени компиляции каждой страницы
- **✅ Intelligent Profile Selection:** FAST (≤3s), MEDIUM (≤10s), SLOW/EXTRA_SLOW (>10s) профили
- **✅ Adaptive Escalation:** Динамическое повышение timeout'ов при обнаружении медленной компиляции
- **✅ AI Functionality Restoration:** Полное восстановление создания артефактов через AI с adaptive timeouts
- **✅ Context Stability:** Graceful handling browser context destruction в extreme performance scenarios

**Решенные проблемы:**

- **BUG-031 FULLY RESOLVED:** E2E тест artifact editor теперь работает во всех режимах с умной адаптацией
- **Performance variability:** Система подстраивается к реальной производительности в реальном времени
- **AI Creation timeouts:** Восстановлена полная функциональность AI с adaptive timeout management

**Технические компоненты:**

```typescript
// Auto-Profile Measurement в реальном времени
export async function measureCompilationTimeAndSelectProfile(page: any, url: string): Promise<{
  actualTime: number,
  recommendedProfile: 'fast' | 'medium' | 'slow',
  timeoutConfig: TimeoutConfig
}>

// Smart Navigation с автоматическим профилированием
export async function navigateWithAutoProfile(page: any, url: string): Promise<TimeoutConfig>

// Performance-aware navigation в тестах
const autoProfile = await navigateWithAutoProfile(page, '/artifacts')
console.log(`🎯 Auto-profile measurement completed: ${autoProfile.navigation}ms navigation timeout`)
```

**Real Performance Results (DEV mode):**

- **📊 /artifacts:** 7895ms → **MEDIUM profile** (15s navigation timeout)
- **📊 / (AI creation):** 10014ms → **EXTRA_SLOW profile** (45s navigation timeout)  
- **🎯 Adaptive escalation:** Система автоматически повышает timeout'ы при необходимости
- **✅ Test success:** 1 passed (27.0s) - оптимальное время для dev режима

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
pnpm test:e2e          # E2E тесты (16/16) ✅ Unified fastAuthentication()
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
│   ├── e2e-auth.helper.ts  # Unified fastAuthentication()
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
// ✅ UNIFIED: Используй fastAuthentication() helper
import { fastAuthentication } from '../../helpers/e2e-auth.helper'

test.beforeEach(async ({ page }) => {
  await fastAuthentication(page, {
    email: `test-${Date.now()}@playwright.com`,
    id: `test-user-${Date.now().toString().slice(-12)}`
  })

  await page.goto('/')
  console.log('✅ Fast authentication completed via unified helper')
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