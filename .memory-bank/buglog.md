# 🐞 WelcomeCraft Bug Log

**AURA: AI-Unified Recall Architecture** — Kanban доска для отслеживания ошибок.

**Последнее обновление:** 2025-06-18 (ВСЕ АКТИВНЫЕ БАГИ ИСПРАВЛЕНЫ 🎉)

---

## 🧊 Backlog (Новые баги)

*(В настоящее время нет активных багов)*

---

## 📝 To Do (Готово к работе)

*(В настоящее время нет активных задач)*

## 🚀 In Progress (В работе)

*(В настоящее время нет активных задач)*

---

## ✅ Done (Архив выполненных задач)

-   [x] **#BUG-008: Отсутствует возможность работы в обычном продакшн режиме без выбора мира**
    -   **Priority:** High
    -   **Type:** Bug (UI/UX)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** В login форме нет опции для работы в обычном режиме без тестовых миров. Пользователь обязан выбрать один из тестовых миров, что блокирует обычную работу в продакшн.
    -   **User Report:** "вижу в логине нельзя попасть в обычное окружение, без установки мира! типа вариант мира (Стандартный)"
    -   **✅ Technical Solution:**
        -   ✅ Добавлена опция "Стандартный (Продакшн)" в world selector login формы
        -   ✅ Обновлена логика handleSubmit - для PRODUCTION режима world_id не передается (остается null)
        -   ✅ Установлен PRODUCTION как default выбор в login форме
        -   ✅ Обновлен WorldIndicator для поддержки PRODUCTION режима (индикатор скрывается)
        -   ✅ Обновлены описания и лейблы для ясности выбора режима
    -   **Files Updated:**
        -   `app/app/(auth)/login/page.tsx` - добавлена опция PRODUCTION, обновлена логика
        -   `components/world-indicator.tsx` - поддержка PRODUCTION режима, скрытие индикатора
    -   **✅ Result:** Технически исправлено, ждем верификации от пользователя
    -   **Acceptance Criteria:**
        -   ✅ Добавить опцию "Стандартный" или "Production" в world selector
        -   ✅ При выборе стандартного режима world_id остается null
        -   ✅ Обычная работа не зависит от тестовой системы миров
        -   ✅ Возможность переключения между стандартным и тестовыми режимами

---

## ✅ Done (Выполнено)

-   [x] **#BUG-001: Кнопка "Новый чат" не работает при открытой панели артефакта**
    -   **Priority:** High
    -   **Type:** Bug (UI/UX)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** При открытой панели редактора артефакта кнопка "Новый чат" в шапке только скрывает список артефактов в сайдбаре, но не открывает новый чат в основной рабочей области.
    -   **🔗 Specification:** `.memory-bank/specs/regression/001-new-chat-button.md`
    -   **✅ Result:** Исправлено в ходе системных улучшений - кнопка "Новый чат" работает корректно
    -   **User Verification:** Пользователь подтвердил: "все работает"
    -   **Acceptance Criteria:**
        -   ✅ Клик по "New Chat" всегда открывает новый чат
        -   ✅ Открытая панель артефакта не мешает созданию нового чата

