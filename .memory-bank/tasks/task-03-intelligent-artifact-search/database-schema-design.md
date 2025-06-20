# 🗄️ Database Schema Design: Интеллектуальный Поиск Артефактов

**Версия:** 1.0.0  
**Дата:** 2025-06-20  
**Связанный Plan:** task-03-intelligent-artifact-search/plan.md  
**Phase:** Phase 1 - Database & Infrastructure

---

## 🎯 Цель Schema Enhancement

Добавить поддержку метаданных для интеллектуального поиска артефактов без нарушения существующей архитектуры и с максимальной производительностью.

### Ключевые Требования
- **Обратная совместимость** - существующие артефакты продолжают работать
- **Performance first** - индексы для быстрого поиска и ранжирования
- **Sparse columns** - следуем паттерну content_text/content_url/content_site_definition
- **JSON flexibility** - гибкая структура метаданных для эволюции алгоритма

---

## 📊 Анализ Текущей Схемы

### Существующая Таблица Artifact
```sql
CREATE TABLE "Artifact" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" timestamp NOT NULL,
  "title" text NOT NULL,
  
  -- Sparse Columns для типизированного контента  
  "content_text" text,
  "content_url" varchar(2048), 
  "content_site_definition" jsonb,
  
  "summary" text NOT NULL DEFAULT '',
  "kind" varchar NOT NULL DEFAULT 'text', -- enum: text, code, image, sheet, site
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "authorId" uuid REFERENCES "User"("id"),
  "deletedAt" timestamp,
  
  -- Publication System
  "publication_state" jsonb DEFAULT '[]'::jsonb NOT NULL,
  
  -- Testing Infrastructure  
  "world_id" varchar(64),
  
  PRIMARY KEY ("id", "createdAt")
);
```

### Существующие Индексы
```sql
-- Основные индексы (предполагаемые на основе queries.ts)
CREATE INDEX idx_artifact_user_created ON "Artifact" ("userId", "createdAt");
CREATE INDEX idx_artifact_kind ON "Artifact" ("kind");
CREATE INDEX idx_artifact_deleted ON "Artifact" ("deletedAt");
```

---

## 🆕 Предлагаемые Изменения Схемы

### 1. Новые Поля в Таблице Artifact

```sql
-- Migration: 0006_intelligent_search.sql
-- Phase 1: Базовая инфраструктура для интеллектуального поиска

-- Добавляем поля для интеллектуального поиска
ALTER TABLE "Artifact" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "Artifact" ADD COLUMN "quality_score" decimal(3,2);
ALTER TABLE "Artifact" ADD COLUMN "last_analyzed_at" timestamp;

-- Добавляем полнотекстовый поиск
ALTER TABLE "Artifact" ADD COLUMN "search_vector" tsvector;
```

### 2. Структура Поля `metadata`

```typescript
interface ArtifactMetadata {
  // Качество контента (Content Quality Analysis)
  contentQuality?: {
    score: number;                    // 0.0 - 1.0
    issues: string[];                 // ['localhost-urls', 'placeholder-content', 'broken-links']
    lastChecked: string;              // ISO timestamp  
    analyzer: {
      version: string;                // '1.0.0'
      model: string;                  // 'gemini-1.5-flash'
      processingTime: number;         // ms
    };
  };
  
  // Контекстуальная релевантность (Context Relevance Analysis)
  contextRelevance?: {
    extractedTags: string[];          // AI-извлеченные теги
    semanticTopics: string[];         // Семантические темы  
    targetRoles: string[];            // ['designer', 'developer', 'hr']
    departments: string[];            // ['creative', 'engineering', 'people']
    language: string;                 // 'ru', 'en'
    readabilityScore?: number;        // 0.0 - 1.0
    professionalTone?: number;        // 0.0 - 1.0
  };
  
  // Предпочтения и поведение пользователей (User Preferences)
  userPreferences?: {
    [userId: string]: {
      usageCount: number;             // Сколько раз использовался этим пользователем
      lastUsed: string;               // Последнее использование (ISO)
      explicitRating?: number;        // 1-5, если пользователь оценил
      implicitScore?: number;         // 0.0-1.0, на основе поведения
      contexts: string[];             // В каких контекстах использовался
    };
  };
  
  // Техническая информация (Technical Analysis)
  technical?: {
    wordCount?: number;               // Количество слов
    characterCount?: number;          // Количество символов
    hasUrls?: boolean;                // Есть ли ссылки
    urlCount?: number;                // Количество ссылок
    hasLocalhostUrls?: boolean;       // Есть ли localhost ссылки
    hasPlaceholders?: boolean;        // Есть ли placeholder контент
    markdownStructure?: {             // Для markdown контента
      headings: number;
      lists: number;
      codeBlocks: number;
    };
    csvStructure?: {                  // Для CSV контента
      rows: number;
      columns: number;
      headers: string[];
    };
  };
  
  // Поисковая оптимизация (Search Optimization)
  searchOptimization?: {
    keyPhrases: string[];             // Ключевые фразы для поиска
    synonyms: string[];               // Синонимы для расширения поиска
    searchableContent: string;        // Нормализованный контент для поиска
    lastIndexed: string;              // Когда последний раз индексировался
  };
  
  // Аналитика использования (Usage Analytics)
  analytics?: {
    totalViews: number;               // Сколько раз просматривался
    totalUsage: number;               // Сколько раз использовался в сайтах
    averageRating?: number;           // Средняя оценка пользователей
    successRate?: number;             // % успешных использований
    lastUsed: string;                 // Последнее использование (глобально)
    popularContexts: string[];        // Популярные контексты использования
  };
}
```

