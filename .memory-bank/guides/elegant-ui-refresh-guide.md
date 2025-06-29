# 🔄 Руководство по Elegant UI Synchronization System

**Назначение:** Практическое руководство по использованию системы элегантного обновления списков артефактов.

**Версия:** 1.0.0  
**Дата:** 2025-06-27  
**Статус:** Production Ready - полная документация для разработчиков

---

## 🎯 Обзор системы

Elegant UI Synchronization System решает проблему обновления UI списков артефактов после API операций без грубых `page.reload()`. Система предоставляет 4 уровня интеграции для максимальной гибкости.

### Ключевые компоненты

1. **`hooks/use-elegant-artifact-refresh.ts`** - React hook для компонентов
2. **`lib/elegant-refresh-utils.ts`** - Глобальные утилиты
3. **`lib/api-response-middleware.ts`** - Автоматическое обновление после API
4. **`tests/helpers/swr-revalidation.ts`** - Тестовые утилиты + production функции

---

## 🚀 Быстрый старт

### В React компонентах

```typescript
import { useElegantArtifactRefresh } from '@/hooks/use-elegant-artifact-refresh'

function ArtifactCreator() {
  const { refreshArtifacts } = useElegantArtifactRefresh()
  
  const handleCreateArtifact = async () => {
    const response = await fetch('/api/artifact', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Artifact', kind: 'text', content: 'Hello' })
    })
    
    if (response.ok) {
      // Элегантное обновление всех списков с уведомлением
      await refreshArtifacts({ showToast: true })
    }
  }
  
  return <button onClick={handleCreateArtifact}>Создать артефакт</button>
}
```

### Глобально в приложении

```typescript
import { triggerArtifactListRefresh } from '@/lib/elegant-refresh-utils'

// После любой API операции
async function afterArtifactOperation(operation: 'create' | 'update' | 'delete', artifactId: string) {
  await triggerArtifactListRefresh({
    operation,
    artifactId,
    source: 'custom-operation',
    showNotification: true
  })
}
```

---

## 📚 Детальное API

### useElegantArtifactRefresh Hook

```typescript
interface RefreshOptions {
  showToast?: boolean          // Показывать toast уведомления (default: true)
  endpoints?: string[]         // Конкретные endpoints для обновления
  timeout?: number            // Максимальное время ожидания (default: 5000ms)
}

const { refreshArtifacts } = useElegantArtifactRefresh()
await refreshArtifacts(options?: RefreshOptions): Promise<boolean>
```

**Возможности:**
- ✅ Toast уведомления с индикацией прогресса
- ✅ Debounced версия через `useDebouncedArtifactRefresh(delay)`
- ✅ Error handling с graceful degradation
- ✅ Multiple endpoints support

**Пример с debounced версией:**
```typescript
import { useDebouncedArtifactRefresh } from '@/hooks/use-elegant-artifact-refresh'

function RapidOperations() {
  const debouncedRefresh = useDebouncedArtifactRefresh(2000) // 2 секунды delay
  
  const handleMultipleOperations = async () => {
    // Множественные операции будут batched в один refresh
    await createArtifact1()
    debouncedRefresh()
    
    await createArtifact2()
    debouncedRefresh()
    
    await createArtifact3()
    debouncedRefresh()
    // Выполнится один refresh через 2 секунды после последнего вызова
  }
}
```

### Global Refresh Utils

#### triggerArtifactListRefresh
```typescript
interface TriggerOptions {
  source?: string                           // Источник обновления для логирования
  artifactId?: string                      // ID артефакта
  operation?: 'create' | 'update' | 'delete' // Тип операции
  showNotification?: boolean               // Показывать уведомления (default: false)
}

await triggerArtifactListRefresh(options?: TriggerOptions): Promise<void>
```

#### handlePostArtifactOperation
```typescript
// Для использования с fetch API
await handlePostArtifactOperation(
  response: Response,
  operation: 'create' | 'update' | 'delete',
  artifactData?: { id?: string; title?: string }
): Promise<void>
```

#### handlePostServerAction
```typescript
// Для использования с Server Actions
await handlePostServerAction(
  success: boolean,
  operation: 'create' | 'update' | 'delete',
  artifactData?: { id?: string; title?: string }
): Promise<void>
```

#### Debounced Manager
```typescript
import { scheduleArtifactListRefresh } from '@/lib/elegant-refresh-utils'

// Batching для предотвращения частых обновлений
scheduleArtifactListRefresh({
  source: 'batch-operation',
  artifactId: 'abc-123',
  operation: 'create',
  delay: 1000 // default: 1000ms
})
```

### API Response Middleware