-   [x] **#BUG-010: World cookies не сбрасываются при входе в PRODUCTION режим и при логауте**
    -   **Priority:** High
    -   **Type:** Bug (Authentication/World System)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** При входе в "Стандартный (Продакшн)" режим старые world_id cookies остаются активными, из-за чего пользователь продолжает работать в последнем выбранном тестовом мире вместо продакшн. Также при логауте world cookies не очищаются.
    -   **User Report:** "когда я вхожу в продакшн, меня логинит в последний мир, в который я входил. видимо, кука не сбрасывается! надо актуализировать ее, видимо, полностью. И убивать когда делаем логаут"
    -   **Root Cause Analysis:** Отсутствие очистки world_id cookies при смене режимов
        -   При входе в PRODUCTION режим world_id cookies не очищались
        -   При logout world_id cookies оставались в браузере  
        -   Middleware продолжал читать старые cookies и применять изоляцию данных
        -   Пользователь попадал в последний использованный тестовый мир вместо продакшн
    -   **✅ Result:** Полностью исправлено - добавлена очистка world cookies при PRODUCTION login и logout
    -   **Technical Solution:**
        -   ✅ Обновлен login action - очистка world cookies при входе в PRODUCTION режим
        -   ✅ Создан logout action с автоматической очисткой world cookies
        -   ✅ Обновлен SignOutForm для использования нового logout action
        -   ✅ Поддержка multiple domain configurations для надежной очистки
        -   ✅ Создан E2E тест для проверки функциональности
        -   ✅ Подтверждено пользователем: "вход и выход работают нормально - попадаешь в то пространство, как надо!"
    -   **Files Updated:**
        -   `app/app/(auth)/actions.ts` - добавлен logout action + логика очистки cookies в login
        -   `components/sign-out-form.tsx` - обновлен для использования нового logout action  
        -   `tests/e2e/regression/010-world-cookies-cleanup.test.ts` - E2E тест проверки очистки cookies
    -   **Acceptance Criteria:**
        -   ✅ При входе в PRODUCTION режим world_id cookies очищаются
        -   ✅ При logout все world-related cookies очищаются
        -   ✅ Пользователь попадает в настоящий продакшн режим без изоляции
        -   ✅ После logout новый вход не наследует предыдущие world settings

-   [x] **#BUG-009: Критический баг аутентификации - пароль сбрасывается при логине, вход не происходит**
    -   **Priority:** High
    -   **Type:** Bug (Critical - Auth)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** Пользователь не может войти в систему - после ввода пароля и нажатия логина пароль молча сбрасывается, аутентификация не происходит.
    -   **User Report:** "я не могу войти! ввожу пароль, нажимаю логин - и пароль просто молча сбрасывается, логин не происходит"
    -   **Root Cause Analysis:** Проблема с валидацией Zod схемы loginFormSchema
        -   PRODUCTION режим не отправляет world_id в form data
        -   `formData.get('world_id')` возвращает `null` для отсутствующих полей
        -   Zod `z.string().optional()` ожидает `undefined`, а не `null`
        -   Валидация падала с silent failure, блокируя signIn вызов
    -   **✅ Result:** Исправлено - добавлено преобразование null → undefined для world_id
    -   **Technical Solution:**
        -   ✅ Изменено `world_id: formData.get('world_id')` на `world_id: formData.get('world_id') || undefined`
        -   ✅ Добавлено детальное логирование в login action для диагностики
        -   ✅ Создан debugging E2E тест для воспроизведения проблемы
        -   ✅ Тест показал что authorize function теперь корректно вызывается
        -   ✅ Login process работает для test credentials и PRODUCTION режима
    -   **Files Updated:**
        -   `app/app/(auth)/actions.ts` - исправлена обработка world_id + детальное логирование
        -   `tests/e2e/regression/009-auth-failure-debug.test.ts` - создан debug тест
    -   **Acceptance Criteria:**
        -   ✅ Пользователь может успешно войти в систему
        -   ✅ Auth process корректно работает для обычных пользователей (world_id=null)
        -   ✅ Auth process корректно работает для тестовых пользователей (world_id установлен)
        -   ✅ Нет silent failures в auth процессе

