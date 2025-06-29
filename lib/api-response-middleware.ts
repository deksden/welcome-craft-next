/**
 * @file lib/api-response-middleware.ts
 * @description Middleware для автоматического запуска элегантного обновления после успешных API операций
 * @version 1.0.0
 * @date 2025-06-27
 * @updated Создан для автоматического обновления списков артефактов после API операций
 */

/** HISTORY:
 * v1.0.0 (2025-06-27): Создан автоматический middleware для элегантного обновления списков после API операций
 */

/**
 * @description Обертка для Response.json с автоматическим элегантным обновлением
 * @param data Данные для возврата
 * @param options Опции Response + дополнительные параметры для обновления
 * @returns Response объект
 */
export function createApiResponseWithRefresh(
  data: any,
  options: ResponseInit & {
    shouldTriggerRefresh?: boolean
    operation?: 'create' | 'update' | 'delete'
    artifactId?: string
    artifactTitle?: string
  } = {}
): Response {
  const { shouldTriggerRefresh = false, operation, artifactId, artifactTitle, ...responseOptions } = options
  
  // Создаем стандартный Response
  const response = Response.json(data, responseOptions)
  
  // Если нужно обновление, добавляем специальные headers для клиента
  if (shouldTriggerRefresh && operation) {
    response.headers.set('X-Trigger-Refresh', 'true')
    response.headers.set('X-Refresh-Operation', operation)
    
    if (artifactId) {
      response.headers.set('X-Refresh-Artifact-Id', artifactId)
    }
    
    if (artifactTitle) {
      response.headers.set('X-Refresh-Artifact-Title', artifactTitle)
    }
  }
  
  return response
}

/**
 * @description Клиентская функция для обработки Response с автоматическим обновлением
 * @param response Response объект от fetch
 * @returns Promise<void>
 */
export async function handleApiResponseRefresh(response: Response): Promise<void> {
  const shouldRefresh = response.headers.get('X-Trigger-Refresh') === 'true'
  
  if (!shouldRefresh) return
  
  const operation = response.headers.get('X-Refresh-Operation') as 'create' | 'update' | 'delete' | null
  const artifactId = response.headers.get('X-Refresh-Artifact-Id')
  const artifactTitle = response.headers.get('X-Refresh-Artifact-Title')
  
  if (!operation) return
  
  try {
    // Динамический импорт для избежания циклических зависимостей
    const { triggerArtifactListRefresh } = await import('./elegant-refresh-utils')
    
    await triggerArtifactListRefresh({
      source: 'api-response-middleware',
      artifactId: artifactId || undefined,
      operation,
      showNotification: true
    })
    
    console.log(`✅ Automatic refresh triggered for ${operation} operation`)
    
  } catch (error) {
    console.error('❌ Failed to trigger automatic refresh:', error)
  }
}

/**
 * @description Глобальная функция для патчинга window.fetch с автоматическим обновлением
 * @feature Автоматически обрабатывает все fetch запросы и триггерит обновления
 */
export function setupGlobalFetchRefreshHandler(): void {
  if (typeof window === 'undefined') return
  
  // Сохраняем оригинальный fetch
  const originalFetch = window.fetch
  
  // Патчим fetch для автоматической обработки refresh headers
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const response = await originalFetch(input, init)
      
      // Обрабатываем refresh headers для API endpoints артефактов
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      
      if (url.includes('/api/artifact') && response.ok) {
        // Не ждем завершения чтобы не блокировать основной поток
        handleApiResponseRefresh(response.clone()).catch(console.error)
      }
      
      return response
      
    } catch (error) {
      console.error('❌ Error in patched fetch:', error)
      throw error
    }
  }
  
  console.log('✅ Global fetch refresh handler setup completed')
}

/**
 * @description Hook для использования в React компонентах
 * @feature Автоматически устанавливает обработчик при монтировании компонента
 */
export function useApiRefreshHandler(): void {
  if (typeof window !== 'undefined') {
    // Устанавливаем обработчик только один раз
    if (!(window as any).__FETCH_REFRESH_HANDLER_SETUP__) {
      setupGlobalFetchRefreshHandler()
      ;(window as any).__FETCH_REFRESH_HANDLER_SETUP__ = true
    }
  }
}

/**
 * @description Функция для ручного использования с fetch запросами
 * @param fetchPromise Promise от fetch запроса
 * @returns Promise с автоматической обработкой refresh
 */
export async function fetchWithAutoRefresh(
  input: RequestInfo | URL, 
  init?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(input, init)
    
    // Автоматически обрабатываем refresh headers
    if (response.ok) {
      await handleApiResponseRefresh(response.clone())
    }
    
    return response
    
  } catch (error) {
    console.error('❌ Error in fetchWithAutoRefresh:', error)
    throw error
  }
}

// END OF: lib/api-response-middleware.ts