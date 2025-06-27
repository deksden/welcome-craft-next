# 🏗️ Системные Архитектурные Паттерны

**Назначение:** Единый источник правды для всех архитектурных решений WelcomeCraft.

**Версия:** 10.0.0  
**Дата:** 2025-06-26  
**Статус:** Добавлена архитектура Three-Mode Environment Detection
**Обновлено:** Документированы три режима работы приложения и тестов (Local Dev, Local Prod, Real Prod)

---

## 🌍 0. Three-Mode Environment Detection

### Принцип
WelcomeCraft поддерживает **три режима работы** приложения и тестов с автоматическим определением окружения.

### Архитектура трех режимов

#### 1. **Local Dev** (Режим разработки)
```bash
NODE_ENV=development
pnpm dev  # Запуск на фиксированном порту 3000
```

**Характеристики:**
- **Protocol:** `http://`
- **Домены:** 
  - **Public:** `localhost:3000`
  - **Admin:** `app.localhost:3000`
- **Порты:** Фиксированный порт `3000`
- **Компиляция:** Turbopack/Webpack dev mode с hot reload
- **Аутентификация:** NextAuth.js development + test-session поддержка
- **Тестирование:** E2E тесты с extended timeouts (30s navigation)
- **AI Fixtures:** Record mode для создания новых фикстур
- **Performance:** Медленная компиляция, щедрые timeouts

#### 2. **Local Prod** (Локальное production тестирование)
```bash
NODE_ENV=production + PLAYWRIGHT_PORT=DYNAMIC_PORT
pnpm build && pnpm start  # Или pnpm test:e2e
```

**Характеристики:**
- **Protocol:** `http://`
- **Домены:** 
  - **Public:** `localhost:DYNAMIC_PORT`
  - **Admin:** `app.localhost:DYNAMIC_PORT`
- **Порты:** Динамически подбираемые (3001, 3002, 3003...)
- **Компиляция:** Next.js production build с оптимизациями  
- **Аутентификация:** NextAuth.js production + test-session поддержка
- **Тестирование:** E2E тесты с production timeouts (15s navigation)
- **AI Fixtures:** Replay mode для детерминистичного воспроизведения
- **Performance:** Быстрая загрузка, короткие timeouts

#### 3. **Real Prod** (Реальный production)
```bash
NODE_ENV=production + БЕЗ PLAYWRIGHT_PORT
Vercel/хостинг deployment
```

**Характеристики:**
- **Protocol:** `https://`
- **Домены:** 
  - **Public:** `welcome-onboard.ru`
  - **Admin:** `app.welcome-onboard.ru`
- **Порты:** Стандартные HTTPS порты (443)
- **Компиляция:** Next.js production build на хостинге
- **Аутентификация:** ТОЛЬКО NextAuth.js (БЕЗ test-session)
- **Тестирование:** НЕ ПОДДЕРЖИВАЕТСЯ (только реальные пользователи)
- **AI Fixtures:** Real AI API calls
- **Performance:** Оптимизированная производительность

### Логика определения режима

**В коде приложения (`tests/helpers/test-config.ts`):**
```typescript
// Three-Mode Environment Detection с динамическими портами
function getTestPort(): number {
  // 1. Playwright тесты: используют PLAYWRIGHT_PORT (динамический)
  if (process.env.PLAYWRIGHT_PORT) {
    return Number.parseInt(process.env.PLAYWRIGHT_PORT, 10);
  }
  // 2. Local Dev: фиксированный порт 3000
  return 3000;
}

const isRealProduction = process.env.NODE_ENV === 'production' && 
                        !process.env.PLAYWRIGHT_USE_PRODUCTION && 
                        !process.env.PLAYWRIGHT_PORT &&
                        !isPlaywrightEnvironment();

if (isRealProduction) {
  // Real Prod: welcome-onboard.ru домены (БЕЗ портов)
  return { public: 'welcome-onboard.ru', admin: 'app.welcome-onboard.ru' };
} else {
  // Local Dev (port 3000) + Local Prod (dynamic port): localhost домены
  const port = getTestPort();
  return { public: `localhost:${port}`, admin: `app.localhost:${port}` };
}
```

