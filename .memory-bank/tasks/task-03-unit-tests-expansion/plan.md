# TASK-03: Расширение покрытия юнит-тестами

## Цель
Расширить покрытие юнит-тестами для ключевых модулей `queries.ts` и `artifact-content-utils.ts`, а также исправить существующие TypeScript ошибки связанные с `world_id` полями.

## Текущее состояние

### ✅ Что уже есть:
1. **Unit тесты queries.ts** - базовое покрытие `getChatsByUserId` (3 теста)
2. **Vitest настроен** - инфраструктура готова
3. **Моки БД** - паттерн мокирования Drizzle ORM отработан
4. **AI Fixtures Provider** - доступен режим `record-or-replay` для AI-зависимых тестов

### 🎯 Что нужно добавить:
1. **Расширение тестов queries.ts** - покрыть остальные функции
2. **Создание тестов artifact-content-utils.ts** - полное покрытие утилит контента
3. **Исправление world_id ошибок** - добавить поддержку world_id в существующие моки

## План реализации

### ЭТАП 1: Исправление world_id в существующих тестах

#### 1.1 Обновление моков в unit тестах
**Проблема:** TypeScript ошибки из-за отсутствия `world_id` в mock объектах
**Файлы для исправления:**
- `tests/unit/artifacts/tools/*.test.ts` (6 файлов)
- `tests/unit/lib/publication-utils.test.ts`
- `tests/unit/lib/db/queries.test.ts`

**Решение:**
```typescript
// Добавить world_id: null во все mock объекты
const mockArtifact = {
  id: 'test-id',
  // ... existing fields
  world_id: null // Production артефакт
}
```

### ЭТАП 2: Расширение тестов queries.ts

#### 2.1 Дополнительные функции для тестирования
**Приоритетные функции:**
- `getUser(email)` - аутентификация
- `getArtifactById(id, versionTimestamp?)` - получение артефактов
- `saveArtifact()` - создание артефактов
- `getChatById(id)` - получение чатов
- `saveMessages()` - сохранение сообщений

#### 2.2 Структура расширенных тестов
```typescript
describe('Database Queries - Extended Coverage', () => {
  describe('User Queries', () => {
    it('should get user by email')
    it('should return empty array for non-existent user')
  })
  
  describe('Artifact Queries', () => {
    it('should get artifact by id')
    it('should get specific version of artifact')
    it('should save new artifact with correct content mapping')
    it('should handle sparse columns correctly')
  })
  
  describe('Chat Queries', () => {
    it('should get chat by id')
    it('should return undefined for non-existent chat')
  })
  
  describe('Message Queries', () => {
    it('should save messages with correct format')
    it('should handle parts and attachments correctly')
  })
})
```

### ЭТАП 3: Создание тестов artifact-content-utils.ts

#### 3.1 Создание нового файла тестов
**Файл:** `tests/unit/lib/artifact-content-utils.test.ts`

#### 3.2 Полное покрытие функций
**Функции для тестирования:**
- `getDisplayContent(artifact)` - извлечение контента для отображения
- `prepareContentForSave(content, kind)` - подготовка к сохранению
- `normalizeArtifactForAPI(artifact)` - нормализация для API

#### 3.3 Структура тестов
```typescript
describe('Artifact Content Utils', () => {
  describe('getDisplayContent', () => {
    it('should return text content for text artifacts')
    it('should return text content for code artifacts')
    it('should return text content for sheet artifacts')
    it('should return URL for image artifacts')
    it('should return JSON string for site artifacts')
    it('should return empty string for unknown kind')
    it('should handle null/undefined content gracefully')
  })
  
  describe('prepareContentForSave', () => {
    it('should prepare text content correctly')
    it('should prepare image URL correctly') 
    it('should prepare site definition correctly')
    it('should handle JSON parsing for site content')
  })
  
  describe('normalizeArtifactForAPI', () => {
    it('should normalize artifact with text content')
    it('should normalize artifact with site content')
    it('should handle missing content fields')
  })
})
```

### ЭТАП 4: Запуск и валидация

#### 4.1 Команды для тестирования
```bash
# Проверка TypeScript после исправлений
pnpm typecheck

# Запуск unit тестов
pnpm test:unit

# Запуск конкретных тестов
pnpm test:unit queries.test.ts
pnpm test:unit artifact-content-utils.test.ts
```

#### 4.2 Критерии успеха
- ✅ Все TypeScript ошибки исправлены
- ✅ Все unit тесты проходят (включая новые)
- ✅ Покрытие queries.ts расширено до основных функций
- ✅ artifact-content-utils.ts покрыт полностью
- ✅ Моки правильно работают с world_id системой

## Архитектурные принципы

### Использование AI Fixtures
Для тестов, требующих AI взаимодействия:
```typescript
import { AIFixturesProvider } from '@/lib/ai/fixtures-provider'

const fixturesProvider = new AIFixturesProvider({
  mode: 'record-or-replay',
  useCaseId: 'queries-test'
})
```

### Мокирование БД
Использовать установленный паттерн:
```typescript
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))
```

### Изоляция тестов
- **НЕ использовать реальную БД** - только моки
- **Мокировать server-only модули** для client compatibility
- **Использовать world_id: null** для production объектов

## Ожидаемые результаты

После завершения TASK-03:
- ✅ TypeScript ошибки с world_id исправлены
- ✅ queries.ts покрыт основными функциями (5+ новых тестов)
- ✅ artifact-content-utils.ts покрыт полностью (10+ тестов)
- ✅ Все 50+ unit тестов проходят стабильно
- ✅ План "Закалка и Расширение" полностью завершен

## Связь с архитектурой

TASK-03 завершает трехуровневую систему тестирования:
1. **Unit тесты** - изолированное тестирование бизнес-логики ✅
2. **Integration тесты** - API endpoints через Playwright ✅
3. **E2E тесты** - пользовательские сценарии через браузер ✅

Результат: **Production-ready testing infrastructure** для долгосрочной стабильности проекта.