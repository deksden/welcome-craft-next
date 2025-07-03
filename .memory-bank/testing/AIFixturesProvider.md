# 🤖 AI Fixtures Provider - Lossless Proxy Architecture

**Версия:** 2.0.0  
**Дата:** 2025-07-02  
**Статус:** ✅ PRODUCTION READY - Полная реализация lossless архитектуры  

---

## 🎯 Назначение

AI Fixtures Provider — это "lossless" прокси-провайдер, который точно записывает и воспроизводит взаимодействия с AI-моделями в тестах. Система обеспечивает детерминистичные, быстрые и стабильные E2E тесты без необходимости реальных AI вызовов.

### Ключевые преимущества v2.0.0

- **Lossless архитектура:** Сохраняет полные объекты `GenerateTextResult` без потери метаданных
- **Stream поддержка:** Точное воспроизведение `LanguageModelV1StreamPart` чанков через `stream.tee()`
- **Типобезопасность:** Разделение `'full'` и `'stream'` типов фикстур
- **Production готовность:** Надежная обработка ошибок и timeout защита

---

## 🔄 Режимы работы

### `record`
Вызывает реальные AI модели и записывает полные ответы в JSON фикстуры.

**Использование:**
```bash
AI_FIXTURES_MODE=record pnpm test:e2e
```

### `replay`
Воспроизводит ранее записанные фикстуры без реальных AI вызовов.

**Использование:**
```bash
AI_FIXTURES_MODE=replay pnpm test:e2e
```

### `passthrough`
Всегда использует реальные AI модели, игнорируя фикстуры.

**Использование:**
```bash
AI_FIXTURES_MODE=passthrough pnpm test:e2e
```

### `record-or-replay` (рекомендуемый)
Умный режим: воспроизводит существующие фикстуры, записывает новые по мере необходимости.

**Использование:**
```bash
AI_FIXTURES_MODE=record-or-replay pnpm test:e2e
```

---

## 📂 Организация фикстур

### Иерархия директорий

```
tests/fixtures/ai/
├── use-cases/          # Фикстуры привязанные к Use Cases
│   ├── UC-01/
│   ├── UC-02/
│   └── UC-05/
├── worlds/             # Фикстуры привязанные к тестовым мирам
│   ├── CLEAN_USER_WORKSPACE/
│   └── ENTERPRISE_ONBOARDING/
└── general/            # Общие фикстуры
    ├── chat-model-abc123.json
    └── title-model-def456.json
```

### Автоматическое именование

- **Use Case контекст:** `tests/fixtures/ai/use-cases/UC-05/fixture-id.json`
- **World контекст:** `tests/fixtures/ai/worlds/WORLD_ID/fixture-id.json`
- **Без контекста:** `tests/fixtures/ai/general/fixture-id.json`

---

## 📄 Формат фикстуры (JSON)

### Структура v2.0.0

```typescript
interface AIFixture {
  id: string
  name: string
  useCaseId?: string
  worldId?: WorldId
  input: {
    prompt: string              // Сериализованные messages
    model: string
    settings?: Record<string, any>
    context?: any
  }
  output: {
    type: 'full' | 'stream'     // Тип ответа
    fullResponse?: any          // Полный GenerateTextResult (для doGenerate)
    streamChunks?: any[]        // Массив LanguageModelV1StreamPart (для doStream)
    timestamp: string
    duration: number
  }
  metadata: {
    createdAt: string
    hash: string                // Хеш для быстрого поиска
    tags?: string[]
  }
}
```

### Пример: Full Response Fixture

```json
{
  "id": "chat-model-abc123",
  "name": "AI Fixture: chat-model-abc123",
  "input": {
    "prompt": "[{\"role\":\"user\",\"content\":\"Hello\"}]",
    "model": "gemini-1.5-flash",
    "settings": {"temperature": 0}
  },
  "output": {
    "type": "full",
    "fullResponse": {
      "text": "Hello! How can I help you today?",
      "finishReason": "stop",
      "usage": {"promptTokens": 2, "completionTokens": 8, "totalTokens": 10},
      "toolCalls": [],
      "toolResults": []
    },
    "timestamp": "2025-07-02T18:39:58.028Z",
    "duration": 1506
  },
  "metadata": {
    "createdAt": "2025-07-02T18:39:58.028Z",
    "hash": "abc123"
  }
}
```

### Пример: Stream Chunks Fixture