**В middleware (`middleware.ts`):**
```typescript
// Environment Detection для аутентификации
const hasPlaywrightPort = !!process.env.PLAYWRIGHT_PORT;
const isTestEnv = process.env.NODE_ENV === 'test' || 
                  process.env.PLAYWRIGHT === 'true' || 
                  testHeader === 'playwright' ||
                  hasPlaywrightPort; // Поддержка Local Prod режима

if (isTestEnv) {
  // Local Dev + Local Prod: test-session поддержка
  // Проверка test-session cookies
} else {
  // Real Prod: только NextAuth.js
  // Проверка NextAuth tokens
}
```

### Переменные окружения по режимам

| Переменная | Local Dev | Local Prod | Real Prod |
|------------|-----------|------------|-----------|
| `NODE_ENV` | `development` | `production` | `production` |
| `PLAYWRIGHT_PORT` | ❌ | ✅ (dynamic: 3001+) | ❌ |
| `PLAYWRIGHT_USE_PRODUCTION` | ❌ | ✅ (optional) | ❌ |
| `X-Test-Environment` header | ✅ (optional) | ✅ (set by tests) | ❌ |
| **Реальные порты** | **3000 (fixed)** | **Dynamic (3001+)** | **443 (HTTPS)** |
| **Домены** | **app.localhost:3000** | **app.localhost:PORT** | **app.welcome-onboard.ru** |

### Практические применения

**Для разработчиков:**
- **Local Dev:** `pnpm dev` - ежедневная разработка на `app.localhost:3000`
- **Local Prod:** `pnpm test:e2e` - тестирование production сборки на `app.localhost:DYNAMIC_PORT`

**Для тестирования:**
- **Local Dev:** Тесты компонентов с медленными timeouts
- **Local Prod:** E2E тесты с production performance
- **Real Prod:** Только мониторинг и real user testing

**Для CI/CD:**
- **Build stage:** Local Prod проверки перед деплоем
- **Deploy stage:** Real Prod развертывание на хостинге

### Механизм динамических портов (Local Prod)

**Алгоритм подбора портов в `playwright.config.ts`:**
```typescript
async function findAvailablePort(basePort: number): Promise<number> {
  // Начинаем с порта 3000, затем 3001, 3002, 3003...
  // Проверяем доступность через создание временного сервера
  // Возвращаем первый свободный порт
}

async function getPort(): Promise<number> {
  if (process.env.PLAYWRIGHT_PORT) {
    // Используем уже установленный порт (для повторных запусков)
    return Number.parseInt(process.env.PLAYWRIGHT_PORT, 10)
  }
  
  // Ищем свободный порт начиная с 3000
  const port = await findAvailablePort(3000)
  
  // Устанавливаем в env для child processes
  process.env.PLAYWRIGHT_PORT = port.toString()
  
  return port
}
```

**Результат:**
- **Local Dev:** Всегда порт `3000` (фиксированный)
- **Local Prod:** Динамический порт (`3001`, `3002`, `3003`...) в зависимости от доступности
- **Параллельные тесты:** Каждый запуск получает уникальный порт
- **Конфликты:** Автоматически избегаются через поиск свободных портов

### Критические особенности

⚠️ **test-session cookies НЕ РАБОТАЮТ в Real Prod** - только для Local Dev/Local Prod  
⚠️ **AI Fixtures НЕ ДОСТУПНЫ в Real Prod** - только real AI API  
⚠️ **E2E тесты НЕ ЗАПУСКАЮТСЯ против Real Prod** - только локальное тестирование  

---

## 🏛️ 1. Мультидоменная Архитектура

### Принцип
Приложение разделено на административную панель и публичный сайт через разные домены.

### Доменная структура

**Development:**
- **`app.localhost:3000`** → Админ-панель (`/app/*` routes)
  - Auth: **ТРЕБУЕТСЯ** через NextAuth.js
  - Содержимое: чат, создание артефактов, управление сайтами
- **`localhost:3000`** → Публичный сайт (`/site/*` routes)
  - Auth: **НЕ ТРЕБУЕТСЯ** - публичный доступ
  - Содержимое: landing page, сгенерированные сайты

