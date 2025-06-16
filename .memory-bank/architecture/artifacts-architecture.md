# 🏗️ Техническая архитектура артефактов WelcomeCraft

**Версия:** 1.0.0  
**Дата:** 2025-06-16  
**Статус:** Актуально

## HISTORY:
* v1.0.0 (2025-06-16): Детальная техническая документация архитектуры артефактов

---

Этот документ содержит детальную техническую документацию системы артефактов - ключевого компонента WelcomeCraft. Артефакты являются универсальными блоками контента, которые создаются AI и используются для построения онбординг-сайтов.

## 1. 🗄️ Архитектура базы данных

### Структура таблицы `artifacts`

**Файл:** `lib/db/schema.ts`

```typescript
export const artifact = pgTable(
  'Artifact',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: json('content').$type<string>(), // JSON поле для гибкого хранения
    summary: text('summary').notNull().default(''),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet', 'site'] })
      .notNull()
      .default('text'),
    userId: uuid('userId').references(() => user.id),
    authorId: uuid('authorId').references(() => user.id),
    deletedAt: timestamp('deletedAt'), // Мягкое удаление
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }), // Композитный PK
  }),
)
```

### 🔑 Ключевые особенности архитектуры БД:

**1. Версионирование через композитный первичный ключ**
- PK = `[id, createdAt]` позволяет хранить множественные версии одного артефакта
- Каждая версия - отдельная запись с одинаковым `id`, но разным `createdAt`
- Не требует отдельной таблицы версий

**2. JSON content поле**
- Универсальное хранение для всех типов контента
- Drizzle ORM автоматически парсит JSON при чтении: `json('content').$type<string>()`
- Позволяет хранить структурированные данные любой сложности

**3. Двойная авторизация**
- `userId` - владелец артефакта (пользователь)
- `authorId` - создатель (может быть `null` для AI-созданных артефактов)

**4. Мягкое удаление**
- `deletedAt` timestamp позволяет восстанавливать артефакты
- Удаленные артефакты исключаются из запросов через WHERE фильтры

## 2. 🚀 API Endpoints архитектura

### Основные маршруты

**`/api/artifact/route.ts`** - Основной CRUD endpoint:

```typescript
// GET - Получение артефакта с поддержкой версионирования
GET /api/artifact?id=uuid                           // Все версии
GET /api/artifact?id=uuid&version=N                 // Версия по номеру (1-based)
GET /api/artifact?id=uuid&versionTimestamp=ISO      // Версия по timestamp

// POST - Создание новой версии
POST /api/artifact { id, title, content, kind }

// DELETE - Удаление версий после timestamp
DELETE /api/artifact?id=uuid&deleteVersionsAfter=ISO
```

**`/api/artifacts/route.ts`** - Список артефактов:
```typescript
GET /api/artifacts?page=N&limit=M&kind=text&searchQuery=term
```

**`/api/artifacts/recent/route.ts`** - Недавние артефакты для quick access

### 🔄 Логика версионирования в API

**Функция `getArtifactById`** (`lib/db/queries.ts`):
```typescript
export async function getArtifactById({ id, version, versionTimestamp }) {
  const allVersions = await getArtifactsById({ id })
  let doc: Artifact | undefined
  
  // Приоритет: versionTimestamp > version > latest
  if (versionTimestamp) {
    doc = allVersions.find(v => v.createdAt.getTime() === versionTimestamp.getTime())
  }
  if (!doc && version != null && version > 0 && version <= totalVersions) {
    doc = allVersions[version - 1] // 1-based indexing для пользователя
  }
  doc = doc ?? allVersions[totalVersions - 1] // Latest as fallback
  
  return { doc, totalVersions }
}
```

## 3. 🧩 Плагинная система типов артефактов

### Архитектура плагинов

**Структура:** `artifacts/kinds/`
```
artifacts/kinds/
├── artifact-tools.ts      # Центральный реестр плагинов
├── text/
│   ├── server.ts         # Серверная логика генерации
│   └── client.tsx        # React компоненты для UI
├── code/
│   ├── server.ts
│   └── client.tsx
├── site/
└── ...
```

