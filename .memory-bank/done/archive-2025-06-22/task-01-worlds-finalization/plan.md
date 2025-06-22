# TASK-01: Финализация системы "Миров" - Интеграция world_id в Seed Engine

## Текущее состояние

### ✅ Что уже готово:
1. **Schema**: В `lib/db/schema.ts` поля `world_id` добавлены во все таблицы (user, chat, artifact, message, suggestion)
2. **Миграции**: Выполнена миграция `0003_uneven_blindfold.sql` для добавления полей
3. **World Validation**: Система валидации миров работает с fixture файлами

### ❌ Что нужно исправить:
1. **SeedEngine**: Методы `bulkCreate*` не используют `world_id` при создании записей
2. **Cleanup**: Метод `cleanupWorld` содержит только TODO-заглушку
3. **Изоляция данных**: Без правильного `world_id` тесты будут видеть данные друг друга

## План реализации

### ЭТАП 1: Интеграция world_id в bulk операции

#### 1.1 Модификация `bulkCreateUsers`
```typescript
// Файл: tests/helpers/seed-engine.ts, строка ~126
// БЫЛО:
const userRecords = users.map((userData, index) => ({
  id: this.generateUserId(userData.testId, timestamp, index),
  email: userData.email,
  name: userData.name,
}))

// СТАНЕТ:
const userRecords = users.map((userData, index) => ({
  id: this.generateUserId(userData.testId, timestamp, index),
  email: userData.email,
  name: userData.name,
  world_id: worldId, // ← ДОБАВИТЬ ЭТО ПОЛЕ
}))
```

#### 1.2 Модификация `bulkCreateArtifacts`
- Добавить `world_id: worldId` в создаваемые записи
- Найти строку где создается объект записи для `db.insert(artifact).values(...)`

#### 1.3 Модификация `bulkCreateChats`
- Добавить `world_id: worldId` в создаваемые записи

#### 1.4 Модификация `bulkCreateMessages`
- Добавить `world_id: worldId` в создаваемые записи

### ЭТАП 2: Реализация cleanupWorld

#### 2.1 Импорты
Убедиться что импортированы:
```typescript
import { eq } from 'drizzle-orm'
import { user, chat, artifact, message, suggestion } from '@/lib/db/schema'
```

#### 2.2 Реализация метода
```typescript
async cleanupWorld(worldId: WorldId): Promise<void> {
  console.log(`🧹 SEED ENGINE: Cleaning up world ${worldId}...`)
  
  try {
    // Удаляем в обратном порядке зависимостей для соблюдения FK constraints
    // 1. Сообщения
    await db.delete(message).where(eq(message.world_id, worldId))
    // 2. Предложения  
    await db.delete(suggestion).where(eq(suggestion.world_id, worldId))
    // 3. Артефакты
    await db.delete(artifact).where(eq(artifact.world_id, worldId))
    // 4. Чаты
    await db.delete(chat).where(eq(chat.world_id, worldId))
    // 5. Пользователи
    await db.delete(user).where(eq(user.world_id, worldId))
    
    console.log(`✅ SEED ENGINE: World ${worldId} cleaned up successfully`)
  } catch (error) {
    console.error(`❌ SEED ENGINE: Failed to cleanup world ${worldId}:`, error)
    throw error
  }
}
```

## Критические моменты

1. **Порядок удаления**: КРИТИЧЕСКИ ВАЖЕН для соблюдения foreign key constraints
2. **Тестирование**: После изменений нужно проверить что валидация миров по-прежнему проходит
3. **Совместимость**: Production данные имеют `world_id = NULL`, тестовые - конкретный ID

## Ожидаемый результат

После завершения:
- Все записи в БД созданные через SeedEngine будут иметь правильный `world_id`
- Метод `cleanupWorld` будет полностью функционален
- Тесты получат полную изоляцию данных по мирам
- Валидация миров продолжит работать корректно

## Файлы для изменения

1. `tests/helpers/seed-engine.ts` - основные изменения
2. Возможно потребуется обновить импорты из `@/lib/db/schema`

## Команды для тестирования

```bash
# Проверить валидацию миров
pnpm test:validate-worlds

# Запустить unit тесты включая валидацию
pnpm test:unit

# Проверить что E2E тесты по-прежнему работают
pnpm test:e2e --shard=1/4
```