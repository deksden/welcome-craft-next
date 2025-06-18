# 👨‍💻 Контекст Текущей Разработки

**Версия:** 8.0.0  
**Дата:** 2025-06-18  
**Статус:** 🏆 ПОЛНАЯ РЕВИЗИЯ РЕГРЕССИОННЫХ ТЕСТОВ ЗАВЕРШЕНА - вся тестовая методология переработана по принципам Железобетонных Тестов, BUG-009 и BUG-010 успешно воспроизводятся

## HISTORY:
* v8.0.0 (2025-06-18): 🏆 ПОЛНАЯ РЕВИЗИЯ РЕГРЕССИОННЫХ ТЕСТОВ ЗАВЕРШЕНА - все regression тесты переработаны по принципам Железобетонных Тестов, созданы ironclad версии для BUG-009 и BUG-010, старые версии удалены, все тесты проходят и корректно воспроизводят баги
* v7.2.0 (2025-06-18): 🎉 ЖЕЛЕЗОБЕТОННЫЕ ТЕСТЫ УСПЕШНО ЗАВЕРШЕНЫ - исправлен финальный тест BUG-005, world cookie validation работает, баг воспроизводится корректно через POM
* v7.1.0 (2025-06-18): ЖЕЛЕЗОБЕТОННЫЕ ТЕСТЫ ПОЛНОСТЬЮ ИНТЕГРИРОВАНЫ - создан эталонный тест BUG-005 с использованием всей тестовой инфраструктуры (Worlds + POM + AI Fixtures)
* v7.0.0 (2025-06-18): ЖЕЛЕЗОБЕТОННЫЕ ТЕСТЫ РЕАЛИЗОВАНЫ - внедрена революционная POM архитектура с fail-fast локаторами, 15x улучшение скорости обнаружения проблем в тестах
* v6.1.0 (2025-06-18): THREE-LEVEL TESTING SYSTEM ПОЛНОСТЬЮ РАБОТАЕТ - завершены критические баги BUG-006 и BUG-007, изоляция данных по мирам работает корректно
* v6.0.0 (2025-06-18): THREE-LEVEL TESTING SYSTEM IMPLEMENTED - полностью реализована трехуровневая система тестирования с GUI компонентами для входа в миры
* v5.2.0 (2025-06-18): CRITICAL BUG SERIES COMPLETED - завершена серия критических багфиксов включая site publication button (BUG-005), система полностью стабилизирована
* v5.1.0 (2025-06-18): ПОЛНАЯ СТАБИЛИЗАЦИЯ - завершена серия критических багфиксов (server-only, async params, runtime safety), система готова к production
* v5.0.0 (2025-06-17): PUBLICATION SYSTEM ПОЛНОСТЬЮ ЗАВЕРШЕНА - система публичного доступа с TTL и безопасностью полностью реализована
* v4.2.0 (2025-06-17): READ-ONLY MODE ЗАВЕРШЕН - реализован полный режим только для чтения для text, code, sheet и site артефактов
* v4.1.0 (2025-06-17): PUBLICATION SYSTEM UI ЗАВЕРШЕНА - Site Publication UI полностью реализован, TypeScript совместимость исправлена
* v4.0.0 (2025-06-17): PUBLICATION SYSTEM РЕАЛИЗОВАНА - полностью завершена система публикации с TTL, Enhanced Share Dialog, и server actions
* v3.4.0 (2025-06-17): ПОЛНАЯ СТАБИЛИЗАЦИЯ - все критические баги исправлены и подтверждены пользователем, впервые 0 активных задач
* v3.3.0 (2025-06-17): Исправлен критический SSR hydration error - устранены крашы при next-themes mismatch
* v3.2.0 (2025-06-17): Исправлен критический React duplicate keys баг - устранены крашы приложения в sidebar
* v3.1.0 (2025-06-17): Исправлен критический баг с clipboard артефактами - теперь отправляются к AI вместо только UI
* v3.0.0 (2025-06-17): Ревизия Memory Bank, архивирование устаревших данных, актуализация статуса
* v2.0.0 (2025-06-12): Фокус смещен на реализацию генерации сайтов на основе артефактов

## 1. Текущий статус проекта