### Интерфейс плагина

**`ArtifactTool`** интерфейс (`artifacts/kinds/artifact-tools.ts`):
```typescript
export interface ArtifactTool {
  kind: ArtifactKind;
  create?: (props: {
    id: string,
    title: string,
    prompt: string,
    session: Session
  }) => Promise<string>;
  update?: (props: {
    document: Artifact,
    description: string,
    session: Session
  }) => Promise<string>;
}
```

### 📄 Реализация типов артефактов

**Text артефакты** (`artifacts/kinds/text/`):
- **Server**: `streamText` для генерации Markdown
- **Client**: Интеграция с `Editor` компонентом, поддержка suggestions
- **Особенности**: Поддержка Markdown синтаксиса, inline редактирование

**Code артефакты** (`artifacts/kinds/code/`):
- **Server**: `streamObject` с Zod схемой для структурированного кода
- **Client**: Pyodide интеграция для выполнения Python кода в браузере
- **Особенности**: Matplotlib визуализации, изолированная среда выполнения

**Site артефакты** (`artifacts/kinds/site/`):
- **Server**: Генерация JSON `SiteDefinition` на основе существующих артефактов
- **Client**: JSON редактор для управления структурой сайта
- **Особенности**: Автопоиск артефактов по тегам, система слотов блоков

## 4. 🔄 Жизненный цикл артефакта

### Этап 1: Создание через AI tools

**AI инструмент `artifactCreate`** (`artifacts/tools/artifactCreate.ts`):
```typescript
execute: async (args: CreateArtifactParams) => {
  // 1. Найти обработчик для типа артефакта
  const handler = artifactTools.find((h) => h.kind === kind)
  
  // 2. Генерация контента через плагин
  const content = await handler.create({ 
    id: artifactId, title, prompt, session 
  })
  
  // 3. Сохранение в БД
  await saveArtifact({
    id: artifactId, title, content, kind,
    userId: session.user.id, 
    authorId: null // Created by AI
  })
  
  // 4. Асинхронная генерация summary (не блокирует response)
  generateAndSaveSummary(artifactId, content, kind)
  
  return { artifactId, status: 'created' }
}
```

### Этап 2: Сохранение в БД

**Функция `saveArtifact`** (`lib/db/queries.ts`):
```typescript
export async function saveArtifact({ id, title, kind, content, userId, authorId, createdAt }) {
  const [savedArtifact] = await db.insert(artifact).values({
    id, title, kind, content, userId, authorId,
    createdAt: createdAt ?? new Date() // Новая версия = новый timestamp
  }).returning()
  
  // Асинхронная генерация summary (фоновая задача)
  generateAndSaveSummary(id, savedArtifact.content, kind).catch(err => {
    childLogger.error({ err }, 'Async summary generation failed')
  })
  
  return [savedArtifact]
}
```

### Этап 3: Загрузка на клиенте

**Паттерн useSWR загрузки**:
```typescript
// Загрузка всех версий артефакта
const { data: artifacts } = useSWR<Array<DBArtifact>>(
  artifact.artifactId && artifact.status !== 'streaming'
    ? `/api/artifact?id=${artifact.artifactId}`
    : null,
  fetcher,
)

// Загрузка конкретной версии (для блоков сайта)
const { data: contentData } = useSWR(
  artifactId
    ? `/api/artifact?id=${artifactId}${versionTimestamp ? `&versionTimestamp=${versionTimestamp}` : ''}`
    : null,
  fetcher,
)
```

### Этап 4: Рендеринг в UI

**Компонент `ArtifactPreview`** (`components/artifact-preview.tsx`):
- Определяет тип артефакта и подгружает соответствующий client.tsx компонент
- Поддерживает split/fullscreen режимы отображения
- Интеграция с версионированием через UI controls

