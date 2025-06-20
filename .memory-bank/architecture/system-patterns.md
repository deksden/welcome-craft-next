# 🏛️ `.memory-bank/system-patterns.md`: Системные Паттерны и Архитектура

## HISTORY:

* v4.0.0 (2025-06-19): Добавлена архитектура Modern Site Design System (Tilda-style) и apex domain URL patterns.
* v3.2.0 (2025-06-18): Добавлен архитектурный паттерн SWR Dialog Rendering и исправления publication button.
* v3.1.0 (2025-06-17): Добавлена архитектура Publication System с TTL и UI паттернами.
* v3.0.0 (2025-06-15): Добавлена мультидоменная архитектура и тестирование.
* v2.0.0 (2025-06-12): Добавлены паттерны для генерации сайтов.
* v1.0.0 (2025-06-10): Начальная версия с описанием архитектуры артефактов и AI.

Этот документ описывает ключевые технические решения и паттерны, используемые в проекте "WelcomeCraft".

## 0. Мультидоменная Архитектура

**КРИТИЧНО:** Приложение использует мультидоменную архитектуру для разделения админ-панели и публичного сайта.

### Доменная структура:
- **`app.localhost:port`** - административная панель (основное приложение)
  - Routes: `/app/*` (все запросы на app.localhost переписываются middleware в /app/*)
  - Auth: **ТРЕБУЕТСЯ** аутентификация через NextAuth.js
  - Содержимое: чат, создание артефактов, управление сайтами
  
- **`localhost:port`** - публичный сайт (landing page)
  - Routes: `/site/*` (все запросы на localhost переписываются middleware в /site/*)  
  - Auth: **НЕ ТРЕБУЕТСЯ** - публичный доступ
  - Содержимое: landing page, сгенерированные сайты

### Middleware маршрутизация (`middleware.ts`):
```typescript
// Определение домена админ-панели
const isAppDomain = hostname.startsWith('app.localhost')

if (isAppDomain) {
  // Проверка аутентификации + переписывание в /app/*
  url.pathname = `/app${url.pathname}`
} else {
  // Публичный сайт - переписывание в /site/*
  url.pathname = `/site${url.pathname}`
}
```

### Cookies и аутентификация:
- **Production:** `app.welcome-onboard.ru` vs `welcome-onboard.ru`
- **Development:** `app.localhost:port` vs `localhost:port`  
- **Cookies:** устанавливаются с `domain='.localhost'` для поддержки поддоменов
- **Тестирование:** специальные `test-session` cookies работают через оба домена

### Важные особенности:
1. **API routes глобальные** - доступны с обоих доменов (`/api/*`)
2. **Static файлы общие** - `/_next/*`, `favicon.ico`, etc.
3. **Middleware исключает** API и статику из обработки
4. **Тестовая среда** поддерживает оба домена через Chrome launcher

## 1. Архитектура Артефактов-Плагинов

Система построена на модульной архитектуре, где каждый тип контента (`text`, `code`, `site`) является самодостаточным "плагином".

> **Детали:** См. `architecture/artifacts.md` для полной спецификации артефактов

**Ключевые принципы:**
- **Модульность:** Каждый тип изолирован в `artifacts/kinds/[kind]/`
- **Плагинность:** `server.ts` + `client.tsx` на тип артефакта
- **Расширяемость:** Простое добавление новых типов

## 2. Паттерн "Сайт как Артефакт"

Для избежания излишней сложности, **сгенерированный сайт не является отдельной сущностью в БД**. Вместо этого, это артефакт типа `site`.

-   **Хранение:** Поле `content` этого артефакта содержит JSON-объект (`SiteDefinition`), который полностью описывает структуру сайта: порядок блоков и то, какие артефакты (с их версиями) вставлены в "слоты" каждого блока.
-   **Преимущества:** Мы переиспользуем всю существующую мощную логику артефактов (версионирование, мягкое удаление, права доступа) для управления сайтами.

## 3. Модульная Система Блоков Сайта

Компоненты, из которых строятся сайты, полностью изолированы от основного приложения и живут в директории `site-blocks/`.

-   **Структура Блока:** Каждый блок представлен папкой (`site-blocks/[block-type]/`), содержащей:
    -   `definition.ts`: "Схема" блока. Описывает его `type`, `title` и "слоты" (`slots`) — места для вставки контента. Каждый слот определяет, какой `kind` артефакта он ожидает и по каким `tags` его можно найти автоматически.
    -   `index.tsx`: React-компонент (`'use client'`), отвечающий за рендеринг блока. Он получает `artifactId` и `pinnedVersionTimestamp` для каждого слота и самостоятельно (через `useSWR`) загружает нужный контент.
-   **Регистрация Блоков:** Файл `site-blocks/index.ts` экспортирует две мапы: `blockDefinitions` (для AI-генератора) и `blockComponents` (для рендерера страниц). Это позволяет системе динамически работать с любым количеством блоков.

## 4. Двухуровневая архитектура AI: Оркестратор и Специалисты

> **Детали:** См. `architecture/artifacts.md` раздел "Двухуровневая Архитектура AI"

**Принцип:** Разделение ответственности между пониманием намерения (Оркестратор) и выполнением задач (Специалисты).

## 5. Асинхронный UX и фоновая обработка

> **Детали:** См. `architecture/artifacts.md` раздел "UX и Асинхронные Операции"

**Принцип:** Мгновенный отклик UI + фоновая генерация через SWR polling.

## 6. Паттерн "Добавить в чат" и Redis-буфер

Для улучшения UX взаимодействия с артефактами используется контекстно-зависимый паттерн:

### Техническая реализация
**Server Actions:** `copyArtifactToClipboard()`, `getArtifactFromClipboard()` и `clearArtifactFromClipboard()` в `/app/app/(main)/artifacts/actions.ts`

**Redis структура:**
- **Ключ:** `user-clipboard:${userId}`
- **TTL:** 60 секунд (автоочистка)
- **Данные:** `{ artifactId, title, kind }`
- **Поведение:** как обычный буфер обмена ОС (можно вставить несколько раз)

### UX-логика (поведение как у системного буфера)

1.  **Кнопка "Добавить в чат"** → `copyArtifactToClipboard` → Redis с TTL 60 секунд
2.  **Показывается тост:** "Ссылка на артефакт скопирована"
3.  **При открытии любого чата:**
    *   `useEffect` в `Chat.tsx` вызывает `getArtifactFromClipboard` (НЕ удаляет!)
    *   Если есть данные - показывается "черновик" вложения
4.  **Пользователь может:**
    *   **Подтвердить (✓):** Артефакт добавляется в сообщение, остается в буфере
    *   **Отменить (✕):** Вызов `clearArtifactFromClipboard` очищает буфер полностью
5.  **Повторное использование:** Один артефакт можно вставить в несколько разных чатов
6.  **Автоочистка:** Через 60 секунд или при ручной отмене

### Будущие улучшения
- **Меню скрепки:** Добавить "Прикрепить артефакт" в меню скрепки чата
- **Контекстное определение:** Прямое добавление через `useChat().append()` если чат уже открыт

Этот паттерн обеспечивает привычное поведение буфера обмена и позволяет гибко работать с артефактами в разных чатах.

## 7. Архитектурный план: Система Публикации

**ДОБАВЛЕНО:** 2025-06-17 - Комплексная система публичного доступа к контенту

### Обзор системы
Система публикации обеспечивает безопасный публичный доступ к чатам и сайтам с поддержкой TTL (Time-To-Live) и множественных источников публикации.

### Ключевые архитектурные решения

#### Database Schema Design
- **`publication_state: jsonb`** в таблице Artifact - массив PublicationInfo объектов
- **`published_until: timestamp`** в таблице Chat - заменяет поле visibility
- **Множественные источники:** один артефакт может быть опубликован через chat, site, direct

#### PublicationInfo Structure
```typescript
interface PublicationInfo {
  source: 'direct' | 'chat' | 'site';
  sourceId: string;
  publishedAt: string; // ISO-8601
  expiresAt: string | null; // null = бессрочно
}
```

#### Преимущества архитектуры
1. **Гибкость:** Поддержка публикации одного артефакта из разных источников
2. **Атомарность:** Отмена публикации из одного источника не влияет на другие
3. **TTL:** Автоматическое истечение публикации на уровне БД
4. **Типобезопасность:** JSONB с TypeScript интерфейсами

### Компоненты системы

#### Backend Logic
- **Helper Utilities:** `isArtifactPublished()`, `isSitePublished()`, `fetchPublishedSiteData()`
- **Server Actions:** `publishChat()`, `unpublishChat()`, `publishSite()`, `unpublishSite()`
- **Security Layer:** Проверка прав доступа в API endpoints

#### Frontend Components
- **Enhanced Share Dialog:** TTL селектор с опциями (месяц, год, бессрочно, кастом)
- **Site Publication UI:** Полноценный UI для управления публикацией сайтов
  - `SitePublicationDialog`: Основной диалог с TTL управлением
  - Custom event система для cross-component коммуникации  
  - TypeScript совместимость между ArtifactApiResponse и Artifact типами
  - Интеграция в artifact actions через GlobeIcon кнопку
  - **ВАЖНО:** Кнопка публикации доступна ТОЛЬКО для site артефактов по дизайну системы
- **Read-Only Mode:** Отключение редактирования для публичного контента

#### Security Model
- **Public API Access:** /api/artifact поддерживает неаутентифицированный доступ
- **Permission Logic:** owner + любой статус / non-owner + published only
- **URL Protection:** Страницы проверяют статус публикации через helper functions

### Implementation Phases
1. ✅ **Database Foundation** - Schema updates и миграции
2. ✅ **Helper Utilities** - Функции проверки и загрузки данных  
3. ✅ **Server Actions** - Логика публикации/отмены
4. ✅ **UI Components** - Диалоги и кнопки управления (завершено 2025-06-17)
5. ✅ **Read-Only Mode** - Режим просмотра для публичного контента (завершено 2025-06-17)
6. ✅ **Security & API** - Защита endpoints и публичный доступ (завершено 2025-06-17)

**✅ СИСТЕМА ПОЛНОСТЬЮ РЕАЛИЗОВАНА (2025-06-17)**

Эта архитектура обеспечивает масштабируемое и безопасное решение для публичного доступа к контенту с полным контролем TTL и источников публикации.

#### Финальная реализация включает:
- **Полная защита API:** Неаутентифицированный доступ только к опубликованным артефактам
- **Server-side валидация:** Проверка публикации на уровне страниц для SEO оптимизации  
- **Read-only контент:** Автоматическое отключение редактирования для публичного доступа
- **Graceful error handling:** Правильная обработка неопубликованного контента (404 страницы)
- **Unit test coverage:** 26/26 тестов проходят, включая 14 тестов publication utilities
- **TypeScript совместимость:** Полная типобезопасность во всех компонентах
- **Quality assurance:** ESLint и TypeScript проверки проходят без предупреждений
- **✅ Publication Button Stability (2025-06-18):** Исправлен критический баг с кнопкой публикации в site артефактах

## 8. Архитектурный паттерн: SWR Dialog Rendering (2025-06-18)

**ДОБАВЛЕНО:** 2025-06-18 - Паттерн для стабильного рендеринга диалогов с внешними данными

### Проблема
При использовании SWR для загрузки данных перед рендерингом диалогов возникает race condition: custom events могут срабатывать до загрузки данных, что приводит к отказу в рендеринге диалога.

### Решение: SWR Dialog Pattern
Паттерн обеспечивает надежное отображение диалогов независимо от состояния загрузки данных:

```typescript
// ❌ Проблемный код - диалог не рендерится без данных
{artifact.kind === 'site' && fullArtifact && (
  <SitePublicationDialog siteArtifact={fullArtifact} />
)}

// ✅ Правильный код - fallback + retry logic
const { data: fullArtifact } = useSWR(
  artifact.artifactId ? `/api/artifacts/${artifact.artifactId}` : null,
  fetcher,
  { 
    refreshInterval: (data) => !data ? 3000 : 0, // Retry до успеха
    onError: (err) => console.error('SWR error:', err) // Logging
  }
)

{artifact.kind === 'site' && artifact.artifactId && (
  <SitePublicationDialog 
    siteArtifact={fullArtifact || fallbackArtifactObject} 
  />
)}
```

### Ключевые принципы
1. **Fallback Objects:** Всегда предоставлять валидный объект для TypeScript совместимости
2. **Retry Logic:** SWR refreshInterval должен повторять запросы до успеха для критических данных
3. **Error Logging:** Обязательное логирование ошибок SWR для диагностики
4. **Independent Rendering:** Диалоги должны рендериться независимо от состояния данных
5. **Custom Events Stability:** Не блокировать event handling отсутствием данных

### Применение
Этот паттерн применяется для:
- Publication диалогов с внешними API данными
- Модальных окон с асинхронной загрузкой контента  
- Компонентов с custom event коммуникацией
- Critical UI элементов где UX failure недопустим

## 9. Архитектурный паттерн: Modern Site Design System (2025-06-19)

**ДОБАВЛЕНО:** 2025-06-19 - Система современного дизайна для опубликованных сайтов в стиле Tilda

### Философия дизайна
Переход от примитивных HTML-блоков к профессиональным компонентам уровня современных конструкторов сайтов:

**Принципы:**
1. **Visual Hierarchy** — градиенты, размеры шрифтов, spacing для четкой иерархии
2. **Interactive Elements** — hover-эффекты, плавные переходы, анимации
3. **Card-Based Design** — карточный интерфейс для структурирования контента
4. **Responsive First** — мобильная адаптивность на всех уровнях
5. **Animation Delights** — тонкие анимации для повышения engagement

### Архитектура Site Blocks v1.0.0

#### Hero Block Pattern
```typescript
// Градиентный фон с blob-анимациями
<section className="relative py-16 px-4 md:py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
  {/* Animated background blobs */}
  <div className="absolute top-4 left-4 w-72 h-72 bg-purple-300/30 rounded-full animate-blob" />
  
  {/* Gradient text with large typography */}
  <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
    {headingContent}
  </h1>
