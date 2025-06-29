/**
 * @file lib/elegant-refresh-utils.ts
 * @description Утилиты для элегантного обновления списков артефактов без page.reload()
 * @version 1.0.0
 * @date 2025-06-27
 * @updated Создан для глобального использования в приложении после API операций
 */

/** HISTORY:
 * v1.0.0 (2025-06-27): Создан для глобального элегантного обновления списков артефактов в приложении
 */

/**
 * @description Глобальная функция для элегантного обновления всех списков артефактов
 * @feature Можно вызывать из любого места приложения после создания/изменения артефактов
 * @feature Триггерит обновление через window events и SWR revalidation
 * @param options Опции обновления
 */
export async function triggerArtifactListRefresh(options?: {
  source?: string
  artifactId?: string
  operation?: 'create' | 'update' | 'delete'
  showNotification?: boolean
}): Promise<void> {
  const { 
    source = 'api-operation', 
    artifactId, 
    operation = 'create',
    showNotification = false
  } = options || {}
  
  console.log(`🔄 Triggering global artifact list refresh (${operation} from ${source})...`)
  
  try {
    // Отправляем custom event для обновления всех слушающих компонентов
    const refreshEvent = new CustomEvent('artifact-list-refresh', {
      detail: { 
        timestamp: Date.now(),
        source,
        artifactId,
        operation,
        showNotification
      }
    })
    
    window.dispatchEvent(refreshEvent)
    
    // Дополнительно триггерим focus event для SWR компонентов с revalidateOnFocus
    setTimeout(() => {
      window.dispatchEvent(new Event('focus'))
    }, 100)
    
    console.log(`✅ Global artifact list refresh triggered successfully`)
    
  } catch (error) {
    console.error(`❌ Failed to trigger global artifact list refresh:`, error)
  }
}

/**
 * @description Хелпер для использования после успешных API операций с артефактами
 * @param response Response объект от fetch API
 * @param operation Тип операции
 * @param artifactData Данные артефакта (опционально)
 */
export async function handlePostArtifactOperation(
  response: Response,
  operation: 'create' | 'update' | 'delete',
  artifactData?: { id?: string; title?: string }
): Promise<void> {
  if (response.ok) {
    console.log(`✅ Artifact ${operation} successful, triggering list refresh...`)
    
    await triggerArtifactListRefresh({
      source: 'api-success',
      artifactId: artifactData?.id,
      operation,
      showNotification: true
    })
  } else {
    console.error(`❌ Artifact ${operation} failed with status:`, response.status)
  }
}

/**
 * @description Server Action совместимый хелпер для обновления после серверных операций
 * @param success Успешность операции
 * @param operation Тип операции
 * @param artifactData Данные артефакта
 */
export async function handlePostServerAction(
  success: boolean,
  operation: 'create' | 'update' | 'delete',
  artifactData?: { id?: string; title?: string }
): Promise<void> {
  if (success) {
    console.log(`✅ Server action ${operation} successful, triggering list refresh...`)
    
    await triggerArtifactListRefresh({
      source: 'server-action',
      artifactId: artifactData?.id,
      operation,
      showNotification: false // Server actions обычно сами управляют уведомлениями
    })
  }
}

/**
 * @description Debounced версия для предотвращения частых обновлений
 */
class DebouncedRefreshManager {
  private timeoutId: NodeJS.Timeout | null = null
  private pendingRefreshes: Array<{
    source: string
    artifactId?: string
    operation: 'create' | 'update' | 'delete'
  }> = []

  /**
   * @description Добавляет refresh в очередь с debounce
   * @param options Параметры refresh
   * @param delay Задержка в миллисекундах
   */
  public schedule(
    options: {
      source?: string
      artifactId?: string
      operation?: 'create' | 'update' | 'delete'
    },
    delay = 1000
  ): void {
    // Добавляем в очередь
    this.pendingRefreshes.push({
      source: options.source || 'debounced',
      artifactId: options.artifactId,
      operation: options.operation || 'create'
    })

    // Сбрасываем предыдущий timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    // Устанавливаем новый timeout
    this.timeoutId = setTimeout(async () => {
      await this.executePendingRefreshes()
    }, delay)
  }

  private async executePendingRefreshes(): Promise<void> {
    if (this.pendingRefreshes.length === 0) return

    console.log(`🔄 Executing ${this.pendingRefreshes.length} debounced refreshes...`)

    // Группируем по операциям
    const operations = this.pendingRefreshes.reduce((acc, refresh) => {
      acc[refresh.operation] = (acc[refresh.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Выполняем один общий refresh
    await triggerArtifactListRefresh({
      source: 'debounced-batch',
      operation: 'update', // Общая операция для batch
      showNotification: true
    })

    console.log(`✅ Debounced refresh completed for operations:`, operations)

    // Очищаем очередь
    this.pendingRefreshes = []
    this.timeoutId = null
  }
}

export const debouncedRefreshManager = new DebouncedRefreshManager()

/**
 * @description Convenience функция для debounced refresh
 */
export function scheduleArtifactListRefresh(options?: {
  source?: string
  artifactId?: string
  operation?: 'create' | 'update' | 'delete'
  delay?: number
}): void {
  const { delay = 1000, ...refreshOptions } = options || {}
  debouncedRefreshManager.schedule(refreshOptions, delay)
}

// END OF: lib/elegant-refresh-utils.ts