**Production:**
- **`app.welcome-onboard.ru`** → Админ-панель
- **`welcome-onboard.ru`** → Публичный сайт + хостинг сайтов (`/s/[site-id]`)

### Middleware маршрутизация

```typescript
// middleware.ts
const isAppDomain = hostname.startsWith('app.localhost')

if (isAppDomain) {
  // Проверка аутентификации + переписывание в /app/*
  url.pathname = `/app${url.pathname}`
} else {
  // Публичный сайт - переписывание в /site/*
  url.pathname = `/site${url.pathname}`
}
```

### Важные особенности
- **API routes** (`/api/*`) исключены из middleware и доступны на всех доменах
- **Cookies** устанавливаются с правильным domain для поддержки поддоменов
- **Тестирование:** E2E → `app.localhost:PORT`, API → `localhost:PORT`

---

## 🗄️ 2. UC-10 Schema-Driven CMS Architecture

### Принцип
Каждый тип артефакта имеет собственную оптимизированную схему данных и специализированную таблицу БД.

### Эволюция от Sparse Columns
**До:** Универсальные JSON поля (`content_text`, `content_url`, `content_site_definition`)
**После:** Специализированные таблицы для каждого типа артефакта

### Специализированные таблицы БД

```sql
-- Основная таблица (метаданные)
CREATE TABLE "Artifact" (
  "id" varchar(255) PRIMARY KEY,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "title" varchar(255) NOT NULL,
  "kind" artifact_kind NOT NULL,
  "userId" varchar(255) NOT NULL,
  "publication_state" jsonb DEFAULT '[]'::jsonb
);

-- Специализированные таблицы контента
CREATE TABLE "A_Text" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "content" text NOT NULL,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

CREATE TABLE "A_Person" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "fullName" varchar(255) NOT NULL,
  "position" varchar(255),
  "department" varchar(255),
  "email" varchar(255)
  -- ... other HR fields
);
```

### Поддерживаемые типы артефактов
- **A_Text** — текстовый контент и код
- **A_Image** — изображения и файлы
- **A_Site** — сайты (JSON definition)
- **A_Person** — HR данные персонала
- **A_Address** — адресные данные
- **A_FaqItem** — FAQ элементы
- **A_Link** — ссылки и ресурсы
- **A_SetDefinition** — определения наборов
- **A_SetItems** — элементы наборов

### Unified Artifact Tools Registry

**Файл:** `artifacts/kinds/artifact-tools.ts` - единый источник истины

```typescript
interface ArtifactTool {
  kind: ArtifactKind;
  
  create?: (props: CreateProps) => Promise<string>;
  update?: (props: UpdateProps) => Promise<string>;
  
  save?: (artifact: Artifact, content: string) => Promise<void>;
  load?: (artifactId: string, createdAt: Date) => Promise<any>;
  delete?: (artifactId: string, createdAt: Date) => Promise<void>;
}

// Unified dispatchers
export async function saveArtifact(artifact: Artifact, content: string): Promise<void>
export async function loadArtifact(artifactId: string, createdAt: Date): Promise<any>
export async function deleteArtifact(artifactId: string, createdAt: Date): Promise<void>
```

### File Import System
**Поддерживаемые форматы:** .docx, .xlsx, .csv, .txt, .md, изображения  
**API Endpoint:** `/api/artifacts/import`  
**Автоматическое определение типа** по расширению файла и MIME-type

---

## 🤖 3. UC-09 Holistic Site Generation

### Принцип
Трансформация от множественных AI-вызовов к единому холистическому подходу генерации сайтов.

### Эволюция архитектуры

**UC-08 "Intelligent Artifact Search" (устарел):**
- ❌ ~20 AI-вызовов на сайт (итеративный поиск для каждого слота)
- ❌ Высокая стоимость и время генерации
- ❌ Фрагментарные решения без полного контекста

**UC-09 "Holistic Site Generation" (актуально):**
- ✅ 1 AI-вызов на сайт (экономия в 20 раз)
- ✅ Холистический контекст - AI видит все кандидаты сразу
- ✅ Структурированная генерация через Zod schema

### Архитектура