### 3. Поле `quality_score` 

```sql
-- Денормализованная оценка качества для быстрого поиска
"quality_score" decimal(3,2) -- 0.00 до 1.00
```

**Логика расчета:**
- Извлекается из `metadata.contentQuality.score`
- Обновляется при каждом анализе контента
- Используется в WHERE clauses для фильтрации
- NULL = не анализировался, требует анализа

### 4. Поле `last_analyzed_at`

```sql  
-- Timestamp последнего AI анализа
"last_analyzed_at" timestamp
```

**Назначение:**
- Определить устаревшие анализы для переобработки
- Планирование batch обновлений метаданных
- Мониторинг покрытия анализом

### 5. Поле `search_vector` (Full-Text Search)

```sql
-- PostgreSQL tsvector для полнотекстового поиска
"search_vector" tsvector
```

**Содержимое:**
- Title (weight A - максимальный)
- Summary (weight B - высокий) 
- Content (weight C - средний)
- Extracted tags (weight B - высокий)

---

## 🚀 Новые Индексы для Performance

### 1. Индексы для Метаданных

```sql
-- GIN индекс для JSONB метаданных (гибкий поиск)
CREATE INDEX CONCURRENTLY "idx_artifact_metadata_gin" 
ON "Artifact" USING gin ("metadata");

-- Specialized индексы для часто используемых полей метаданных
CREATE INDEX CONCURRENTLY "idx_artifact_metadata_quality" 
ON "Artifact" USING gin ((metadata->'contentQuality'));

CREATE INDEX CONCURRENTLY "idx_artifact_metadata_relevance" 
ON "Artifact" USING gin ((metadata->'contextRelevance'));

-- Индекс для поиска по тегам
CREATE INDEX CONCURRENTLY "idx_artifact_metadata_tags" 
ON "Artifact" USING gin ((metadata->'contextRelevance'->'extractedTags'));
```

### 2. Индексы для Quality Score

```sql
-- Ранжирование по качеству
CREATE INDEX CONCURRENTLY "idx_artifact_quality_score" 
ON "Artifact" ("quality_score") 
WHERE "deletedAt" IS NULL;

-- Композитный индекс: kind + quality для быстрого поиска
CREATE INDEX CONCURRENTLY "idx_artifact_kind_quality" 
ON "Artifact" ("kind", "quality_score") 
WHERE "deletedAt" IS NULL;

-- Композитный индекс: user + quality для персонализации
CREATE INDEX CONCURRENTLY "idx_artifact_user_quality" 
ON "Artifact" ("userId", "quality_score", "createdAt") 
WHERE "deletedAt" IS NULL;
```

### 3. Индексы для Full-Text Search

```sql
-- GIN индекс для tsvector полнотекстового поиска
CREATE INDEX CONCURRENTLY "idx_artifact_search_vector" 
ON "Artifact" USING gin ("search_vector");

-- Комбинированный индекс для поиска + фильтрации
CREATE INDEX CONCURRENTLY "idx_artifact_search_kind_quality" 
ON "Artifact" ("kind", "quality_score") 
WHERE "deletedAt" IS NULL AND "search_vector" IS NOT NULL;
```

### 4. Индексы для Временных Метрик

```sql
-- Для определения устаревших анализов
CREATE INDEX CONCURRENTLY "idx_artifact_analysis_freshness" 
ON "Artifact" ("last_analyzed_at", "createdAt") 
WHERE "deletedAt" IS NULL;

-- Для batch processing
CREATE INDEX CONCURRENTLY "idx_artifact_needs_analysis" 
ON "Artifact" ("kind", "last_analyzed_at") 
WHERE "deletedAt" IS NULL AND ("last_analyzed_at" IS NULL OR "quality_score" IS NULL);
```

