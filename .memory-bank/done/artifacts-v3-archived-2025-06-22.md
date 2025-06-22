# 🏗️ UC-10 Schema-Driven Artifacts Architecture

**Версия:** 3.0.0  
**Дата:** 2025-06-20  
**Источник:** UC-10 Schema-Driven CMS Refactoring  
**Обновлено:** Полная трансформация в schema-driven архитектуру с специализированными таблицами и artifact savers registry

## 1. 🎯 Философия UC-10: От MVP к Enterprise-Ready CMS

UC-10 представляет фундаментальную трансформацию WelcomeCraft из MVP архитектуры в масштабируемую enterprise-ready CMS систему, основанную на принципах:

### 1.1. Schema-Driven Design
**Принцип:** Каждый тип артефакта имеет собственную оптимизированную схему данных и специализированную таблицу БД.

**Преимущества:**
- **Типобезопасность:** Строгая типизация на уровне БД и TypeScript
- **Производительность:** Оптимизированные индексы и запросы для каждого типа
- **Расширяемость:** Простое добавление новых типов артефактов
- **Читаемость:** Ясная структура данных без универсальных JSON полей

### 1.2. Единая Терминология (обновлена для UC-10)

* **База данных:**
    * Основная таблица: `Artifact` (метаданные)
    * Специализированные таблицы: `A_Text`, `A_Image`, `A_Person`, `A_Address`, `A_FaqItem`, `A_Link`, `A_SetDefinition`, `A_SetItems`, `A_Site`
    * Схема Drizzle: Нормализованная структура с FK отношениями

* **Типы артефактов (расширенные):**
    * Базовые: `text`, `code`, `image`, `sheet`, `site`
    * Новые HR-ориентированные: `person`, `address`, `faq-item`
    * Системные: `link`, `set-definition`, `set`

* **AI Инструменты (без изменений):**
    * `artifactCreate`, `artifactUpdate`, `artifactEnhance`, `artifactDelete`, `artifactRestore`

## 2. 🏛️ UC-10 Database Schema Architecture

### 2.1. Основная таблица Artifact (Метаданные)

```sql
CREATE TABLE "Artifact" (
  "id" varchar(255) PRIMARY KEY,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "title" varchar(255) NOT NULL,
  "summary" text,
  "kind" artifact_kind NOT NULL,
  "userId" varchar(255) NOT NULL,
  "authorId" varchar(255),
  "deletedAt" timestamp DEFAULT NULL,
  "publication_state" jsonb DEFAULT '[]'::jsonb,
  "world_id" varchar(255) -- для тестовых данных
);
```

**Изменения от Sparse Columns:**
- ❌ Удалены: `content_text`, `content_url`, `content_site_definition`
- ✅ Добавлены: FK связи со специализированными таблицами
- ✅ Сохранены: все метаданные, версионирование, публикация

### 2.2. Специализированные таблицы данных

```sql
-- Текстовый контент и код
CREATE TABLE "A_Text" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "content" text NOT NULL,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- Изображения и файлы
CREATE TABLE "A_Image" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "url" varchar(2048) NOT NULL,
  "filename" varchar(255),
  "mimeType" varchar(100),
  "fileSize" integer,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- HR: Персональные данные
CREATE TABLE "A_Person" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "fullName" varchar(255) NOT NULL,
  "position" varchar(255),
  "department" varchar(255),
  "email" varchar(255),
  "phone" varchar(50),
  "photo_url" varchar(2048),
  "bio" text,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- HR: Адресные данные
CREATE TABLE "A_Address" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "street" varchar(255),
  "city" varchar(100),
  "state" varchar(100),
  "country" varchar(100),
  "postalCode" varchar(20),
  "type" varchar(50) DEFAULT 'office', -- office, home, shipping
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- Сайты (JSON definition сохраняется)
CREATE TABLE "A_Site" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "definition" jsonb NOT NULL,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- FAQ и документация
CREATE TABLE "A_FaqItem" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "category" varchar(100),
  "tags" jsonb DEFAULT '[]'::jsonb,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- Ссылки и ресурсы
CREATE TABLE "A_Link" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "url" varchar(2048) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "category" varchar(100),
  "isInternal" boolean DEFAULT false,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- Определения наборов данных
CREATE TABLE "A_SetDefinition" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "schema" jsonb NOT NULL, -- JSON Schema for validation
  "defaultValues" jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);

-- Элементы наборов
CREATE TABLE "A_SetItems" (
  "artifactId" varchar(255) NOT NULL,
  "createdAt" timestamp NOT NULL,
  "setDefinitionId" varchar(255) NOT NULL,
  "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY ("artifactId", "createdAt"),
  FOREIGN KEY ("artifactId", "createdAt") REFERENCES "Artifact"("id", "createdAt")
);
```