## 5. 🧠 Redis Clipboard система

### Архитектура "Добавить в чат"

**Server Actions** (`app/app/(main)/artifacts/actions.ts`):

```typescript
// Копирование в Redis буфер
export async function copyArtifactToClipboard({ artifactId, title, kind }) {
  const userId = (await auth())?.user?.id
  await withRedis(async (client) => {
    await client.set(
      `user-clipboard:${userId}`, 
      JSON.stringify({ artifactId, title, kind }), 
      { EX: 60 } // TTL 60 секунд
    )
  })
}

// Получение из буфера (НЕ удаляет!)
export async function getArtifactFromClipboard() {
  const userId = (await auth())?.user?.id
  const result = await withRedis(async (client) => {
    return await client.get(`user-clipboard:${userId}`)
  })
  return result ? JSON.parse(result) : null
}

// Ручная очистка буфера
export async function clearArtifactFromClipboard() {
  const userId = (await auth())?.user?.id
  await withRedis(async (client) => {
    await client.del(`user-clipboard:${userId}`)
  })
}
```

### 💡 UX-логика (поведение как системный буфер)

**Поток взаимодействия:**
1. **Кнопка "Добавить в чат"** → `copyArtifactToClipboard` → Redis с TTL 60 секунд
2. **Тост уведомление**: "Ссылка на артефакт скопирована"
3. **При открытии любого чата**: `useEffect` проверяет буфер через `getArtifactFromClipboard`
4. **Черновик вложения**: Показывается UI для подтверждения/отмены
5. **Повторное использование**: Один артефакт можно вставить в несколько чатов
6. **Автоочистка**: Через 60 секунд или при ручной отмене

**Интеграция в ChatInput** (`components/chat-input.tsx`):
```typescript
useEffect(() => {
  const checkClipboard = async () => {
    const clipboardData = await getArtifactFromClipboard()
    if (clipboardData) {
      setAttachmentDraft(clipboardData)
    }
  }
  checkClipboard()
}, [])
```

## 6. ⚡ Асинхронная генерация summary

### Принцип работы

**Проблема**: Генерация summary может занимать 2-5 секунд, что замедляет создание артефакта  
**Решение**: Асинхронная генерация в фоновом режиме

```typescript
// В saveArtifact - НЕ блокирует ответ клиенту
generateAndSaveSummary(id, savedArtifact.content, kind).catch(err => {
  childLogger.error({ err }, 'Async summary generation failed')
})

// Функция генерации summary
async function generateAndSaveSummary(artifactId: string, content: string, kind: ArtifactKind) {
  const summary = await generateTextSummary(content, kind)
  
  await db.update(artifact)
    .set({ summary })
    .where(eq(artifact.id, artifactId))
    .returning()
}
```

### UX implications

- Артефакт сразу доступен для просмотра/редактирования
- Summary появляется через несколько секунд (useSWR автоматически обновляет UI)
- При ошибке генерации summary остается пустым (graceful degradation)

## 7. 🏗️ Система блоков сайта

### Модульная архитектура блоков

**Структура:** `site-blocks/`
```
site-blocks/
├── index.ts              # Реестр всех блоков
├── hero/
│   ├── definition.ts     # Схема блока и слотов
│   └── index.tsx        # React компонент
├── key-contacts/
└── useful-links/
```

### Определение блока

**`site-blocks/hero/definition.ts`**:
```typescript
export const heroBlockDefinition: BlockDefinition = {
  type: 'hero',
  title: 'Hero Section',
  slots: {
    heading: { 
      kind: 'text', 
      tags: ['hero', 'heading'] 
    },
    subheading: { 
      kind: 'text', 
      tags: ['hero', 'subheading'] 
    },
    image: { 
      kind: 'image', 
      tags: ['hero', 'image'] 
    },
  },
}
```

### React компонент блока