### ✅ Завершенные архитектурные компоненты
- **Унификация артефактов** — все сущности работают под единой концепцией "Артефакт"
- **Двухуровневая AI архитектура** — Оркестратор + Специалисты полностью реализованы
- **Redis clipboard система** — поведение как у системного буфера обмена
- **Мульти-доменная архитектура** — app.localhost vs localhost корректно работает
- **Site generation система** — полная генерация сайтов из блоков и артефактов
- **Sparse columns БД** — типизированное хранение контента артефактов
- **Visual Site Editor** — современный блочный интерфейс для создания сайтов
- **Clipboard AI Integration** — исправлен критический баг с отправкой clipboard артефактов к AI
- **React Keys Stability** — исправлен критический баг с дублирующимися React keys в sidebar
- **SSR Hydration Stability** — исправлен критический hydration error с next-themes
- **Production-Ready Status** — система полностью стабилизирована, 0 активных багов
- **Publication System** — полная система публикации с TTL для чатов и сайтов реализована
- **Site Publication UI** — визуальный интерфейс для управления публикацией сайтов из панели артефактов
- **Read-Only Mode** — полная реализация режима только для чтения для всех типов артефактов в публичном доступе
- **Security and API Updates** — безопасный публичный доступ к API с проверкой прав и защитой endpoints
- **Runtime Safety Fixes** — исправлены все критические runtime ошибки (server-only imports, async params, undefined content access)
- **Site Publication Button Fix (2025-06-18)** — исправлен критический баг с кнопкой публикации в site артефактах
- **Three-Level Testing System (2025-06-18)** — полностью реализована система Use Cases + Worlds + AI Fixtures для advanced E2E тестирования
- **🏗️ ЖЕЛЕЗОБЕТОННЫЕ ТЕСТЫ (2025-06-18)** — 🏆 ПОЛНАЯ РЕВИЗИЯ РЕГРЕССИОННЫХ ТЕСТОВ ЗАВЕРШЕНА:
  - ✅ POM архитектура: AuthPage, EnhancedArtifactPage с fail-fast локаторами
  - ✅ Worlds система: SITE_READY_FOR_PUBLICATION мир с изоляцией данных
  - ✅ Эталонный тест BUG-005: `005-publication-button-final.test.ts` РАБОТАЕТ ПОЛНОСТЬЮ
  - ✅ Performance: 15x улучшение скорости обнаружения проблем (2s vs 30s timeout)
  - ✅ Testid validation: Реальные селекторы проверены против living manifest
  - ✅ World Cookie Validation: Исправлена проблема с `expect(worldCookie).toBe(true)`
  - ✅ BUG-009 Ironclad Test: `009-auth-failure-ironclad.test.ts` с полной диагностикой аутентификации
  - ✅ BUG-010 Ironclad Test: `010-world-cookies-ironclad.test.ts` успешно воспроизводит баги с cookies (4/4 проходят)
  - ✅ Cleanup завершена: Удалены старые тесты, оставлены только ironclad версии
  - ✅ Production Ready: Все тесты проходят полностью, методология доказана на практике

### ✅ Завершенные компоненты (2025-06-18)
- **Three-Level Testing System Implementation:** Полностью реализована и протестирована продвинутая система тестирования
  - Use Cases спецификации созданы в `.memory-bank/specs/use-cases/` для 5 основных функций WelcomeCraft
  - Worlds system с database isolation через world_id поля во всех таблицах
  - AI Fixtures provider с режимами record/replay/passthrough для детерминистичных тестов
  - GUI Components для работы с мирами: world selector в login page + world indicator в header
  - Cookie-based world context с middleware автоматической фильтрацией данных
  - Обновлены все workflows (WF-01, WF-06) + созданы новые (WF-07, WF-08, WF-09)
  - E2E тесты подтверждают корректную работу GUI компонентов

- **🏗️ ЖЕЛЕЗОБЕТОННЫЕ ТЕСТЫ Implementation:** Кардинальная революция в E2E тестировании с Page Object Model
  - **ФАЗА 1 ЗАВЕРШЕНА:** Модификация test-utils.ts с fail-fast локаторами (timeout 2s vs 30s)
  - **ФАЗА 2 ЗАВЕРШЕНА:** Создание tests/pages/ директории с POM классами (AuthPage готов)
  - **ФАЗА 3 ЗАВЕРШЕНА:** Обновление документации с "Живым манифестом data-testid"
  - **Протестировано на регрессионном тесте:** 005-publication-button-practical.test.ts модифицирован
  - **Обнаружены проблемы:** Несоответствия testid (`chat-input` vs `chat-input-textarea`)
  - **Метрики улучшения:** 15x ускорение обнаружения проблем (2s vs 30s timeout)
  - **Декларативный синтаксис:** `authPage.registerRobust()` vs императивные шаги
  - **Fail-fast принцип:** "❌ FAIL-FAST: Element [testid] not found in 2000ms"
  - **Архитектурная готовность:** AuthPage POM с fallback к API auth для стабильности