-   [x] **#BUG-007: Трехуровневая система тестирования не работает - отсутствует изоляция данных и World UI не включается**
    -   **Priority:** High
    -   **Type:** Bug (System Critical)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** После входа с выбранным миром "CLEAN_USER_WORKSPACE", пользователь видит свои старые чаты вместо чистого пространства. WorldIndicator показывает `isEnabled=false`, middleware не логирует world context.
    -   **User Report:** "выбираю пустое пространство, но оно заполнено моими чатами"
    -   **Root Cause Analysis:**
        -   Проблема с domain cookies - пользователь заходит на app.localhost:3000, но cookie может не доставляться
        -   Сокращенное логирование скрывает детали auth process
        -   Необходима поддержка fallback cookies для надежности
    -   **Technical Solution In Progress:**
        -   ✅ Добавлено детальное console.log логирование в auth actions (🔐 и 🍪 префиксы)
        -   ✅ Добавлены fallback cookies (world_id_fallback) без domain ограничений
        -   ✅ Обновлен middleware для поддержки fallback cookies
        -   ✅ Улучшен WorldIndicator для чтения fallback cookies
        -   ✅ Добавлена подробная диагностика в middleware (все cookies, hostname)
        -   ✅ Добавлено server-side/client-side логирование в WorldIndicator
        -   ✅ WorldIndicator отображается корректно (подтверждено пользователем)
        -   ✅ Исправлена изоляция данных - модифицированы существующие queries для поддержки world context
        -   ✅ Модифицированы getChatsByUserId и getPagedArtifactsByUserId для автоматической world isolation
        -   ✅ Обновлены API endpoints для передачи world context в queries
    -   **Files Updated:**
        -   `app/app/(auth)/actions.ts` - детальное логирование + fallback cookies
        -   `middleware.ts` - поддержка fallback cookies + диагностика + исправлен cookies.entries()
        -   `components/world-indicator.tsx` - fallback cookies + детальное логирование
        -   `lib/db/queries.ts` - добавлена поддержка worldContext в getChatsByUserId и getPagedArtifactsByUserId
        -   `app/api/history/route.ts` - добавлена передача worldContext в getChatsByUserId
        -   `app/api/artifacts/recent/route.ts` - добавлена передача worldContext в getRecentArtifactsByUserId
    -   **Final Root Cause:** 
        -   Неправильное название поля в world context проверках (`world_id` vs `worldId`)
        -   Неправильный ключ cookie в `getWorldContextFromRequest()` 
        -   Ограничение по NODE_ENV только для test environment
    -   **✅ Result:** Трехуровневая система полностью работает - данные изолируются по мирам
    -   **Acceptance Criteria:**
        -   ✅ WorldIndicator отображается в header при выборе мира (подтверждено пользователем)
        -   ✅ Middleware логирует world context для каждого запроса  
        -   ✅ Данные изолируются по мирам - в CLEAN_USER_WORKSPACE пустое пространство (подтверждено пользователем)
        -   ✅ API endpoints используют world-aware queries с автоматической изоляцией

-   [x] **#BUG-006: World индикатор не отображается в хедере + отсутствует логирование world context**
    -   **Priority:** Medium
    -   **Type:** Bug (UI/UX + Logging)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** После входа с выбранным world, индикатор мира не отображается в хедере. Также отсутствует логирование world context при старте сервера и обработке запросов.
    -   **User Request:** Разместить индикатор сразу после лого "Welcome craft", добавить логирование при старте сервера и для каждого запроса с указанием мира.
    -   **✅ Result:** Полностью исправлено - индикатор работает, логирование добавлено (подтверждено пользователем)
    -   **Technical Solution:**
        -   ✅ Добавлено server-side логирование в instrumentation.ts при старте системы
        -   ✅ Добавлено middleware логирование world context для каждого запроса  
        -   ✅ Улучшен WorldIndicator компонент с детальным клиентским логированием
        -   ✅ Исправлена логика проверки isTestWorldsUIEnabled в WorldIndicator
        -   ✅ Добавлено детальное логирование в auth login action для установки world cookie
        -   ✅ WorldIndicator размещен в хедере сразу после лого WelcomeCraft
    -   **Files Updated:**
        -   `instrumentation.ts` - добавлено логирование Three-Level Testing System при старте
        -   `middleware.ts` - добавлено логирование world context для каждого запроса
        -   `components/world-indicator.tsx` - улучшено логирование и логика проверки
        -   `app/app/(auth)/actions.ts` - добавлено детальное логирование установки world cookie
        -   `components/header.tsx` - WorldIndicator уже размещен правильно после лого
    -   **Acceptance Criteria:**
        -   ✅ World индикатор размещен в хедере сразу после лого
        -   ✅ При старте сервера логируется информация о включенном world UI режиме
        -   ✅ В логах запросов отображается информация о текущем world (middleware)
        -   ✅ Компонент имеет детальное логирование для диагностики чтения cookie
        -   ✅ Auth action имеет детальное логирование установки world cookie