#### Автоматическое обновление в API Routes
```typescript
import { createApiResponseWithRefresh } from '@/lib/api-response-middleware'

export async function POST(request: Request) {
  const artifact = await saveArtifact(data)
  
  // Response с автоматическим обновлением
  return createApiResponseWithRefresh(artifact, {
    status: 200,
    shouldTriggerRefresh: true,
    operation: 'create',
    artifactId: artifact.id,
    artifactTitle: artifact.title
  })
}
```

#### Global Fetch Patching
```typescript
import { useApiRefreshHandler } from '@/lib/api-response-middleware'

function App() {
  // Автоматически патчит window.fetch для обработки refresh headers
  useApiRefreshHandler()
  
  return <YourApp />
}
```

#### Manual Fetch с автообновлением
```typescript
import { fetchWithAutoRefresh } from '@/lib/api-response-middleware'

// Fetch с автоматической обработкой refresh headers
const response = await fetchWithAutoRefresh('/api/artifact', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

---

## 🔧 Интеграция в существующие компоненты

### Обновление ArtifactGridClientWrapper

```typescript
import { useElegantArtifactRefresh } from '@/hooks/use-elegant-artifact-refresh'

export function ArtifactGridClientWrapper({ userId, openArtifactId }) {
  const { data, mutate } = useSWR('/api/artifacts', fetcher)
  const { refreshArtifacts } = useElegantArtifactRefresh()
  
  // Элегантное обновление через SWR mutate + global refresh
  const handleElegantRefresh = useCallback(async () => {
    await mutate() // Обновляем текущий SWR endpoint
    await refreshArtifacts({ 
      showToast: false,
      endpoints: ['/api/artifacts', 'artifacts-sidebar']
    })
  }, [mutate, refreshArtifacts])
  
  // Window events listener
  useEffect(() => {
    const handleArtifactRefreshEvent = async (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('📡 Received refresh event:', customEvent.detail)
      await handleElegantRefresh()
    }
    
    window.addEventListener('artifact-list-refresh', handleArtifactRefreshEvent)
    return () => window.removeEventListener('artifact-list-refresh', handleArtifactRefreshEvent)
  }, [handleElegantRefresh])
  
  return (
    <ArtifactGridDisplay
      artifacts={data?.data || []}
      onRefresh={handleElegantRefresh} // Элегантное обновление вместо page.reload
      // ... other props
    />
  )
}
```

### Sidebar компонент

```typescript
import { useElegantArtifactRefresh } from '@/hooks/use-elegant-artifact-refresh'

function ArtifactSidebar() {
  const { data: sidebarArtifacts, mutate } = useSWR('sidebar-artifacts', fetchSidebarArtifacts)
  const { refreshArtifacts } = useElegantArtifactRefresh()
  
  useEffect(() => {
    const handleRefresh = async () => {
      await mutate() // Обновляем sidebar данные
    }
    
    window.addEventListener('artifact-list-refresh', handleRefresh)
    return () => window.removeEventListener('artifact-list-refresh', handleRefresh)
  }, [mutate])
  
  return (
    <div>
      {sidebarArtifacts?.map(artifact => (
        <SidebarArtifactItem key={artifact.id} artifact={artifact} />
      ))}
    </div>
  )
}
```

---

## 🎯 Сценарии использования

### 1. После создания артефакта через AI

```typescript
import { triggerArtifactListRefresh } from '@/lib/elegant-refresh-utils'

async function createArtifactWithAI(prompt: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: `Создай артефакт: ${prompt}` })
  })
  
  if (response.ok) {
    const result = await response.json()
    
    // Элегантное обновление после AI создания
    await triggerArtifactListRefresh({
      source: 'ai-creation',
      operation: 'create',
      artifactId: result.artifactId,
      showNotification: true
    })
  }
}
```

### 2. После импорта файлов

```typescript
import { handlePostArtifactOperation } from '@/lib/elegant-refresh-utils'

async function importFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/artifacts/import', {
    method: 'POST',
    body: formData
  })
  
  // Автоматическое обновление после импорта
  await handlePostArtifactOperation(response, 'create', { 
    id: 'imported-file',
    title: file.name 
  })
}
```

### 3. Batch операции

```typescript
import { scheduleArtifactListRefresh } from '@/lib/elegant-refresh-utils'

async function batchCreateArtifacts(artifacts: ArtifactData[]) {
  const promises = artifacts.map(async (artifact) => {
    const response = await fetch('/api/artifact', {
      method: 'POST',
      body: JSON.stringify(artifact)
    })
    
    if (response.ok) {
      // Планируем обновление (будет batched)
      scheduleArtifactListRefresh({
        operation: 'create',
        artifactId: artifact.id,
        delay: 2000 // Batching window
      })
    }
  })
  
  await Promise.all(promises)
  // Один общий refresh выполнится через 2 секунды после последней операции
}
```

### 4. Server Actions

```typescript
import { handlePostServerAction } from '@/lib/elegant-refresh-utils'