### 2.3. Индексы для производительности

```sql
-- Производительность поиска по типу
CREATE INDEX idx_artifact_kind_user ON "Artifact"("kind", "userId") WHERE "deletedAt" IS NULL;

-- Поиск по контенту (text search)
CREATE INDEX idx_a_text_content_gin ON "A_Text" USING gin(to_tsvector('english', content));

-- HR поиск
CREATE INDEX idx_a_person_name ON "A_Person"("fullName");
CREATE INDEX idx_a_person_department ON "A_Person"("department");

-- FAQ категории
CREATE INDEX idx_a_faq_category ON "A_FaqItem"("category");

-- Ссылки по категориям
CREATE INDEX idx_a_link_category ON "A_Link"("category");
```

## 3. 🔧 Artifact Savers Registry Pattern

### 3.1. Архитектура диспетчера

UC-10 вводит централизованный **Artifact Savers Registry** — паттерн диспетчера для управления сохранением всех типов артефактов.

**Файл:** `artifacts/artifact-savers.ts`

```typescript
interface ArtifactSaver {
  save: (artifact: Artifact, content: string, metadata?: Record<string, any>) => Promise<void>;
  load: (artifactId: string, createdAt: Date) => Promise<string | null>;
  delete: (artifactId: string, createdAt: Date) => Promise<void>;
}

export const artifactSavers: Record<ArtifactKind, ArtifactSaver> = {
  'text': () => import('./kinds/text/server').then(m => m.textSaver),
  'code': () => import('./kinds/text/server').then(m => m.textSaver), // переиспользует text
  'image': () => import('./kinds/image/server').then(m => m.imageSaver),
  'sheet': () => import('./kinds/text/server').then(m => m.textSaver), // CSV как text
  'site': () => import('./kinds/site/server').then(m => m.siteSaver),
  'person': () => import('./kinds/person/server').then(m => m.personSaver),
  'address': () => import('./kinds/address/server').then(m => m.addressSaver),
  'faq-item': () => import('./kinds/faq-item/server').then(m => m.faqSaver),
  'link': () => import('./kinds/link/server').then(m => m.linkSaver),
  'set-definition': () => import('./kinds/set-definition/server').then(m => m.setDefinitionSaver),
  'set': () => import('./kinds/set/server').then(m => m.setSaver)
};

export async function saveArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const saver = await artifactSavers[artifact.kind]();
  return saver.save(artifact, content, metadata);
}
```

### 3.2. Преимущества паттерна диспетчера

1. **Единообразие:** Все типы следуют одному интерфейсу
2. **Lazy Loading:** Саверы загружаются только при необходимости
3. **Типобезопасность:** TypeScript проверяет соответствие типов
4. **Расширяемость:** Новые типы добавляются декларативно
5. **Тестируемость:** Легкое мокирование для unit тестов

### 3.3. Пример реализации сейвера

**Файл:** `artifacts/kinds/person/server.ts`

```typescript
import { db } from '@/lib/db/connection'
import { personTable } from '@/lib/db/schema'
import type { Artifact, ArtifactSaver } from '@/lib/types'

async function savePersonArtifact(
  artifact: Artifact, 
  content: string, 
  metadata?: Record<string, any>
): Promise<void> {
  const personData = JSON.parse(content) as PersonData;
  
  await db.insert(personTable).values({
    artifactId: artifact.id,
    createdAt: artifact.createdAt,
    fullName: personData.fullName,
    position: personData.position,
    department: personData.department,
    email: personData.email,
    phone: personData.phone,
    photo_url: personData.photo_url,
    bio: personData.bio
  });
}

async function loadPersonArtifact(
  artifactId: string, 
  createdAt: Date
): Promise<string | null> {
  const person = await db.select()
    .from(personTable)
    .where(
      and(
        eq(personTable.artifactId, artifactId),
        eq(personTable.createdAt, createdAt)
      )
    )
    .limit(1);
    
  return person[0] ? JSON.stringify(person[0]) : null;
}

async function deletePersonArtifact(
  artifactId: string, 
  createdAt: Date
): Promise<void> {
  await db.delete(personTable)
    .where(
      and(
        eq(personTable.artifactId, artifactId),
        eq(personTable.createdAt, createdAt)
      )
    );
}

export const personSaver: ArtifactSaver = {
  save: savePersonArtifact,
  load: loadPersonArtifact,
  delete: deletePersonArtifact
};
```

