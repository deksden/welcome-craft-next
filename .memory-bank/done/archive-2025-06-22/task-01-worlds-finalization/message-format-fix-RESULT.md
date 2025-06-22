# Исправление проблемы формата сообщений Vercel AI SDK

**Статус:** ✅ ПОЛНОСТЬЮ РЕШЕНО  
**Дата:** 2025-06-18  
**Время выполнения:** 60 минут  

## 🎯 Проблема

В TASK-01 была выявлена критическая несовместимость между форматом сообщений:
- **Старый формат:** `content: string`, `toolInvocations: Array`
- **Новый формат AI SDK:** `parts: Array<UIPart>`, `attachments: Array<Attachment>`

Код использовал старый формат, а схема БД ожидала новый формат.

## 🔍 Исследование

### Изучение Vercel AI SDK типов
- ✅ Проанализированы типы из `@ai-sdk/ui-utils`
- ✅ Понято разделение между `parts` (текст + tool-invocations) и `attachments` (файлы)
- ✅ Выявлена обратная совместимость в SDK

### Найденные проблемы в коде:
1. **seed-engine.ts:** Неправильная обработка `toolInvocations` как `attachments`
2. **chat/actions.ts:** Использование устаревшего формата для извлечения artifact IDs
3. **schema.ts:** Наличие двух схем сообщений создавало путаницу

## 🛠️ Реализованные исправления

### 1. Обновление seed-engine.ts ✅
**Было:**
```typescript
parts: msg.content ? [{ type: 'text', text: msg.content }] : [],
attachments: msg.toolInvocations ? [{ type: 'tool_invocations', data: msg.toolInvocations }] : [],
```

**Стало:**
```typescript
const parts = []
// Добавляем текстовую часть
if (msg.content) {
  parts.push({ type: 'text', text: msg.content })
}
// Добавляем tool invocations как части сообщения (НЕ как attachments!)
if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
  msg.toolInvocations.forEach((toolInvocation: any) => {
    parts.push({
      type: 'tool-invocation',
      toolInvocation: toolInvocation
    })
  })
}
// Файловые вложения остаются attachments
attachments: msg.attachments || []
```

### 2. Исправление chat/actions.ts ✅
**Добавлена поддержка нового формата:**
```typescript
// Поддержка нового формата AI SDK Message_v2
if (part && typeof part === 'object' && (part as any).type === 'tool-invocation') {
  const toolInvocation = (part as any).toolInvocation
  // ... извлечение artifactId
}
// Обратная совместимость со старым форматом
else if (part && typeof part === 'object' && 'toolInvocations' in part) {
  // ... старая логика
}
```

### 3. Удаление устаревшей схемы ✅
- ✅ Удалена таблица `messageDeprecated` из schema.ts
- ✅ Создана миграция `0005_remove_legacy_message.sql`
- ✅ Удален тип `MessageDeprecated` из types.ts
- ✅ Обновлены meta файлы миграций

## 📊 Архитектурные принципы

### Правильный формат AI SDK Message_v2:
```typescript
interface DBMessage {
  parts: Array<{
    type: 'text';
    text: string;
  } | {
    type: 'tool-invocation';
    toolInvocation: ToolInvocation;
  }>;
  attachments: Array<{
    name?: string;
    contentType?: string;
    url: string;
  }>;
}
```

### Конвертация форматов:
1. **Production код:** `msg.parts ?? [{ type: 'text', text: msg.content }]`
2. **Seed-engine:** Правильная конвертация `toolInvocations` в `parts`
3. **Обратная совместимость:** Поддержка старого формата где необходимо

## 🚀 Результаты

### ✅ Достигнуто:
- **Единая схема сообщений:** Только `Message_v2` с правильным форматом
- **Правильная обработка tool invocations:** Как части сообщения, а не attachments
- **Корректная конвертация фикстур:** Старый формат → новый формат
- **Обратная совместимость:** Production код поддерживает оба формата
- **Чистая архитектура:** Удалена путаница с двумя схемами

### ✅ Готовность к использованию:
- **Seed Engine:** Правильно обрабатывает фикстуры в новом формате
- **Production API:** Корректно конвертирует сообщения в БД
- **Extraction логика:** Извлекает artifact IDs из нового формата
- **БД миграции:** Готовы к применению

## 🔗 Связанные файлы

### Основные изменения:
- `tests/helpers/seed-engine.ts` - ✅ Правильная конвертация формата
- `app/app/(main)/chat/actions.ts` - ✅ Поддержка нового формата
- `lib/db/schema.ts` - ✅ Удалена устаревшая схема
- `lib/db/types.ts` - ✅ Удален устаревший тип

### Миграции БД:
- `lib/db/migrations/0005_remove_legacy_message.sql` - ✅ Удаление старой таблицы
- `lib/db/migrations/meta/0005_snapshot.json` - ✅ Snapshot новой схемы
- `lib/db/migrations/meta/_journal.json` - ✅ Обновлен журнал

## 🎯 Критические инсайты

### Архитектурные уроки:
1. **Tool invocations ≠ Attachments:** Tool invocations это части сообщения, а не файловые вложения
2. **Обратная совместимость:** AI SDK поддерживает старый формат через fallback
3. **Единая схема лучше:** Две схемы создают путаницу и ошибки

### Паттерны конвертации:
- **Из старого формата:** `content` → `[{ type: 'text', text: content }]`
- **Tool invocations:** Каждый `toolInvocation` → `{ type: 'tool-invocation', toolInvocation }`
- **Attachments:** Только файловые вложения, НЕ tool invocations

---

**✅ ПРОБЛЕМА ФОРМАТА СООБЩЕНИЙ ПОЛНОСТЬЮ РЕШЕНА**

Система теперь использует единую схему `Message_v2` с правильным форматом AI SDK. Вся конвертация данных работает корректно, путаница с двумя схемами устранена.

// END OF: message-format-fix-RESULT