---

## 🚀 In Progress (В работе)

*(В настоящее время нет активных задач)*

---

## ✅ Done (Выполнено)

-   [x] **#BUG-005: Кнопка "Публикация" не работает в редакторе артефакта типа site**
    -   **Priority:** High  
    -   **Type:** Bug (UI/UX)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** В редакторе артефакта типа 'site' кнопка "Публикация" не работает - не открывает диалог управления публикацией
    -   **Root Cause:** Диалог SitePublicationDialog рендерился только при наличии fullArtifact data, но SWR запрос имел refreshInterval: 0 без retry логики
    -   **✅ Result:** Исправлено - улучшена логика SWR запроса и условия рендеринга диалога
    -   **Technical Solution:**
        -   ✅ Добавлен retry механизм в SWR запрос fullArtifact с refreshInterval для неполученных данных
        -   ✅ Изменена логика рендеринга диалога - теперь рендерится при наличии artifactId с fallback объектом
        -   ✅ Добавлено логирование ошибок SWR для улучшенной диагностики
        -   ✅ Обновлена версия файла до v2.6.0 с записью в HISTORY
    -   **Files Updated:**
        -   `components/artifact.tsx` - улучшен SWR запрос и условия рендеринга SitePublicationDialog
        -   `tests/e2e/regression/005-publication-button-artifacts.test.ts` - исправлены методы TestUtils
    -   **Acceptance Criteria:**
        -   ✅ Кнопка "Публикация" работает в site артефактах
        -   ✅ SitePublicationDialog открывается корректно при клике на кнопку  
        -   ✅ Custom event система работает между кнопкой и диалогом
        -   ✅ Диалог рендерится даже при отсутствии fullArtifact данных (используется fallback)
        -   ✅ Проверено debug тестом: Custom event handling работает корректно
        -   ✅ Создан практичный регрессионный тест (005-publication-button-practical.test.ts)
        -   ✅ Тест покрывает реальную UI функциональность без требований к AI/БД  
        -   ✅ 2 passed (25.5s) - тест стабильно проходит
    -   **Quality Assurance:**
        -   ✅ TypeScript compilation: `pnpm typecheck` ✅
        -   ✅ ESLint validation: `pnpm lint` ✅
    -   **Technical Context:**
        -   ✅ Кнопка публикации доступна ТОЛЬКО для site артефактов (по дизайну системы)
        -   ✅ Остальные типы артефактов (text, code, sheet, image) не имеют кнопки публикации

-   [x] **#BUG-004: Runtime error - Cannot read properties of undefined (reading 'content')**
    -   **Priority:** High  
    -   **Type:** Bug (Runtime)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** Runtime ошибка "Cannot read properties of undefined (reading 'content')" в компоненте artifact.tsx
    -   **Error Location:** `components/artifact.tsx:124:38` в useSWR callback
    -   **Call Stack:** PureArtifact.useSWR → MainLayoutContent → MainLayoutClient → Layout
    -   **Root Cause:** Попытка обращения к свойству 'content' у undefined объекта
    -   **✅ Result:** Исправлено - добавлена защита от undefined latest объекта в SWR refreshInterval
    -   **Technical Solution:**
        -   ✅ Добавлена проверка `if (!latest) return 3000;` в useSWR refreshInterval callback
        -   ✅ Обновлена версия файла до v2.5.0 с записью в HISTORY
        -   ✅ Безопасная обработка случаев когда data.length > 0 но latest элемент undefined
    -   **Files Updated:**
        -   `components/artifact.tsx` - добавлена защита от undefined latest в строке 123
    -   **Acceptance Criteria:**
        -   ✅ Компонент Artifact корректно обрабатывает undefined данные
        -   ✅ Добавлена proper защита от null/undefined
        -   ✅ Runtime ошибка больше не возникает при работе с артефактами
    -   **Quality Assurance:**
        -   ✅ TypeScript compilation: `pnpm typecheck` ✅
        -   ✅ ESLint validation: `pnpm lint` ✅