- **Site Publication Button Stabilization:** Исправлен критический баг с кнопкой публикации сайтов
  - Улучшена логика SWR запроса fullArtifact с retry механизмом
  - Изменена логика рендеринга SitePublicationDialog с fallback объектом
  - Добавлено error handling и logging для диагностики
  - Устранена зависимость от успешной загрузки fullArtifact данных для рендеринга диалога

### ✅ Завершенные компоненты (2025-06-17)
- **Artifact Display Architecture Unification:** Кардинальное улучшение архитектуры отображения артефактов
  - Заменена система `role: 'data'` на единую tool-invocation архитектуру
  - Устранено дублирование кода в Message компоненте (DRY principle)
  - Артефакты из всех источников (AI, clipboard, file upload) отображаются консистентно
  - Переиспользование ArtifactPreview для всех типов артефактов
- **Sidebar UX Optimization:** Исправлено избыточное поведение recent artifacts в сайдбаре
  - Убрана избыточная навигация на `/artifacts` при клике на recent artifact
  - Теперь только открывается панель редактора артефакта
  - Четкое разделение: recent artifacts для быстрого доступа, "Все артефакты" для полного списка
- **Critical Chat Bug Fix:** Исправлена ошибка "messages must not be empty" при добавлении артефактов
  - Input validation перед отправкой chat requests
  - Clipboard artifact flow без обязательного текста
  - Error prevention в chat API endpoints
- **Site Loading Fix:** Полностью исправлена проблема с пустыми site артефактами
  - Enhanced SWR refresh logic для content и summary polling
  - Site skeleton loading компоненты  
  - Improved loading state detection во всех компонентах
- **Publication System Implementation:** Полная реализация системы публикации с TTL
  - Database schema с publication_state (jsonb) и published_until (timestamp) полями
  - Server actions для publishChat/unpublishChat и publishSite/unpublishSite
  - Publication utilities для проверки статуса публикации и загрузки данных
  - Enhanced Share Dialog с современным UI и поддержкой TTL селекции
  - Badge компоненты для визуального отображения статусов публикации
- **Site Publication UI Implementation:** Завершена полная реализация UI для публикации сайтов
  - SitePublicationDialog с TTL управлением и статус индикаторами
  - Интеграция с artifact system через custom events
  - TypeScript совместимость между ArtifactApiResponse и Artifact типами
  - Site artifact actions с publication кнопкой для GlobeIcon
  - Cross-component коммуникация через window events
- **Read-Only Mode Implementation:** Завершена полная реализация режима только для чтения
  - Обновлен ArtifactContent interface с поддержкой isReadonly prop
  - Text Editor (ProseMirror) поддерживает readonly через editable: () => !isReadonly
  - Code Editor (CodeMirror) поддерживает readonly через EditorState.readOnly.of(true)
  - Spreadsheet Editor отключает editing через renderEditCell: undefined и onRowsChange: undefined
  - Site Editor полностью readonly - отключены все интерактивные действия в BlockCard и ArtifactSlot
  - Artifact.tsx передает isReadonly prop условно рендерящимся ArtifactActions и Toolbar
  - Полная совместимость с TypeScript - 26/26 unit тестов проходят
- **Security and API Updates Implementation:** Завершена реализация безопасного публичного доступа
  - /api/artifact поддерживает неаутентифицированный доступ к опубликованным артефактам  
  - /api/chat/[chatId]/details поддерживает доступ к опубликованным чатам
  - app/site/(hosting)/s/[siteId]/page.tsx проверяет публикацию на сервере для SEO
  - Permission logic: владелец + любой статус / не-владелец + только опубликованные
  - POST/DELETE операции требуют аутентификации для безопасности
  - Полная защита от несанкционированного доступа к приватному контенту

### ⏳ Требует пользовательского тестирования
- **Clipboard Context Fixes (2025-06-17):**
  - DOM-based определение активного чата вместо URL-based
  - Window focus listener для синхронизации clipboard между страницами
  - "Добавить в чат" из панели артефактов
  - Real-time обновление attachment menu

## 2. Ключевые технические решения

### API Артефактов
- **Endpoints доступны глобально:** `/api/artifacts/*` работают на обеих доменах
- **Dual аутентификация:** NextAuth session + test-session fallback
- **Sparse columns:** `content_text`, `content_url`, `content_site_definition`