</section>
```

#### Contact Cards Pattern  
```typescript
// Grid of contact cards with avatars and hover effects
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {contacts.map(contact => (
    <div className="group relative p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Avatar with gradient */}
      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
        <span className="text-white font-bold text-xl">{contact.name[0]}</span>
      </div>
      
      {/* Interactive contact info */}
      <a href={`mailto:${contact.email}`} className="hover:text-purple-600 transition-colors" />
    </div>
  ))}
</div>
```

#### Interactive Links Pattern
```typescript
// Button-style links with icons and animations
<a className="group relative p-6 bg-white rounded-xl hover:shadow-lg transition-all duration-300">
  {/* Slide animation background */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
  
  {/* Icon with scale animation */}
  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
    <ExternalLinkIcon />
  </div>
</a>
```

### Technical Implementation

#### Tailwind Configuration
```typescript
// tailwind.config.ts
theme: {
  extend: {
    animation: {
      blob: 'blob 7s infinite',
    },
    keyframes: {
      blob: {
        '0%': { transform: 'translate(0px, 0px) scale(1)' },
        '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
        '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        '100%': { transform: 'translate(0px, 0px) scale(1)' },
      },
    },
  },
}
```

#### CSS Custom Utilities
```css
/* app/globals.css */
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

.bg-grid-gray-200\/60 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'...");
}
```

### Responsive Design Strategy

**Breakpoint System:**
- **Mobile:** `base` - Single column, compact spacing
- **Tablet:** `md:` - Two columns, medium spacing  
- **Desktop:** `lg:` - Three columns, comfortable spacing

**Typography Scale:**
- **Mobile:** `text-2xl` hero, `text-base` body
- **Tablet:** `text-4xl` hero, `text-lg` body
- **Desktop:** `text-6xl` hero, `text-xl` body

### Design System Benefits

1. **Professional Appeal** — визуальное качество соответствует Tilda/Webflow
2. **User Engagement** — интерактивные элементы повышают взаимодействие
3. **Brand Consistency** — единый visual language across all published sites
4. **Mobile Experience** — отличная производительность на мобильных устройствах
5. **Accessibility** — proper contrast ratios, keyboard navigation, screen readers

### Future Extensions
- **Dark Mode Support** — automatic theme switching
- **Custom Brand Colors** — user-configurable color palettes  
- **Advanced Animations** — scroll-triggered animations, parallax effects
- **Additional Blocks** — gallery, testimonials, FAQ, pricing tables
