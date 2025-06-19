# TASK-02: Эволюция AIFixturesProvider с режимом record-or-replay

## Цель
Добавить новый режим `record-or-replay` в AIFixturesProvider, который автоматически воспроизводит существующие фикстуры или записывает новые при их отсутствии. Написать тесты для Summarizer используя этот режим.

## Текущее состояние

### ✅ Что уже есть:
1. **AIFixturesProvider** реализован в `lib/ai/fixtures-provider.ts`
2. **Три режима:** `'record' | 'replay' | 'passthrough'`
3. **Методы:** `loadFixture`, `saveFixture`, `convertFixtureToResult`
4. **Логика doGenerate и doStream** для всех режимов

### 🎯 Что нужно добавить:
1. **Новый режим:** `'record-or-replay'`
2. **Логика в doGenerate:** проверка фикстуры → replay или record
3. **Тесты Summarizer** с использованием нового режима

## План реализации

### ЭТАП 1: Расширение FixtureMode

#### 1.1 Обновление типа
**Файл:** `lib/ai/fixtures-provider.ts` (строка 21)
```typescript
// БЫЛО:
export type FixtureMode = 'record' | 'replay' | 'passthrough'

// СТАНЕТ:
export type FixtureMode = 'record' | 'replay' | 'passthrough' | 'record-or-replay'
```

### ЭТАП 2: Реализация логики record-or-replay

#### 2.1 В методе doGenerate
**Файл:** `lib/ai/fixtures-provider.ts` (после строки 147)

Добавить новый блок условия:
```typescript
if (self.config.mode === 'record-or-replay') {
  const fixture = await self.loadFixture(fixtureId, context);
  if (fixture) {
    // Если фикстура найдена, воспроизводим ее (replay)
    self.log(`🔁 Replaying fixture: ${fixtureId}`);
    return self.convertFixtureToResult(fixture);
  } else {
    // Если нет - делаем реальный вызов и записываем (record)
    self.log(`📝 Recording new fixture on-the-fly: ${fixtureId}`);
    const result = await Promise.race([
      originalModel.doGenerate(options),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), self.config.recordTimeout)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    // Сохраняем фикстуру
    await self.saveFixture(fixtureId, {
      input: {
        prompt: self.extractPrompt(options),
        model: originalModel.modelId,
        settings: self.extractSettings(options),
        context
      },
      output: {
        content: self.extractContent(result),
        usage: result.usage,
        finishReason: result.finishReason,
        timestamp: new Date().toISOString(),
        duration
      }
    }, context);
    
    return result;
  }
}
```

#### 2.2 В методе doStream
Аналогичная логика для streaming:
```typescript
if (self.config.mode === 'record-or-replay') {
  const fixture = await self.loadFixture(fixtureId, context);
  if (fixture) {
    // Воспроизводим stream из фикстуры
    return self.convertFixtureToStream(fixture);
  } else {
    // Записываем новый stream (упрощенная реализация)
    return await originalModel.doStream(options);
  }
}
```

### ЭТАП 3: Написание тестов для Summarizer

#### 3.1 Создание нового теста
**Файл:** `tests/unit/lib/ai/summarizer.test.ts` (новый)

**Структура теста:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAndSaveSummary } from '@/lib/ai/summarizer'
import { AIFixturesProvider } from '@/lib/ai/fixtures-provider'
import { db } from '@/lib/db'

// Мокируем DB операции
vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'test-id' }])
      })
    })
  }
}))

// Мокируем AI provider
vi.mock('@/lib/ai/providers', () => ({
  myProvider: {
    languageModel: vi.fn()
  }
}))

describe('Summarizer with AI Fixtures', () => {
  beforeEach(() => {
    // Устанавливаем режим record-or-replay
    process.env.AI_FIXTURES_MODE = 'record-or-replay'
    vi.clearAllMocks()
  })

  it('should generate and save a summary for a text artifact', async () => {
    // Arrange: создаем фикстуру-обертку для AI модели
    const mockModel = { /* mock model interface */ }
    const fixtureProvider = new AIFixturesProvider({
      mode: 'record-or-replay',
      useCaseId: 'summarizer-test'
    })
    const wrappedModel = fixtureProvider.wrapModel(mockModel, { artifactId: 'test-id' })
    
    // Мокируем провайдер чтобы он вернул обернутую модель
    vi.mocked(myProvider.languageModel).mockReturnValue(wrappedModel)
    
    // Act: вызываем функцию
    await generateAndSaveSummary('test-id', 'some long content', 'text')
    
    // Assert: проверяем что DB обновлен
    expect(vi.mocked(db.update)).toHaveBeenCalled()
  })
})
```

#### 3.2 Особенности теста
1. **НЕ мокируем `generateText`** - используем реальную AI обертку
2. **Мокируем только DB операции** для изоляции
3. **Используем `record-or-replay`** для автоматического кеширования
4. **Первый запуск** - делает реальный AI вызов и кеширует
5. **Последующие запуски** - мгновенно берут из кеша

## Преимущества нового режима

1. **Удобство разработки:** Не нужно заранее записывать фикстуры
2. **Реалистичность:** Первый запуск использует реальный AI
3. **Скорость:** Повторные запуски мгновенные
4. **Детерминизм:** Консистентные результаты в CI/CD
5. **Самодостаточность:** Фикстуры создаются автоматически

## Критические моменты

1. **Генерация fixtureId:** Должна быть стабильной между запусками
2. **Директории фикстур:** Правильное создание папок
3. **Timeout обработка:** Graceful handling в record режиме
4. **Error handling:** Что делать если запись не удалась

## Тестирование

### Команды для проверки:
```bash
# Запуск с записью фикстур
AI_FIXTURES_MODE=record-or-replay pnpm test:unit summarizer.test.ts

# Проверка что фикстуры созданы
ls tests/fixtures/ai/summarizer-test/

# Повторный запуск для проверки replay
AI_FIXTURES_MODE=record-or-replay pnpm test:unit summarizer.test.ts
```

### Ожидаемое поведение:
1. **Первый запуск:** "Recording new fixture on-the-fly"
2. **Второй запуск:** "Replaying fixture"
3. **Скорость:** Второй запуск значительно быстрее

## Файлы для изменения

1. `lib/ai/fixtures-provider.ts` - добавить режим `record-or-replay`
2. `tests/unit/lib/ai/summarizer.test.ts` - новый тест файл
3. Возможно потребуется обновить типы в `lib/ai/`

## Связь с архитектурой

Этот режим станет **режимом по умолчанию** для всех AI тестов, обеспечивая:
- Быструю разработку (не нужно заранее записывать)
- Надежное тестирование (консистентные результаты)
- Реалистичность (используется настоящий AI на первом запуске)

## Ожидаемый результат

После завершения TASK-02:
- ✅ Режим `record-or-replay` полностью реализован
- ✅ Тесты Summarizer покрывают основную функциональность
- ✅ Фикстуры создаются автоматически при первом запуске
- ✅ CI/CD тесты стабильны и быстры
- ✅ Документирован опыт использования нового режима