### Тестирование
- **Route tests:** 71/71 проходят стабильно
- **Unit tests:** 26/26 проходят с Vitest (включая publication utilities)
- **E2E tests:** используют test auth систему для стабильности
- **Custom test auth:** обходит Auth.js v5 сложности

### AI система
- **Sheet generation:** переход на простую генерацию текста (без JSON schema)
- **Timeout защита:** 30 секунд + platform timeout 60 секунд
- **Детальное логирование:** полная наблюдаемость AI операций

## 3. Архитектурные инсайты

### Критические уроки
- **Мульти-доменная архитектура:** Влияет на cookies, аутентификацию и тестирование
- **PostgreSQL + тесты:** Требует валидный UUID формат для test users
- **Promise.race timeout:** Контролировать реальное ожидание данных, не мгновенные вызовы
- **DOM vs URL detection:** DOM-based определение надежнее для SPA
- **AI SDK: setMessages vs append:** `setMessages()` только обновляет UI, `append()` отправляет к AI
- **React Keys Versioning:** Использовать композитный ключ (id + createdAt) для версионируемых сущностей
- **SSR Hydration:** Добавлять suppressHydrationWarning к элементам где theme providers могут добавлять dynamic attributes
- **SWR Safety Patterns:** Всегда проверять не только length массива, но и существование конкретных элементов (array[index] может быть undefined даже при length > 0)
- **Server-only Isolation:** Создавать отдельные type-only файлы для клиента и server-only файлы с утилитами для избежания transitive imports
- **Next.js 15 Async Params:** Все динамические параметры роутов должны ожидаться через await params
- **SWR Conditional Rendering:** Условный рендеринг компонентов не должен полностью зависеть от успешной загрузки данных - использовать fallback объекты для критически важных UI элементов
- **Custom Events + Dialog Rendering:** В React Custom Events системах важно чтобы целевой компонент рендерился независимо от источника данных
- **Playwright World Cookies:** Для стабильной работы world изоляции в тестах необходимо устанавливать cookies ДО аутентификации и проверять их через `authHelper.validateWorldCookie()` вместо `document.cookie.includes()`
- **POM Authentication Fallback:** В мультидоменной архитектуре необходима тройная fallback стратегия: UI auth → API auth → Test session cookie для максимальной стабильности тестов

### Паттерны решений
- **Тестирование:** Test auth система для E2E, NextAuth для production
- **AI стабильность:** `mode: 'tool'` + четкие промпты + platform timeout
- **AI SDK UI patterns:** `append()` для отправки к AI, `setMessages()` для локального UI
- **Clipboard UX:** Custom events + window focus для cross-page синхронизации
- **Artifact Display Unification:** tool-invocation симуляция для консистентного UX независимо от источника артефактов
- **Runtime Safety:** Defensive programming в SWR callbacks с проверкой undefined элементов
- **Client/Server Separation:** Type-only файлы для клиента + server-only утилиты для избежания compilation errors
- **Next.js 15 Compatibility:** Обязательный await для всех dynamic route params
- **SWR Dialog Pattern:** Для диалогов использовать fallback данные вместо блокирования рендеринга + retry logic в SWR для улучшенной надежности
- **Publication System Debugging:** Conditional rendering + custom events требуют логирования ошибок SWR для диагностики проблем
- **Железобетонные Тесты:** POM архитектура + fail-fast локаторы + world изоляция + EnhancedAuthHelper с множественными fallback стратегиями для максимальной стабильности E2E тестов

## 4. Следующие шаги

### Высокий приоритет
- **✅ Система Публикации ПОЛНОСТЬЮ ЗАВЕРШЕНА:** Все компоненты публичного доступа реализованы
  - ✅ Database Schema Foundation (Task #005) - завершено
  - ✅ Helper Utilities (Task #006) - завершено  
  - ✅ Server Actions Implementation (Task #007) - завершено
  - ✅ Enhanced Share Dialog (Task #008) - завершено
  - ✅ Site Publication UI (Task #009) - завершено
  - ✅ Read-Only Mode Implementation (Task #010) - завершено
  - ✅ Security and API Updates (Task #011) - завершено

### Средний приоритет  
- Расширение библиотеки site blocks (FAQ, галерея, формы)
- User analytics dashboard
- Оптимизация E2E тестов (сейчас работают, но медленные)

### Низкий приоритет
- Advanced версионирование UI
- Performance оптимизации

---

> **Ключевая информация:** Система архитектурно завершена и стабильна. Все критические компоненты работают. Фокус на UX улучшениях и новых фичах.