---

## 📝 Migration Script

### Migration File: `0006_intelligent_search.sql`

```sql
-- Migration: 0006_intelligent_search.sql
-- Purpose: Add intelligent search infrastructure to Artifact table
-- Date: 2025-06-20
-- Phase: 1 - Database & Infrastructure

-- 1. Add new columns
ALTER TABLE "Artifact" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "Artifact" ADD COLUMN "quality_score" decimal(3,2);
ALTER TABLE "Artifact" ADD COLUMN "last_analyzed_at" timestamp;
ALTER TABLE "Artifact" ADD COLUMN "search_vector" tsvector;

-- 2. Create GIN indexes for JSONB fields (non-blocking)
CREATE INDEX CONCURRENTLY "idx_artifact_metadata_gin" 
ON "Artifact" USING gin ("metadata");

CREATE INDEX CONCURRENTLY "idx_artifact_metadata_quality" 
ON "Artifact" USING gin ((metadata->'contentQuality'));

CREATE INDEX CONCURRENTLY "idx_artifact_metadata_relevance" 
ON "Artifact" USING gin ((metadata->'contextRelevance'));

CREATE INDEX CONCURRENTLY "idx_artifact_metadata_tags" 
ON "Artifact" USING gin ((metadata->'contextRelevance'->'extractedTags'));

-- 3. Create indexes for quality score
CREATE INDEX CONCURRENTLY "idx_artifact_quality_score" 
ON "Artifact" ("quality_score") 
WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY "idx_artifact_kind_quality" 
ON "Artifact" ("kind", "quality_score") 
WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY "idx_artifact_user_quality" 
ON "Artifact" ("userId", "quality_score", "createdAt") 
WHERE "deletedAt" IS NULL;

-- 4. Create full-text search indexes
CREATE INDEX CONCURRENTLY "idx_artifact_search_vector" 
ON "Artifact" USING gin ("search_vector");

CREATE INDEX CONCURRENTLY "idx_artifact_search_kind_quality" 
ON "Artifact" ("kind", "quality_score") 
WHERE "deletedAt" IS NULL AND "search_vector" IS NOT NULL;

-- 5. Create temporal indexes
CREATE INDEX CONCURRENTLY "idx_artifact_analysis_freshness" 
ON "Artifact" ("last_analyzed_at", "createdAt") 
WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY "idx_artifact_needs_analysis" 
ON "Artifact" ("kind", "last_analyzed_at") 
WHERE "deletedAt" IS NULL AND ("last_analyzed_at" IS NULL OR "quality_score" IS NULL);

-- 6. Create function for updating search_vector
CREATE OR REPLACE FUNCTION update_artifact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Combine title, summary, content and metadata for full-text search
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.content_text, '')), 'C') ||
    setweight(to_tsvector('russian', COALESCE(
      array_to_string(
        ARRAY(SELECT jsonb_array_elements_text(NEW.metadata->'contextRelevance'->'extractedTags')), 
        ' '
      ), ''
    )), 'B');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic search_vector updates
DROP TRIGGER IF EXISTS trigger_update_artifact_search_vector ON "Artifact";
CREATE TRIGGER trigger_update_artifact_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content_text, metadata
  ON "Artifact"
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_search_vector();

-- 8. Initial population of search_vector for existing artifacts
UPDATE "Artifact" 
SET search_vector = 
  setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(summary, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(content_text, '')), 'C')
WHERE search_vector IS NULL;
```

---

## 🔧 TypeScript Schema Updates

### Update `lib/db/schema.ts`

```typescript
// Добавить новые поля в artifact table definition
export const artifact = pgTable(
  'Artifact',
  {
    // ... существующие поля ...
    
    // 🆕 Intelligent Search Infrastructure
    metadata: jsonb('metadata').$type<ArtifactMetadata>().default({}).notNull(),
    quality_score: decimal('quality_score', { precision: 3, scale: 2 }),
    last_analyzed_at: timestamp('last_analyzed_at'),
    search_vector: text('search_vector'), // PostgreSQL tsvector as text in TypeScript
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    }
  },
)
```

### New TypeScript Types

