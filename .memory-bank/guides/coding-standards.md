# 📋 WelcomeCraft Coding Standards

**Версия:** 3.1.0
**Дата:** 2025-06-30
**Статус:** ✅ АКТУАЛЬНЫЕ СТАНДАРТЫ - Добавлен раздел Best Practices & Implementation Patterns
**Обновлено:** Добавлены архитектурные паттерны реализации из `system-patterns.md` для повышения доступности.

---

## 🎯 Философия разработки

### Ключевые принципы

-   **Итеративность** — небольшие, управляемые итерации с высоким качеством
-   **Простота** — код должен быть максимально простым для решения задачи
-   **Консистентность** — единые стандарты во всем проекте
-   **Документирование** — "Что не документировано, того не существует"
-   **Тестирование** — автоматизированное тестирование для стабильности

### Базовые принципы кодирования

-   **DRY** (Don't Repeat Yourself) — избегать дублирования
-   **SRP** (Single Responsibility Principle) — одна ответственность на функцию/класс
-   **YAGNI** (You Ain't Gonna Need It) — не реализовывать функциональность "на всякий случай"
-   **Избегать преждевременной оптимизации**

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

-   Помечать как `@purpose [ВРЕМЕННЫЙ] - объяснение`
-   Своевременно удалять после завершения работы
-   Всю документацию размещать в `.memory-bank/`

### Окончание файла

В конце каждого файла:

```typescript
// END OF: src/path/to/your/file.ts
```

*(одна пустая строка после комментария)*

---

## ✍️ Стиль кода

### Общие правила

-   **Язык:** TypeScript, ESNext
-   **Стиль:** Standard JavaScript Code Style
-   **Точки с запятой:** НЕ используются
-   **Линтер:** `pnpm lint` — ОБЯЗАТЕЛЬНО проходить без предупреждений

### Неизменяемость данных

-   Входные параметры функций НЕ модифицируются напрямую
-   При необходимости изменения создаются новые объекты/массивы
-   Следовать принципам чистых функций

### Комментарии в коде

-   Использовать JSDoc для всех экспортируемых функций и классов
-   Комментарии должны объяснять "ПОЧЕМУ", а не "ЧТО"
-   Избегать комментирования очевидной логики
-   Добавлять блок `HISTORY` для отслеживания изменений
-   в jsdoc функции обязательно описываем параметры содержательно, и возвращаемые значения
-   В jsdoc функциям обязательно прописать ожидаемое поведение и важные особенности реализации кода!

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

-   `@description` — подробное описание
-   `@param` — для каждого параметра
-   `@returns` — возвращаемое значение
-   `@throws` — возможные ошибки (если есть)

Опциональные теги:

-   `@feature` — специфические особенности
-   `@deterministic` — если функция детерминирована
-   `@deprecated` — если функция устарела

---

## 🧪 Тестирование

### Гибридная стратегия

1.  **Vitest** — юнит-тесты (`tests/unit/`)
2.  **Playwright** — E2E и интеграционные тесты (`tests/e2e/`, `tests/routes/`)

### Юнит-тестирование (Vitest)

-   **Изоляция:** ОБЯЗАТЕЛЬНА для всех внешних зависимостей
-   **Мокирование:** Все внешние зависимости (БД, API, `server-only`) мокировать через `vi.mock()`
-   **Приоритет:** Новую бизнес-логику сначала покрывать юнит-тестами
-   **Запуск:** `pnpm test:unit:watch` для быстрого фидбека

### E2E-тестирование (Playwright) - Железобетонные Тесты

**АРХИТЕКТУРА:** Page Object Model (POM) с fail-fast локаторами

#### Основные принципы Железобетонных Тестов:

1.  **POM для всей UI логики** — вся логика взаимодействия инкапсулирована в Page Objects
2.  **data-testid для всех интерактивных элементов** — строгое правило селекторов
3.  **Fail-fast локаторы с 2-секундным timeout** — быстрое обнаружение проблем
4.  **Декларативный синтаксис** — `authPage.registerUser()` вместо императивных шагов
5.  **Никаких hardcoded URLs** — все URL через конфигурацию

#### Новая иерархическая система testid:

-   `auth-*` — формы аутентификации (email-input, password-input, submit-button)
-   `header-*` — шапка приложения (логотип, новый чат, share, тема, пользователь)
-   `sidebar-*` — боковая панель (чаты, артефакты, управление)
-   `chat-input-*` — зона ввода чата (textarea, send-button, attach-menu)
-   `artifact-*` — панель артефактов (контент, действия, редакторы)

---

## ✨ Best Practices & Implementation Patterns

Этот раздел содержит описание ключевых паттернов реализации, используемых в WelcomeCraft.

### 1. SWR Dialog Rendering Pattern

**Проблема:** Race condition между custom events, которые открывают диалоги (например, `SitePublicationDialog`), и SWR, который асинхронно загружает необходимые для диалога данные.

**Паттерн:**
1.  **Fallback Objects:** Компонент диалога всегда рендерится, но получает "fallback-объект" с дефолтными значениями, пока данные загружаются. Это предотвращает ошибки `cannot read properties of undefined`.
2.  **SWR Retry Logic:** SWR-хук настроен на повторные запросы (`refreshInterval`), пока данные не будут успешно загружены.
3.  **UI Feedback:** Во время загрузки в диалоге отображаются скелетоны или индикаторы загрузки.

```typescript
// Пример реализации
const { data: fullArtifact } = useSWR(
  artifactId ? `/api/artifacts/${artifactId}` : null,
  fetcher,
  { 
    refreshInterval: (data) => !data ? 3000 : 0, // Повторять пока нет данных
  }
)

const fallbackArtifact = { id: '', title: '', ... };

<SitePublicationDialog 
  siteArtifact={fullArtifact || fallbackArtifact} 
/>
```

### 2. Elegant UI Synchronization System

**Проблема:** UI списки (например, список артефактов) не обновляются автоматически после API-операций (создание, удаление) из-за `revalidateOnFocus: false` в SWR.

**Паттерн:** Четырехуровневая система для принудительного, но "элегантного" (без `page.reload()`) обновления UI.
1.  **Global Utils Level (`lib/elegant-refresh-utils.ts`):** `triggerArtifactListRefresh()` отправляет глобальное `window.CustomEvent('artifact-list-refresh')`.
2.  **API Middleware Level (`lib/api-response-middleware.ts`):** `createApiResponseWithRefresh()` добавляет специальные `X-Trigger-Refresh` заголовки в успешные API-ответы.
3.  **React Hook Level (`hooks/use-elegant-artifact-refresh.ts`):** `useElegantArtifactRefresh()` предоставляет компонентам `refreshArtifacts()` функцию.
4.  **Component Integration Level:** Компоненты (например, `ArtifactGridClientWrapper`) слушают `artifact-list-refresh` event и вызывают `mutate()` для SWR.

### 3. Redis Clipboard System

**Проблема:** Необходимо реализовать системный "буфер обмена" для переиспользования артефактов между чатами.

**Паттерн:**
1.  **Server Actions:** `copyArtifactToClipboard()`, `getArtifactFromClipboard()`, `clearArtifactFromClipboard()`.
2.  **Redis:** Ключ `user-clipboard:${userId}` с TTL 60 секунд.
3.  **UX Flow:** Кнопка "Добавить в чат" сохраняет артефакт в Redis. При открытии чата UI проверяет Redis и отображает "черновик" вложения.

### 4. Modern Site Design System (Tilda-style)

**Проблема:** Стандартные HTML-блоки выглядят примитивно. Нужно создать профессиональный и современный дизайн для генерируемых сайтов.

**Паттерн:**
1.  **Visual Hierarchy:** Использование градиентов, разных размеров шрифтов и отступов для создания визуальной иерархии.
2.  **Interactive Elements:** `group-hover` эффекты, плавные `transition-all`, `hover:shadow-lg` для повышения интерактивности.
3.  **Card-Based Design:** Использование карточек для структурирования информации (контакты, ссылки).
4.  **Animation Delights:** Декоративные анимированные "blobs" на фоне для создания динамики.

```css
/* Пример из globals.css */
@keyframes blob {
  '0%': { transform: 'translate(0px, 0px) scale(1)' },
  '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
  '100%': { transform: 'translate(0px, 0px) scale(1)' }
}
```

### 5. Webpack Logs Optimization Pattern

**Проблема:** Встроенные в Next.js `tsconfig-paths` плагины засоряют консоль разработки множеством отладочных логов.

**Паттерн:**
1.  **Multi-Level Suppression:** Подавление логов на нескольких уровнях для максимальной эффективности.
2.  **`next.config.ts`:** Программное нахождение `TsconfigPathsPlugin` и установка ему `logLevel: 'silent'`.
3.  **Environment Variables:** Использование `WEBPACK_LOGGING=false` и `DEBUG=""` для отключения логов.
4.  **Silent Server Script:** Для route-тестов используется `scripts/start-silent-server.sh`, который через `grep -v` отфильтровывает оставшиеся логи.

### 6. Next.js 15 Server Component Compliance Pattern

**Проблема:** Next.js 15 вводит строгие правила для Server Components, включая асинхронные `searchParams` и разделение `server-only` / `client-only` кода.

**Паттерн:**
1.  **Server Components First:** Компоненты по умолчанию являются серверными. `'use client'` добавляется только при необходимости.
2.  **Async `searchParams`:** `searchParams` в Server Components теперь являются `Promise`, который нужно обрабатывать через `await`.
3.  **Client/Server Boundary:** Строгое разделение. `server-only` модули (например, `lib/db/queries.ts`) импортируются только в Server Components. Клиентские компоненты получают данные через props.