## 4. 📁 File Import System (UC-10)

### 4.1. Архитектура импорта файлов

UC-10 вводит полноценную систему импорта файлов с автоматическим определением типа артефакта и конвертацией в соответствующие типы.

**Файл:** `lib/file-import-system.ts`

```typescript
interface ImportResult {
  artifactKind: ArtifactKind;
  content: string;
  metadata: Record<string, any>;
  title: string;
}

export async function importFileToArtifact(
  fileUrl: string, 
  mimeType?: string
): Promise<ImportResult> {
  const response = await fetch(fileUrl);
  const fileBuffer = await response.arrayBuffer();
  const filename = getFilenameFromUrl(fileUrl);
  
  // Автоматическое определение типа по расширению/MIME
  if (filename.endsWith('.docx')) {
    return convertDocxToText(fileBuffer, filename);
  } else if (filename.endsWith('.xlsx')) {
    return convertXlsxToSheet(fileBuffer, filename);
  } else if (filename.endsWith('.csv')) {
    return convertCsvToSheet(fileBuffer, filename);
  } else if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return convertImageToArtifact(fileUrl, filename);
  } else if (filename.endsWith('.md')) {
    return convertMarkdownToText(fileBuffer, filename);
  } else {
    return convertPlainTextToText(fileBuffer, filename);
  }
}

async function convertDocxToText(
  fileBuffer: ArrayBuffer, 
  filename: string
): Promise<ImportResult> {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
  
  return {
    artifactKind: 'text',
    content: result.value,
    metadata: { 
      originalFilename: filename,
      originalFormat: 'docx',
      importedAt: new Date().toISOString()
    },
    title: filename.replace('.docx', '') || 'Imported Document'
  };
}

async function convertXlsxToSheet(
  fileBuffer: ArrayBuffer, 
  filename: string
): Promise<ImportResult> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  
  return {
    artifactKind: 'sheet',
    content: csvContent,
    metadata: { 
      originalFilename: filename,
      originalFormat: 'xlsx',
      sheetName: workbook.SheetNames[0],
      importedAt: new Date().toISOString()
    },
    title: filename.replace('.xlsx', '') || 'Imported Spreadsheet'
  };
}
```

### 4.2. API Integration

**Файл:** `app/api/artifacts/import/route.ts`

```typescript
import { importFileToArtifact } from '@/lib/file-import-system'
import { saveArtifact as dbSaveArtifact } from '@/lib/db/queries'
import { saveArtifact as artifactSaverDispatcher } from '@/artifacts/artifact-savers'

export async function POST(request: Request) {
  const { fileUrl } = await request.json();
  
  // 1. Импортируем файл и определяем тип артефакта
  const importResult = await importFileToArtifact(fileUrl);
  
  // 2. Создаем запись в основной таблице Artifact
  const artifact = await dbSaveArtifact({
    title: importResult.title,
    kind: importResult.artifactKind,
    userId: session.user.id,
    // ... другие поля
  });
  
  // 3. Сохраняем в специализированную таблицу через диспетчер
  await artifactSaverDispatcher(artifact, importResult.content, importResult.metadata);
  
  return NextResponse.json({ artifactId: artifact.id });
}
```

## 5. 🔄 Migration Strategy (UC-10)

### 5.1. Миграция данных из Sparse Columns

**Файл:** `lib/db/migrations/0006_schema_driven_artifacts.sql`

```sql
-- 1. Создание специализированных таблиц
-- (см. секцию 2.2)

-- 2. Миграция данных из sparse columns
INSERT INTO "A_Text" ("artifactId", "createdAt", "content")
SELECT "id", "createdAt", "content_text"
FROM "Artifact" 
WHERE "kind" IN ('text', 'code', 'sheet') 
  AND "content_text" IS NOT NULL;

INSERT INTO "A_Image" ("artifactId", "createdAt", "url")
SELECT "id", "createdAt", "content_url"
FROM "Artifact" 
WHERE "kind" = 'image' 
  AND "content_url" IS NOT NULL;

INSERT INTO "A_Site" ("artifactId", "createdAt", "definition")
SELECT "id", "createdAt", "content_site_definition"
FROM "Artifact" 
WHERE "kind" = 'site' 
  AND "content_site_definition" IS NOT NULL;

-- 3. Удаление sparse columns
ALTER TABLE "Artifact" DROP COLUMN "content_text";
ALTER TABLE "Artifact" DROP COLUMN "content_url";  
ALTER TABLE "Artifact" DROP COLUMN "content_site_definition";

-- 4. Обновление enum для новых типов
ALTER TYPE artifact_kind ADD VALUE 'person';
ALTER TYPE artifact_kind ADD VALUE 'address';
ALTER TYPE artifact_kind ADD VALUE 'faq-item';
ALTER TYPE artifact_kind ADD VALUE 'link';
ALTER TYPE artifact_kind ADD VALUE 'set-definition';
ALTER TYPE artifact_kind ADD VALUE 'set';
```