```typescript
// lib/types/intelligent-search.ts
export interface ArtifactMetadata {
  contentQuality?: ContentQualityMetadata;
  contextRelevance?: ContextRelevanceMetadata;
  userPreferences?: Record<string, UserPreferenceMetadata>;
  technical?: TechnicalMetadata;
  searchOptimization?: SearchOptimizationMetadata;
  analytics?: AnalyticsMetadata;
}

export interface ContentQualityMetadata {
  score: number;
  issues: string[];
  lastChecked: string;
  analyzer: {
    version: string;
    model: string;
    processingTime: number;
  };
}

// ... остальные интерфейсы ...
```

---

## 📈 Performance Considerations

### Index Usage Patterns

```sql
-- Типичные запросы и их index usage:

-- 1. Smart search with quality filter
SELECT * FROM "Artifact" 
WHERE "kind" = 'text' 
  AND "quality_score" > 0.7 
  AND "deletedAt" IS NULL
ORDER BY "quality_score" DESC;
-- Uses: idx_artifact_kind_quality

-- 2. Full-text search with metadata filtering  
SELECT * FROM "Artifact"
WHERE "search_vector" @@ to_tsquery('дизайн & ссылки')
  AND metadata->'contextRelevance'->'targetRoles' ? 'designer'
  AND "deletedAt" IS NULL;
-- Uses: idx_artifact_search_vector + idx_artifact_metadata_relevance

-- 3. User preference based search
SELECT * FROM "Artifact"
WHERE "userId" = $1
  AND "quality_score" > 0.5
  AND metadata->'userPreferences'->$1->>'usageCount' IS NOT NULL
ORDER BY (metadata->'userPreferences'->$1->>'usageCount')::int DESC;
-- Uses: idx_artifact_user_quality + idx_artifact_metadata_gin

-- 4. Find artifacts needing analysis
SELECT "id", "kind", "createdAt" FROM "Artifact"
WHERE "deletedAt" IS NULL
  AND ("last_analyzed_at" IS NULL OR "last_analyzed_at" < NOW() - INTERVAL '30 days')
ORDER BY "createdAt" DESC;
-- Uses: idx_artifact_needs_analysis
```

### Estimated Storage Impact

```
Existing Artifact table: ~500KB per 1000 artifacts
New metadata field: ~2KB per artifact average (JSONB compressed)
New indexes: ~20% of table size additional
Total increase: ~25% storage for significant search performance gain
```

---

## 🧪 Migration Testing Strategy

### 1. Pre-Migration Validation
```sql
-- Проверка существующих данных
SELECT COUNT(*) as total_artifacts,
       COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active_artifacts,
       COUNT(DISTINCT "kind") as unique_kinds
FROM "Artifact";
```

### 2. Post-Migration Validation  
```sql
-- Проверка новых полей
SELECT COUNT(*) as total,
       COUNT("metadata") as has_metadata,
       COUNT("quality_score") as has_quality_score,
       COUNT("search_vector") as has_search_vector
FROM "Artifact";

-- Проверка индексов
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Artifact' 
  AND indexname LIKE '%metadata%' OR indexname LIKE '%quality%' OR indexname LIKE '%search%';
```

### 3. Performance Testing
```sql
-- Тест производительности поиска
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "Artifact" 
WHERE "kind" = 'text' 
  AND "quality_score" > 0.7 
ORDER BY "quality_score" DESC 
LIMIT 20;
```

---

## ✅ Acceptance Criteria

- [ ] **Schema Compatibility:** Все существующие запросы продолжают работать без изменений
- [ ] **Migration Safety:** Миграция выполняется без блокировки таблицы (CONCURRENTLY)
- [ ] **Index Performance:** Query time для smart search < 100ms на таблице с 10K артефактов
- [ ] **Storage Efficiency:** Увеличение размера БД < 30% от текущего размера
- [ ] **TypeScript Integration:** Новые типы проходят typecheck без ошибок
- [ ] **Backward Compatibility:** Существующий API продолжает работать
- [ ] **Test Coverage:** Unit tests для всех новых database queries

---

## 🚀 Deployment Plan

### Phase 1: Schema Preparation (Current)
1. ✅ Design schema changes 
2. ⏳ Create migration script
3. ⏳ Update TypeScript types
4. ⏳ Test migration on staging

### Phase 2: Gradual Rollout  
1. Deploy migration to production (low-impact)
2. Start background analysis of existing artifacts
3. Populate metadata for top 100 most-used artifacts
4. Monitor performance and storage impact

### Phase 3: Smart Search Integration
1. Deploy AI Content Analyzer
2. Deploy Smart Search Engine  
3. Integrate with siteTool
4. Full system testing

---

> **Next Step:** После утверждения schema design переходим к созданию и тестированию migration script, затем к реализации AI Content Analyzer (Phase 2).