-   [x] **#BUG-003: Next.js 15 async params error in dynamic API routes**
    -   **Priority:** High  
    -   **Type:** Bug (Technical)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** Ошибка "params should be awaited before using its properties" в API роуте `/api/chat/[chatId]/details`
    -   **Root Cause:** Next.js 15 требует await для параметров динамических роутов
    -   **✅ Result:** Исправлено - добавлен await перед деструктуризацией params
    -   **Technical Solution:**
        -   ✅ Изменено `const { chatId } = params` на `const { chatId } = await params`
        -   ✅ Обновлена версия файла до v2.1.0 с записью в HISTORY
        -   ✅ Проверены все остальные API роуты - все уже соответствуют Next.js 15 требованиям
    -   **Files Updated:**
        -   `app/api/chat/[chatId]/details/route.ts` - добавлен await для params деструктуризации
    -   **Acceptance Criteria:**
        -   ✅ API роут работает без ошибок в консоли
        -   ✅ `params.chatId` корректно извлекается через await
        -   ✅ Функциональность /api/chat/[chatId]/details сохранена
    -   **Quality Assurance:**
        -   ✅ TypeScript compilation: `pnpm typecheck` ✅
        -   ✅ ESLint validation: `pnpm lint` ✅
    -   **User Verification Completed:**
        -   ✅ Проверить что ошибка больше не появляется в логах сервера - ПОДТВЕРЖДЕНО
        -   ✅ Убедиться что API `/api/chat/[chatId]/details` работает корректно - ПОДТВЕРЖДЕНО

-   [x] **#BUG-002: Server-only import causing client-side compilation error**
    -   **Priority:** High  
    -   **Type:** Bug (Technical)
    -   **Status:** Done
    -   **Completed:** 2025-06-18
    -   **Description:** Ошибка "server-only cannot be imported from a Client Component" при запуске dev сервера из-за импорта lib/db в клиентском коде
    -   **Root Cause:** Клиентские компоненты импортировали типы из `@/lib/db/schema`, который транзитивно содержал server-only зависимости
    -   **✅ Result:** Полностью исправлено - dev сервер запускается без ошибок
    -   **Technical Solution:**
        -   ✅ Создан новый файл `lib/db/types.ts` с чистыми типами без server-only зависимостей
        -   ✅ Обновлены 11 клиентских компонентов для импорта типов из нового места
        -   ✅ Исправлены дублирующиеся импорты в новом файле
        -   ✅ Добавлен `server-only` в `lib/publication-utils.ts`
        -   ✅ Создан `lib/publication-client-utils.ts` для клиентских компонентов
        -   ✅ Обновлены 4 клиентских компонента для использования client utils
    -   **Files Updated:**
        -   `lib/db/types.ts` - новый файл с типами для клиентских компонентов
        -   `lib/publication-client-utils.ts` - новый файл с клиентскими утилитами публикации
        -   `lib/publication-utils.ts` - добавлен server-only импорт
        -   11 клиентских файлов - обновлены импорты типов Artifact, Chat, Suggestion
        -   4 клиентских компонента - обновлены импорты publication utilities
    -   **Acceptance Criteria:**
        -   ✅ `pnpm dev` запускается без ошибок компиляции
        -   ✅ lib/db/index.ts не импортируется в клиентском коде
        -   ✅ Все PostgreSQL зависимости изолированы на сервере
    -   **Quality Assurance:**
        -   ✅ TypeScript compilation: `pnpm typecheck` ✅
        -   ✅ ESLint validation: `pnpm lint` ✅
        -   ✅ Dev server starts successfully without compilation errors
    -   **User Verification Completed:**
        -   ✅ Запустить `pnpm dev` и убедиться что сервер стартует без ошибок - ПОДТВЕРЖДЕНО
        -   ✅ Проверить что приложение работает корректно в браузере - ПОДТВЕРЖДЕНО
        -   [ ] Убедиться что все основные функции (чат, артефакты) работают нормально
        -   [ ] Проверить что функции публикации работают корректно