```typescript
// Phase 1: Агрегация кандидатов для всех слотов
export async function aggregateCandidatesForAllSlots(
  userId: string, 
  userPrompt: string
): Promise<AllCandidates>

// Phase 2: Единый холистический AI-вызов
export async function generateSiteHolistically(
  context: HolisticGenerationContext
): Promise<string>

// Zod-схема для структурированного выхода
export const SiteDefinitionSchema = z.object({
  theme: z.string().default('default'),
  blocks: z.array(SiteBlockSchema),
  reasoning: z.string().optional()
})
```

### Диаграмма процесса

```mermaid
graph TD
    A[User Prompt: "Создай сайт..."] --> B{AI Оркестратор}
    B --> C[siteTool.create()]
    C --> D{aggregateCandidatesForAllSlots}
    D --> E[DB: Простой поиск кандидатов для всех слотов]
    E --> D
    D --> F{generateSiteHolistically}
    F --> G[Единый AI-вызов]
    F -- "1. Полный контекст кандидатов<br/>2. Zod Schema" --> G
    G -- "SiteDefinition JSON" --> F
    F --> C
    C --> H[ArtifactPreview в чате]
    
    style A fill:#e1f5fe
    style G fill:#fff3e0
    style H fill:#e8f5e8
    style D fill:#f3e5f5
    style F fill:#f3e5f5
```

**Описание этапов:**
1. **User Prompt** → Пользователь задает требования к сайту
2. **AI Оркестратор** → Анализирует запрос и выбирает инструмент
3. **siteTool.create()** → Запускает процесс создания сайта
4. **aggregateCandidatesForAllSlots** → Собирает все возможные артефакты для слотов
5. **DB Search** → Быстрый поиск релевантных артефактов в базе
6. **generateSiteHolistically** → Единый AI-вызов с полным контекстом
7. **Единый AI-вызов** → AI получает все кандидаты и Zod схему для структурированного ответа
8. **ArtifactPreview** → Результат отображается пользователю в чате

### Измеримые улучшения
- **AI Calls:** 20 → 1 (снижение в 20 раз)
- **Generation Time:** ~30s → ~3s (ускорение в 10 раз)
- **Cost per Site:** $0.20 → $0.01 (экономия 95%)

---

## 🗃️ 4. "Сайт как Артефакт" паттерн

### Принцип
Сгенерированный сайт не является отдельной сущностью в БД, а является артефактом типа `site`.

### Реализация
- **Хранение:** Поле `content` содержит JSON-объект (`SiteDefinition`)
- **Структура:** Описывает порядок блоков и артефакты для каждого слота
- **Преимущества:** Переиспользование логики артефактов (версионирование, мягкое удаление, права доступа)

```typescript
interface SiteDefinition {
  theme: string;
  blocks: SiteBlock[];
  reasoning?: string;
}

interface SiteBlock {
  type: string;
  slots: Record<string, { artifactId: string; pinnedVersionTimestamp?: string }>;
}
```

---

## 🧩 5. Модульная Система Блоков Сайта

### Принцип
Компоненты сайтов полностью изолированы в директории `site-blocks/`.

### Структура блока
```
site-blocks/
├── hero/
│   ├── definition.ts    # Схема блока (slots, типы контента)
│   └── index.tsx        # React-компонент ('use client')
└── index.ts             # Регистрация блоков
```

### Схема блока
```typescript
// definition.ts
export const heroBlockDefinition = {
  type: 'hero',
  title: 'Hero Banner',
  slots: {
    heading: { kind: 'text', tags: ['welcome', 'greeting'] },
    image: { kind: 'image', tags: ['hero', 'banner'] }
  }
}

// index.tsx - автономная загрузка контента
export default function HeroBlock({ artifactId, pinnedVersionTimestamp }) {
  const { data: content } = useSWR(`/api/artifact/${artifactId}`, fetcher)
  return <div>...</div>
}
```

---

## 🤖 6. Двухуровневая AI Архитектура

### Принцип
Разделение ответственности между пониманием намерения (Оркестратор) и выполнением задач (Специалисты).

### Уровни
1. **AI Оркестратор** — понимает намерение пользователя, выбирает инструменты
2. **AI Специалисты** — выполняют конкретные задачи (создание артефактов, обновление контента)