```json
{
  "id": "stream-model-def456",
  "name": "AI Fixture: stream-model-def456",
  "output": {
    "type": "stream",
    "streamChunks": [
      {"type": "text-delta", "textDelta": "Hello"},
      {"type": "text-delta", "textDelta": " there!"},
      {"type": "finish", "finishReason": "stop", "usage": {"totalTokens": 10}}
    ],
    "timestamp": "2025-07-02T18:40:15.123Z",
    "duration": 2341
  }
}
```

---

## 🛠️ Использование в коде

### Базовое использование

```typescript
import { withAIFixtures } from '@/lib/ai/fixtures-provider'
import { gemini } from '@ai-sdk/google'

// Оборачиваем модель в fixtures provider
const model = withAIFixtures(gemini('gemini-1.5-flash'), {
  useCaseId: 'UC-05',
  worldId: 'ENTERPRISE_ONBOARDING'
})

// Используем как обычно
const result = await generateText({
  model,
  prompt: 'Create a welcome message'
})
```

### Продвинутое использование

```typescript
import { AIFixturesProvider } from '@/lib/ai/fixtures-provider'

const provider = new AIFixturesProvider({
  mode: 'record-or-replay',
  fixturesDir: './custom/fixtures/path',
  debug: true,
  recordTimeout: 60000
})

const wrappedModel = provider.wrapModel(originalModel, {
  useCaseId: 'UC-05',
  fixturePrefix: 'custom-prefix'
})
```

---

## 🔧 Техническая реализация

### Stream Recording с `stream.tee()`

```typescript
// 1. Получаем оригинальный stream
const { stream } = await originalModel.doStream(options)

// 2. Разделяем на два потока
const [streamForClient, streamForRecording] = stream.tee()

// 3. Немедленно возвращаем клиенту
return { stream: streamForClient }

// 4. Асинхронно записываем все чанки
const recordedChunks = []
const reader = streamForRecording.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  recordedChunks.push(value)
}
await saveFixture(fixtureId, { streamChunks: recordedChunks })
```

### Replay из сохраненных чанков

```typescript
return {
  stream: new ReadableStream({
    start(controller) {
      for (const chunk of fixture.output.streamChunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    }
  })
}
```

---

## 📋 Лучшие практики

### Обновление фикстур

1. **При изменении промптов:**
   ```bash
   # Удалить старые фикстуры
   rm -rf tests/fixtures/ai/use-cases/UC-05
   
   # Записать новые
   AI_FIXTURES_MODE=record pnpm test:e2e UC-05
   ```

2. **При изменении AI моделей:**
   ```bash
   # Обновить все фикстуры
   AI_FIXTURES_MODE=record pnpm test:e2e
   ```

### Debugging фикстур

```typescript
// Включить debug логи
const provider = new AIFixturesProvider({ debug: true })

// Посмотреть статистику
console.log(provider.getStats())
// { mode: 'replay', cacheSize: 5, fixturesDir: './tests/fixtures/ai' }

// Очистить кеш
provider.clearCache()
```

### CI/CD интеграция

```yaml
# .github/workflows/test.yml
- name: Run E2E tests with AI Fixtures
  env:
    AI_FIXTURES_MODE: replay
  run: pnpm test:e2e
```

---

## ⚠️ Миграция с v1.0.0

### Изменения интерфейса

| v1.0.0 | v2.0.0 |
|--------|--------|
| `output.content` | `output.fullResponse.text` |
| `output.usage` | `output.fullResponse.usage` |
| `output.finishReason` | `output.fullResponse.finishReason` |
| Эмуляция стрима | Реальные `streamChunks` |

### Автоматическая миграция

Старые фикстуры v1.0.0 больше не поддерживаются. Необходимо перезаписать:

```bash
# Удалить старые фикстуры
rm -rf tests/fixtures/ai

# Записать новые в v2.0.0 формате
AI_FIXTURES_MODE=record pnpm test:e2e
```

---

## 🧪 Тестирование самого провайдера

```bash
# Unit тесты провайдера
pnpm test:unit lib/ai/fixtures-provider.test.ts

# Интеграционные тесты
pnpm test:routes phoenix-ai-fixtures.test.ts

# E2E валидация
AI_FIXTURES_MODE=record-or-replay pnpm test:e2e UC-05
```

---

## ✅ Заключение

AI Fixtures Provider v2.0.0 предоставляет надежную, lossless архитектуру для детерминистичного тестирования AI функциональности. Система готова к production использованию и обеспечивает полную совместимость с Vercel AI SDK.

**Ключевые достижения:**
- ✅ Lossless сохранение всех AI ответов
- ✅ Точное воспроизведение streaming взаимодействий  
- ✅ Production-ready обработка ошибок
- ✅ Полная совместимость с существующей тестовой инфраструктурой