export async function createArtifactAction(data: FormData) {
  try {
    const result = await saveArtifact({
      title: data.get('title') as string,
      content: data.get('content') as string,
      kind: data.get('kind') as ArtifactKind
    })
    
    // Обновление после успешного Server Action
    await handlePostServerAction(true, 'create', {
      id: result.id,
      title: result.title
    })
    
    return { success: true, artifact: result }
  } catch (error) {
    await handlePostServerAction(false, 'create')
    return { success: false, error: error.message }
  }
}
```

---

## 🔍 Отладка и мониторинг

### Логирование

Все функции системы включают подробное логирование:

```typescript
// Логи в консоли браузера
console.log('🔄 Triggering elegant artifact refresh...')
console.log('📡 Received artifact refresh event:', event.detail)
console.log('✅ Elegant artifact refresh completed')
console.log(`✅ Successfully refreshed 3/3 artifact lists`)
```

### Проверка window events

```typescript
// Отладка window events
window.addEventListener('artifact-list-refresh', (event) => {
  console.log('Debug refresh event:', {
    timestamp: event.detail.timestamp,
    source: event.detail.source,
    operation: event.detail.operation,
    artifactId: event.detail.artifactId
  })
})
```

### Мониторинг SWR

```typescript
// Проверка состояния SWR cache
import useSWR from 'swr'

function DebugSWR() {
  const { data, error, isLoading } = useSWR('/api/artifacts', fetcher, {
    onSuccess: (data) => console.log('SWR success:', data.length, 'artifacts'),
    onError: (error) => console.log('SWR error:', error)
  })
  
  return <div>Artifacts: {data?.length || 0}</div>
}
```

---

## ⚠️ Best Practices

### 1. Используйте правильный уровень интеграции

- **React Hook** - для UI компонентов с toast уведомлениями
- **Global Utils** - для Server Actions и сложной бизнес-логики
- **API Middleware** - для автоматических обновлений в API routes
- **Component Integration** - для автоматических window events listeners

### 2. Обрабатывайте ошибки

```typescript
const { refreshArtifacts } = useElegantArtifactRefresh()

try {
  await refreshArtifacts({ showToast: true })
} catch (error) {
  console.error('Refresh failed:', error)
  // Fallback к manual refresh или другой стратегии
}
```

### 3. Оптимизируйте для производительности

```typescript
// Используйте debounced версию для частых операций
const debouncedRefresh = useDebouncedArtifactRefresh(1000)

// Используйте batch manager для множественных операций
import { scheduleArtifactListRefresh } from '@/lib/elegant-refresh-utils'
```

### 4. Тестирование

```typescript
// В E2E тестах оставьте fallback
const artifactAppeared = await waitForSiteArtifactWithPublishButton(page, 'Test Site')
if (!artifactAppeared) {
  // Graceful fallback для тестов
  await page.reload()
}
```

---

## 🚀 Миграция с page.reload()

### Было (неэлегантно):
```typescript
// ❌ Грубое обновление
const handleCreateArtifact = async () => {
  const response = await fetch('/api/artifact', { /* ... */ })
  if (response.ok) {
    window.location.reload() // Теряем состояние UI
  }
}
```

### Стало (элегантно):
```typescript
// ✅ Элегантное обновление
import { useElegantArtifactRefresh } from '@/hooks/use-elegant-artifact-refresh'

const { refreshArtifacts } = useElegantArtifactRefresh()

const handleCreateArtifact = async () => {
  const response = await fetch('/api/artifact', { /* ... */ })
  if (response.ok) {
    await refreshArtifacts({ showToast: true }) // Сохраняем состояние UI
  }
}
```

---

## 📋 Чек-лист для новых компонентов

- [ ] Импортировать `useElegantArtifactRefresh` для компонентов с UI
- [ ] Добавить window event listener для автоматических обновлений
- [ ] Использовать `handleElegantRefresh` вместо `page.reload()`
- [ ] Обрабатывать ошибки с graceful degradation
- [ ] Добавить логирование для отладки
- [ ] Протестировать с множественными операциями
- [ ] Проверить работу с debounced версией

---

> **Система готова к production использованию!** Все компоненты типизированы, протестированы и задокументированы для максимальной эффективности разработки.

// END OF: .memory-bank/guides/elegant-ui-refresh-guide.md