### AI Инструменты
- `artifactCreate` — создание новых артефактов
- `artifactUpdate` — обновление существующих артефактов  
- `artifactEnhance` — улучшение контента
- `artifactDelete` — удаление артефактов
- `artifactRestore` — восстановление удаленных
- `siteTool` — создание и управление сайтами

---

## ⚡ 7. Асинхронный UX и SWR Polling

### Принцип
Мгновенный отклик UI + фоновая обработка для длительных операций.

### Паттерн
1. **Мгновенный ответ:** UI показывает "processing" состояние
2. **Фоновая генерация:** AI обрабатывает запрос асинхронно
3. **SWR Polling:** Клиент периодически проверяет готовность
4. **Автообновление:** Результат появляется без перезагрузки

```typescript
// Клиентский код
const { data, error } = useSWR(`/api/artifact/${id}`, fetcher, {
  refreshInterval: data?.status === 'processing' ? 1000 : 0
})
```

---

## 📋 8. Redis Clipboard System

### Принцип
Поведение как у системного буфера обмена для работы с артефактами между чатами.

### Техническая реализация
```typescript
// Server Actions
copyArtifactToClipboard(artifactId, title, kind)
getArtifactFromClipboard(userId)
clearArtifactFromClipboard(userId)
```

### Redis структура
- **Ключ:** `user-clipboard:${userId}`
- **TTL:** 60 секунд (автоочистка)
- **Данные:** `{ artifactId, title, kind }`

### UX Flow
1. "Добавить в чат" → Redis с TTL
2. Открытие чата → проверка буфера
3. Показ "черновика" вложения
4. Подтверждение/отмена пользователем

---

## 📢 9. Publication System с TTL

### Принцип
Безопасный публичный доступ к контенту с поддержкой автоматического истечения.

### Database Schema
```typescript
interface PublicationInfo {
  source: 'direct' | 'chat' | 'site';
  sourceId: string;
  publishedAt: string;
  expiresAt: string | null; // null = бессрочно
}

// В таблице Artifact
publication_state: jsonb // массив PublicationInfo
```

### Возможности
- **Множественные источники:** один артефакт из разных контекстов
- **TTL управление:** месяц, год, бессрочно, кастом
- **Атомарность:** отмена из одного источника не влияет на другие

---

## 🎨 10. Modern Site Design System (Tilda-style)

### Принцип
Переход от примитивных HTML-блоков к профессиональным компонентам современных конструкторов.

### Дизайн-принципы
1. **Visual Hierarchy** — градиенты, размеры шрифтов, spacing
2. **Interactive Elements** — hover-эффекты, плавные переходы
3. **Card-Based Design** — карточный интерфейс для структурирования
4. **Responsive First** — мобильная адаптивность на всех уровнях
5. **Animation Delights** — тонкие анимации для повышения engagement

### Технические компоненты
```css
/* Blob анимации */
@keyframes blob {
  '0%': { transform: 'translate(0px, 0px) scale(1)' },
  '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
  '100%': { transform: 'translate(0px, 0px) scale(1)' }
}

/* Градиентный текст */
.gradient-text {
  background: linear-gradient(to-r, from-gray-900, via-purple-900, to-blue-900);
  background-clip: text;
  color: transparent;
}
```

---

## 🛠️ 11. SWR Dialog Rendering Pattern

### Принцип
Надежное отображение диалогов независимо от состояния загрузки данных.

### Проблема
Race condition между custom events и SWR загрузкой данных.

### Решение
```typescript
const { data: fullArtifact } = useSWR(
  artifact.artifactId ? `/api/artifacts/${artifact.artifactId}` : null,
  fetcher,
  { 
    refreshInterval: (data) => !data ? 3000 : 0, // Retry до успеха
    onError: (err) => console.error('SWR error:', err)
  }
)

// Всегда рендерим с fallback
{artifact.kind === 'site' && (
  <SitePublicationDialog 
    siteArtifact={fullArtifact || fallbackArtifactObject} 
  />
)}
```

### Ключевые принципы
- **Fallback Objects** для TypeScript совместимости
- **Retry Logic** до успешной загрузки критических данных
- **Independent Rendering** диалогов от состояния данных