### 5.2. Automatic Data Migration Triggers

```sql
-- Автоматическое обновление метаданных при изменении контента
CREATE OR REPLACE FUNCTION update_artifact_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Artifact" 
  SET "summary" = NULL  -- Триггер для regeneration summary
  WHERE "id" = NEW."artifactId" AND "createdAt" = NEW."createdAt";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер ко всем специализированным таблицам
CREATE TRIGGER update_artifact_metadata_text
  AFTER INSERT OR UPDATE ON "A_Text"
  FOR EACH ROW EXECUTE FUNCTION update_artifact_metadata();

CREATE TRIGGER update_artifact_metadata_person
  AFTER INSERT OR UPDATE ON "A_Person"
  FOR EACH ROW EXECUTE FUNCTION update_artifact_metadata();
  
-- ... аналогично для остальных таблиц
```

## 6. 🧪 Testing Architecture (UC-10)

### 6.1. Unit Tests для Savers

**Файл:** `tests/unit/artifacts/savers/person-saver.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { personSaver } from '@/artifacts/kinds/person/server'
import { db } from '@/lib/db/connection'

vi.mock('@/lib/db/connection', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockPersonData])
        })
      })
    })
  }
}));

describe('Person Saver', () => {
  it('should save person data to A_Person table', async () => {
    const artifact = createMockArtifact({ kind: 'person' });
    const personContent = JSON.stringify({
      fullName: 'John Doe',
      position: 'Software Engineer',
      department: 'Engineering'
    });
    
    await personSaver.save(artifact, personContent);
    
    expect(db.insert).toHaveBeenCalledWith(personTable);
    // ... проверки аргументов
  });
});
```

### 6.2. E2E Tests для File Import

**Файл:** `tests/e2e/features/file-import.test.ts`

```typescript
test('should import .docx file and create text artifact', async ({ page }) => {
  await page.goto('/');
  
  // Загружаем .docx файл
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./test-files/sample.docx');
  
  // Ждем создания артефакта
  await expect(page.locator('[data-testid="artifact-preview"]')).toBeVisible();
  
  // Проверяем тип артефакта
  const artifactKind = await page.locator('[data-testid="artifact-kind"]').textContent();
  expect(artifactKind).toBe('text');
  
  // Проверяем содержимое
  await page.locator('[data-testid="artifact-preview"]').click();
  const content = await page.locator('[data-testid="artifact-content"]').textContent();
  expect(content).toContain('Expected text from docx');
});
```

## 7. 🎯 Benefits of UC-10 Architecture

### 7.1. Производительность
- **Targeted Queries:** Запросы только к нужным таблицам
- **Optimized Indexes:** Специализированные индексы для каждого типа
- **Reduced I/O:** Нет загрузки ненужных JSON полей

### 7.2. Масштабируемость
- **Horizontal Scaling:** Независимое масштабирование таблиц
- **Storage Optimization:** Эффективное использование дискового пространства
- **Cache Friendly:** Лучше работает с PostgreSQL query cache

### 7.3. Типобезопасность
- **Database Level:** Constraints и типы на уровне БД
- **TypeScript Level:** Строгая типизация интерфейсов
- **Runtime Validation:** JSON Schema валидация для сложных типов

### 7.4. Разработческий опыт
- **Clear Separation:** Четкое разделение ответственности
- **Easy Extension:** Простое добавление новых типов
- **Better Testing:** Изолированное тестирование каждого типа

### 7.5. Миграционная совместимость
- **Zero Downtime:** Безопасная миграция без остановки сервиса
- **Backward Compatible:** API остается прежним для клиентов
- **Rollback Ready:** Возможность отката при проблемах

---

> **UC-10 Summary:** Schema-driven архитектура трансформирует WelcomeCraft в enterprise-ready CMS с оптимизированной производительностью, строгой типизацией и легко расширяемой структурой. Централизованный Artifact Savers Registry обеспечивает единообразие при сохранении гибкости для каждого типа артефакта.