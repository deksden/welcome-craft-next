# 📋 WelcomeCraft Coding Standards

**Версия:** 2.3.0  
**Дата:** 2025-06-28  
**Источники:** dev-rules.md, docs/RULEZZ.md
**Обновлено:** Документированы unified cookie patterns - переход к единому test-session источнику для world isolation

---

## 🎯 Философия разработки

### Ключевые принципы

- **Итеративность** — небольшие, управляемые итерации с высоким качеством
- **Простота** — код должен быть максимально простым для решения задачи
- **Консистентность** — единые стандарты во всем проекте
- **Документирование** — "Что не документировано, того не существует"
- **Тестирование** — автоматизированное тестирование для стабильности

### Базовые принципы кодирования

- **DRY** (Don't Repeat Yourself) — избегать дублирования
- **SRP** (Single Responsibility Principle) — одна ответственность на функцию/класс
- **YAGNI** (You Ain't Gonna Need It) — не реализовывать функциональность "на всякий случай"
- **Избегать преждевременной оптимизации**

---

## 📁 Управление файлами

### Обязательная шапка файла

Каждый создаваемый файл ДОЛЖЕН содержать блок метаданных:

```typescript
/**
 * @file path/to/file.ext
 * @description Краткое описание назначения файла.
 * @version X.Y.Z
 * @date YYYY-MM-DD
 * @updated Описание последнего изменения
 */

/** HISTORY:
 * vX.Y.Z (YYYY-MM-DD): Описание изменения
 * vX.Y.W (YYYY-MM-DD): Предыдущее изменение
 */
```

### Временные файлы

- Помечать как `@purpose [ВРЕМЕННЫЙ] - объяснение`
- Своевременно удалять после завершения работы
- Всю документацию размещать в `.memory-bank/`

### Окончание файла

В конце каждого файла:

```typescript
// END OF: src/path/to/your/file.ts

```

*(одна пустая строка после комментария)*

---

## ✍️ Стиль кода

### Общие правила

- **Язык:** TypeScript, ESNext
- **Стиль:** Standard JavaScript Code Style
- **Точки с запятой:** НЕ используются
- **Линтер:** `pnpm lint` — ОБЯЗАТЕЛЬНО проходить без предупреждений

### Неизменяемость данных

- Входные параметры функций НЕ модифицируются напрямую
- При необходимости изменения создаются новые объекты/массивы
- Следовать принципам чистых функций

### Комментарии в коде

- Использовать JSDoc для всех экспортируемых функций и классов
- Комментарии должны объяснять "ПОЧЕМУ", а не "ЧТО"
- Избегать комментирования очевидной логики
- Добавлять блок `HISTORY` для отслеживания изменений
- в jsdoc функции обязательно описываем параметры содержательно, и возвращаемые значения
- В jsdoc функциям обязательно прописать ожидаемое поведение и важные особенности реализации кода!


---

## 📑 Документирование кода (JSDoc)

### Для всех экспортируемых элементов

```typescript
/**
 * @description Подробное описание назначения и поведения
 * @param {string} paramName - Описание параметра
 * @param {number} optionalParam - Опциональный параметр
 * @returns {Promise<ResultType>} Описание возвращаемого значения
 * @throws {CustomError} Описание ошибки и условий возникновения
 * @feature Специфические особенности поведения
 * @deterministic Функция детерминирована (если применимо)
 * @deprecated Устарела, используйте newFunction вместо этой
 */
```

### Документирование функций

Обязательные теги:

- `@description` — подробное описание
- `@param` — для каждого параметра
- `@returns` — возвращаемое значение
- `@throws` — возможные ошибки (если есть)

Опциональные теги:

- `@feature` — специфические особенности
- `@deterministic` — если функция детерминирована
- `@deprecated` — если функция устарела

---

## 🧪 Тестирование

### Гибридная стратегия

1. **Vitest** — юнит-тесты (`tests/unit/`)
2. **Playwright** — E2E и интеграционные тесты (`tests/e2e/`, `tests/routes/`)

### Юнит-тестирование (Vitest)

- **Изоляция:** ОБЯЗАТЕЛЬНА для всех внешних зависимостей
- **Мокирование:** Все внешние зависимости (БД, API, `server-only`) мокировать через `vi.mock()`
- **Приоритет:** Новую бизнес-логику сначала покрывать юнит-тестами
- **Запуск:** `pnpm test:unit:watch` для быстрого фидбека

### E2E-тестирование (Playwright) - ЖЕЛЕЗОБЕТОННЫЕ ТЕСТЫ

**АРХИТЕКТУРА:** Page Object Model (POM) с fail-fast локаторами

#### Основные принципы Железобетонных Тестов:

1. **POM для всей UI логики** — вся логика взаимодействия инкапсулирована в Page Objects
2. **data-testid для всех интерактивных элементов** — строгое правило селекторов
3. **Fail-fast локаторы с 2-секундным timeout** — быстрое обнаружение проблем
4. **Декларативный синтаксис** — `authPage.registerUser()` вместо императивных шагов
5. **Никаких hardcoded URLs** — все URL через конфигурацию

#### Структура тестов:

- **Page Objects:** `tests/pages/` — AuthPage, ChatPage, ArtifactPage
- **Fail-fast утилиты:** `TestUtils.fastLocator()` с timeout 2000ms
- **Регрессионные тесты:** `tests/e2e/regression/` — стабильные сценарии

#### Новая иерархическая система testid:

- `auth-*` — формы аутентификации (email-input, password-input, submit-button)
- `header-*` — шапка приложения (логотип, новый чат, share, тема, пользователь)
- `sidebar-*` — боковая панель (чаты, артефакты, управление)
- `chat-input-*` — зона ввода чата (textarea, send-button, attach-menu)
- `artifact-*` — панель артефактов (контент, действия, редакторы)

#### Пример использования POM (актуальный паттерн):

```typescript
// tests/e2e/use-cases/UC-01-Site-Publication.test.ts
test('Публикация готового сайта через PublicationPage POM', async ({ page }) => {
  const publicationPage = new PublicationPage(page);

  // REAL ASSERTIONS: строгие expect() проверки с консистентными таймаутами
  await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: getExpectTimeout() });
  await expect(publicationPage.publicationButton).toBeVisible({ timeout: getExpectTimeout() });

  // Декларативные POM методы
  await publicationPage.openDialog();
});
```

#### ⚠️ КРИТИЧЕСКОЕ ТРЕБОВАНИЕ: UUID Format для Database IDs

**ОБЯЗАТЕЛЬНОЕ правило:** Все userIds и artifactIds в E2E тестах ДОЛЖНЫ использовать UUID формат.

```typescript
// ❌ НЕПРАВИЛЬНО - приведет к 500 ошибке в API
const userId = `test-user-${Date.now()}`
const artifactId = `test-artifact-${timestamp}`

// ✅ ПРАВИЛЬНО - UUID формат как требует база данных
const { randomUUID } = await import('crypto')
const userId = randomUUID()  // UUID v4 format
const artifactId = randomUUID()  // UUID v4 format

// ✅ Корректный паттерн аутентификации
const timestamp = Date.now()
const { randomUUID } = await import('crypto')
await universalAuthentication(page, {
  email: `test-${timestamp}@playwright.com`,  // Email может содержать timestamp
  id: randomUUID()  // userId ДОЛЖЕН быть UUID
})

// ✅ Корректное создание артефактов
const sitePayload = {
  kind: 'site',
  title: 'Test Site',
  content: JSON.stringify({ theme: 'default', blocks: [] })
}
const response = await page.request.post(`/api/artifact?id=${randomUUID()}`, {
  data: sitePayload
})
```

**Причина требования:**

- `User.id` в schema.ts: `uuid('id').primaryKey()`
- `Artifact.id` в schema.ts: `uuid('id')` с foreign key constraints
- Нарушение формата приводит к PostgreSQL ошибке `invalid input syntax for type uuid`

#### 🔐 ПРАВИЛЬНЫЙ ПОРЯДОК АУТЕНТИФИКАЦИИ В E2E ТЕСТАХ:

**ОБЯЗАТЕЛЬНАЯ последовательность для всех E2E тестов:**

```typescript
// 1. UNIVERSAL AUTHENTICATION - установка session через browser-side fetch
const testUser = {
  email: `test-${Date.now()}@test.com`,
  id: crypto.randomUUID()  // ОБЯЗАТЕЛЬНО UUID формат
}
await universalAuthentication(page, testUser)

// 2. UI AUTHENTICATION VERIFICATION - проверка видимых признаков аутентификации
await assertUIAuthentication(page, { 
  timeout: 10000,
  requireBoth: false // Хотя бы один признак: user avatar ИЛИ artifacts section
})

// 3. MAIN PAGE TESTING - тестирование основной функциональности
// Теперь можно тестировать артефакты, чаты и другую функциональность
```

**Архитектура аутентификации (cookies → headers → navigation):**

1. **Cookies первые** - `page.context().addCookies()` устанавливает test-session
2. **Headers вторые** - `page.setExtraHTTPHeaders()` добавляет `X-Test-Environment: playwright`
3. **Navigation последняя** - `page.goto()` выполняется с правильными cookies/headers

**Критические особенности:**
- `universalAuthentication()` использует browser-side fetch с `credentials: 'same-origin'` 
- `assertUIAuthentication()` проверяет видимые UI признаки (avatar, artifacts section)
- Предпочитать main page testing вместо dependency на collapsed sidebar элементы
- Graceful fallback к `page.reload()` когда elegant refresh не работает в E2E

#### 🔐 UNIFIED COOKIE ARCHITECTURE PATTERN

**Принцип:** Максимальное упрощение cookie системы до единого источника данных.

**НОВЫЙ СТАНДАРТ (v2.3.0):**
```typescript
// ✅ ПРАВИЛЬНО - единый test-session cookie содержит все данные
interface TestSession {
  user: { id: string, email: string, name: string, type: string }
  worldId?: string // Опциональный world isolation
  expires: string
}

// Чтение worldId из единого источника
const testSession = document.cookie
  .split('; ')
  .find(row => row.startsWith('test-session='))

if (testSession) {
  const sessionData = JSON.parse(decodeURIComponent(testSession.split('=')[1]))
  if (sessionData.worldId) {
    const currentWorld = sessionData.worldId
  }
}
```

**УСТАРЕВШИЕ ПАТТЕРНЫ (убраны в v2.3.0):**
```typescript
// ❌ УБРАНО - множественные cookies создавали сложность
const worldId = getCookie('world_id') 
const fallbackWorldId = getCookie('world_id_fallback')
const testWorldId = getCookie('test-world-id')

// ❌ УБРАНО - сложные приоритеты между источниками
const worldId = worldIdCookie || fallbackCookie || testCookie
```

**Правила работы с unified cookies:**
- Используй ТОЛЬКО `test-session` cookie для всех данных (аутентификация + world isolation)
- При создании новых components читай worldId из `test-session.worldId`
- Не создавай отдельные cookies для world data - все в test-session
- Компоненты должны работать gracefully если worldId отсутствует

#### Миграция с legacy UI helpers:

- ❌ **Устарело:** `createUseCaseTest()` — сложная инициализация
- ❌ **Устарело:** `fastAuthentication()` — legacy authentication pattern
- ✅ **Новое:** `test.beforeEach()` + `universalAuthentication()` — унифицированный Playwright pattern
- ❌ **Устарело:** `page.getByRole('button')` — медленные селекторы
- ✅ **Новое:** `page.locator('[data-testid="..."]')` — быстрые data-testid селекторы
- ❌ **Устарело:** Graceful degradation + try-catch обертки
- ✅ **Новое:** Real assertions + строгие expect() проверки + graceful fallback для UI синхронизации

#### 🔄 Graceful Fallback Pattern для UI Синхронизации:

**Паттерн:** Элегантное обновление UI с fallback к page.reload()

```typescript
// Создание артефакта с элегантным refresh
const { createArtifactWithElegantRefresh } = await import('../../helpers/e2e-refresh.helper')
const success = await createArtifactWithElegantRefresh(page, {
  id: testArtifactId,
  kind: 'text', 
  title: 'Test Artifact',
  content: 'Test content'
})

// Проверка видимости с graceful fallback
const testArtifact = page.locator('[data-testid="artifact-card"]')
  .filter({ hasText: 'Test Artifact' })

try {
  await expect(testArtifact).toBeVisible({ timeout: 5000 })
  console.log('✅ Elegant refresh worked')
} catch (error) {
  console.log('⚠️ Falling back to page.reload()...')
  await page.reload()
  await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
  await expect(testArtifact).toBeVisible({ timeout: 10000 })
  console.log('✅ Graceful fallback successful')
}
```

**Принципы Graceful Fallback:**
- Пробуем элегантное решение первым (elegant refresh)
- При неудаче применяем проверенный fallback (page.reload)
- Логируем что происходит для отладки
- Убеждаемся что fallback работает (проверяем header после reload)

---

## 🤖 Качество кода и CI

### Обязательные проверки

**ВСЕГДА** запускать перед коммитом:

```bash
pnpm typecheck && pnpm lint
```

**ЗАПРЕЩЕНО** коммитить код, не проходящий проверки.

### Процесс разработки

1. **Изучить** актуальные документы в `.memory-bank/`
2. **Писать код** по стандартам этого документа
3. **Тестировать** — юнит-тесты для логики, E2E для UI
4. **Проверить** — `pnpm typecheck && pnpm lint`
5. **Документировать** — обновить `.memory-bank/`
6. **Коммитить** — атомарный, логически завершенный коммит

---

## 🏛️ Версионирование

### SemVer для файлов

- **PATCH** (x.y.Z) — исправления ошибок
- **MINOR** (x.Y.z) — новая функциональность (обратно совместимая)
- **MAJOR** (X.y.z) — изменения, нарушающие совместимость

### Правило "Девятки"

`0.9.0` → `0.10.0` (не `1.0.0`)  
Переход на `1.0.0` — осознанное решение о стабильном API

### Независимость версий

Файлы версионируются независимо, версии в шапках отражают состояние конкретного файла.

---

## 🌳 Git и управление версиями

### Ветки

- `main` — стабильная версия
- `feature/X.Y.Z-описание-фичи` — новые фичи
- `fix/X.Y.Z-issue-description` — исправления

### Коммиты

- **Атомарные** и логически завершенные
- **Формат:** `Тип(Область): Краткое описание (#X.Y.Z)`
- **Типы:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

### Pull Requests

Обязательны для всех изменений, требуют ревью.

---

## 🗂️ Документация Memory Bank

### Правила

- Вся документация **только** в `.memory-bank/`
- **ОБЯЗАТЕЛЬНО** поддерживать актуальность
- После архитектурных изменений обновлять соответствующие документы
- При завершении задач обновлять `backlog.md`

### Обновление Memory Bank

После значимых изменений обновлять:

- `dev-context.md` — текущий статус
- `backlog.md` — статус задач
- Архитектурные файлы — при изменении паттернов
- `tech-context.md` — при добавлении технологий

# 🏛️ Столп 1: "Контракт UI" — Гарантия Стабильности Интерфейса

Этот контракт гарантирует, что наш UI предсказуем, тестируем и отделен от логики тестов.

### 1.1. Мандат на `data-testid`

- **Правило:** Каждый интерактивный (`button`, `input`) и каждый критически важный информационный элемент (`div` со
  статусом, toast) **обязан** иметь атрибут `data-testid`.
- **Схема именования:** `{зона}-{компонент}-{описание}` (e.g., `header-new-chat-button`).
- **Связь:** Все `data-testid` регистрируются в "Живом Манифесте UI" (`.memory-bank/testing/ui-testing.md`).

### 1.2. Page Object Model (POM) — Наш "UI API"

- **Правило:** Никаких селекторов (`page.getByTestId(...)`) в файлах тестов (`*.test.ts`). Вся логика взаимодействия с
  UI инкапсулируется в классах POM.
- **Местоположение:** `tests/pages/` и `tests/helpers/`.
- **Процесс:** При создании нового UI-компонента с `data-testid`, **синхронно** создается или обновляется
  соответствующий метод в классе POM.

### 1.3. Спецификации для Сложных Компонентов

- **Правило:** Для нетривиальных компонентов (e.g., `SiteEditor`) создается спецификация.
- **Местоположение:** `.memory-bank/specs/components/`.
- **Содержание:** Описание состояний, сценариев взаимодействия и привязка к тестовому миру (`World`).

# 📜 Столп 2: "Функциональный Контракт" — Гарантия Соответствия Бизнес-Логике

Этот контракт гарантирует, что то, *что* мы создаем, соответствует тому, *что* было задумано.

### 2.1. Принцип "Use Case First"

- **Правило:** Разработка любой новой фичи начинается с создания или обновления спецификации в
  `.memory-bank/specs/use-cases/`.
- **Интеграция:** Спецификация должна описывать не только бизнес-логику, но и задействованные элементы UI (ссылаясь на
  их `data-testid`), а также необходимый для теста `World`.

### 2.2. Тест как "Исполняемая Спецификация"

- **Правило:** Для каждой `UC-XX-*.md` спецификации существует соответствующий `UC-XX-*.test.ts` файл, шаги которого
  зеркально отражают шаги спецификации.
- **Процесс:** Разработка ведется по циклу RED (пишем провальный тест) -> GREEN (пишем код) -> REFACTOR (улучшаем код).

---

> **Важно:** Эти стандарты обеспечивают качество, читаемость и поддерживаемость кода. Их соблюдение критично для
> эффективной работы команды.