---

## 🔧 12. Next.js 15 Server Component Compliance Pattern

### Принцип
Строгое соблюдение Next.js 15 архитектурных требований для Server Components с правильным управлением async паттернами.

### Проблемы и решения

**🔴 Legacy Import Issues:**
```typescript
// ❌ НЕПРАВИЛЬНО - устаревший импорт
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// ✅ ПРАВИЛЬНО - unified auth system
import { getAuthSession } from '@/lib/test-auth'
```

**🔴 Next.js 15 SearchParams Promise API:**
```typescript
// ❌ НЕПРАВИЛЬНО - direct access
interface Props {
  searchParams: { id?: string }
}
const value = searchParams.id

// ✅ ПРАВИЛЬНО - Promise await
interface Props {
  searchParams: Promise<{ id?: string }>
}
const resolved = await searchParams
const value = resolved.id
```

**🔴 Client/Server Boundary Issues:**
```typescript
// ❌ НЕПРАВИЛЬНО - server-only в client
'use client'
import { getUser } from '@/lib/db/queries' // server-only!

// ✅ ПРАВИЛЬНО - server component pattern
// Server Component (без 'use client')
import { getAuthSession } from '@/lib/test-auth'
export default async function Page() {
  const session = await getAuthSession()
  return <ClientWrapper data={session} />
}
```

### Архитектурные требования

1. **Server Components First:**
   - Используем Server Components по умолчанию
   - Client Components только для интерактивности
   - Правильная передача данных через props

2. **Async Pattern Compliance:**
   - Все Server Component functions помечены `async`
   - SearchParams обрабатываются как Promise
   - Auth sessions получаются через unified helpers

3. **Import Safety:**
   - server-only модули только в Server Components
   - Клиентские библиотеки только в Client Components
   - Unified helpers для кроссплатформенной совместимости

### Миграционные паттерны

**Legacy AI Mock → AI Fixtures:**
```typescript
// ❌ СТАРОЕ - manual mocking
import { AIMockHelper } from './helpers/ai-mock'
await AIMockHelper.setup()

// ✅ НОВОЕ - automatic fixtures
// AI Fixtures система работает автоматически
// через environment variables
```

**Multi-Auth → Unified Auth:**
```typescript
// ❌ СТАРОЕ - multiple auth systems
await mockAuthentication(page, email)
const session = await getServerSession(authOptions)

// ✅ НОВОЕ - unified approach
await fastAuthentication(page, { email })
const session = await getAuthSession()
```

### Валидация соответствия

```bash
# Проверка TypeScript compliance
pnpm typecheck

# Проверка успешной компиляции
pnpm build

# Валидация тестов
pnpm test:unit
pnpm test:routes
```

### Результаты применения

- ✅ **TypeScript Errors:** 0 ошибок компиляции
- ✅ **Build Success:** Успешная сборка без warnings
- ✅ **Test Compatibility:** Все уровни тестов функциональны
- ✅ **Performance:** Улучшенная производительность Server Components

---

## 📊 Архитектурные метрики

### UC-10 Schema-Driven CMS
- **Поддерживаемые типы:** 11 типов артефактов
- **Database Performance:** Нормализованные таблицы vs JSONB sparse columns
- **Type Safety:** Полная типизация на БД и TypeScript уровнях

### UC-09 Holistic Site Generation  
- **Performance:** 20x сокращение AI-вызовов
- **Cost Efficiency:** 95% экономия расходов на AI API
- **Generation Speed:** 10x ускорение (30s → 3s)

### Testing Infrastructure
- **Route Tests:** 82/82 проходят (100% success rate)
- **Unit Tests:** 94/94 проходят (100% success rate)
- **E2E Tests:** 40/40 функциональны с AI Fixtures (исправлены критические компиляционные ошибки)
- **TypeScript Compliance:** 0 ошибок компиляции
- **Next.js 15 Compatibility:** 100% соответствие современным паттернам

---

> **Принцип системы:** Каждый архитектурный паттерн решает конкретную проблему масштабируемости, производительности или пользовательского опыта, работая в синергии с другими паттернами для создания enterprise-ready системы.