**`site-blocks/hero/index.tsx`**:
```typescript
export function HeroBlock({ heading, subheading, image }: HeroBlockProps) {
  // Самостоятельная загрузка контента каждого слота
  const { data: headingData } = useSWR(
    heading?.artifactId 
      ? `/api/artifact?id=${heading.artifactId}${heading.versionTimestamp ? `&versionTimestamp=${heading.versionTimestamp}` : ''}`
      : null,
    fetcher,
  )
  
  // Поддержка skeleton loading
  if (!headingData) return <HeroBlockSkeleton />
  
  return (
    <section className="hero-section">
      <h1>{headingData.content}</h1>
      {/* ... остальной контент */}
    </section>
  )
}
```

### Регистрация блоков

**`site-blocks/index.ts`**:
```typescript
// Для AI-генератора (siteGenerate tool)
export const blockDefinitions: Record<string, BlockDefinition> = {
  hero: heroBlockDefinition,
  'key-contacts': keyContactsBlockDefinition,
  'useful-links': usefulLinksBlockDefinition,
}

// Для рендерера сайтов  
export const blockComponents = {
  hero: HeroBlock,
  'key-contacts': KeyContactsBlock,
  'useful-links': UsefulLinksBlock,
}
```

## 8. 🌐 Рендеринг сайтов

### Публичный хостинг

**Маршрут:** `/app/site/(hosting)/s/[siteId]/page.tsx`

```typescript
export default async function SitePage({ params }: { params: { siteId: string } }) {
  return <SiteRenderer siteId={params.siteId} />
}
```

**SiteRenderer компонент**:
```typescript
export function SiteRenderer({ siteId }: { siteId: string }) {
  // Загрузка артефакта типа 'site'
  const { data } = useSWR<any>(`/api/artifact?id=${siteId}`, fetcher)
  
  const siteArtifact = Array.isArray(data) ? data.at(-1) : data.doc
  const siteDefinition: SiteDefinition = JSON.parse(siteArtifact.content)
  
  return (
    <div className="space-y-6">
      {siteDefinition.blocks.map((block, index) => {
        const Block = blockComponents[block.type]
        return <Block key={`${block.type}-${index}`} {...block.slots} />
      })}
    </div>
  )
}
```

### Поток данных рендеринга

1. **SiteRenderer** загружает артефакт типа 'site' по ID
2. **Парсинг** JSON контента в `SiteDefinition`
3. **Динамический рендеринг** блоков из `blockComponents`
4. **Самостоятельная загрузка** каждым блоком своего контента через API
5. **Skeleton states** во время загрузки данных

## 9. 🏛️ Неочевидные архитектурные решения

### 1. 📄 Сайт как артефакт
**Решение**: Вместо отдельной сущности "Site", используется артефакт типа 'site' с JSON контентом  
**Преимущества**: 
- Переиспользование всей логики версионирования
- Унифицированные права доступа и мягкое удаление
- Упрощение архитектуры БД

### 2. 🔑 Композитный первичный ключ
**Решение**: `[id, createdAt]` как PK для версионирования  
**Преимущества**:
- Не требует отдельной таблицы версий
- Естественная сортировка по времени создания
- Простые запросы на получение последней/конкретной версии

### 3. 🎯 Двухуровневая архитектура AI
**Решение**: Центральные AI tools + специализированные плагины  
**Преимущества**:
- Единая точка входа для создания артефактов
- Изолированная логика для каждого типа
- Простота добавления новых типов артефактов

### 4. ⚡ Асинхронный UX
**Решение**: Немедленное отображение + фоновая обработка  
**Преимущества**:
- Быстрый отклик интерфейса
- Плавное обновление через useSWR
- Graceful degradation при ошибках

### 5. 🏗️ Изолированные компоненты блоков
**Решение**: Блоки сайта зависят только от API, не от основного приложения  
**Преимущества**:
- Чистая архитектура и простота тестирования
- Возможность переиспользования блоков
- Независимая разработка и обновление блоков

---

Эта архитектура обеспечивает высокую модульность, масштабируемость и поддерживаемость системы артефактов WelcomeCraft.