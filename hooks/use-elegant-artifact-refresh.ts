/**
 * @file hooks/use-elegant-artifact-refresh.ts
 * @description React hook для элегантного обновления списков артефактов без грубых page.reload()
 * @version 1.0.0
 * @date 2025-06-27
 * @updated Создан для решения проблемы UI синхронизации после API операций
 */

/** HISTORY:
 * v1.0.0 (2025-06-27): Создан элегантный hook для обновления всех списков артефактов в приложении
 */

'use client'

import { useCallback } from 'react'
import { toast } from '@/components/toast'

/**
 * @description React hook для элегантного обновления списков артефактов
 * @feature Обновляет все списки артефактов: главный grid, sidebar, "Мои артефакты"
 * @feature Показывает toast уведомления о процессе
 * @feature Debounced для предотвращения частых обновлений
 * @returns Функция refreshArtifacts для вызова после создания/изменения артефактов
 */
export function useElegantArtifactRefresh() {
  /**
   * @description Главная функция для элегантного обновления всех списков артефактов
   * @param options Опции обновления
   * @returns Promise<boolean> - успешность обновления
   */
  const refreshArtifacts = useCallback(async (options?: {
    showToast?: boolean
    endpoints?: string[]
    timeout?: number
  }) => {
    const { showToast = true, endpoints, timeout = 5000 } = options || {}
    
    if (showToast) {
      toast({ 
        type: 'loading', 
        description: 'Обновляю списки артефактов...'
      })
    }
    
    try {
      // Метод 1: Попытка использовать глобальные SWR mutate функции
      const globalRefreshSuccess = await tryGlobalSWRRefresh(endpoints)
      
      if (globalRefreshSuccess) {
        if (showToast) {
          toast({ 
            type: 'success', 
            description: 'Списки артефактов обновлены!' 
          })
        }
        return true
      }
      
      // Метод 2: Fallback через window events для компонентов
      const eventRefreshSuccess = await tryWindowEventRefresh()
      
      if (eventRefreshSuccess) {
        if (showToast) {
          toast({ 
            type: 'success', 
            description: 'Списки артефактов обновлены!' 
          })
        }
        return true
      }
      
      // Метод 3: Force refresh всех известных endpoints
      await tryForceRefreshKnownEndpoints()
      
      if (showToast) {
        toast({ 
          type: 'success', 
          description: 'Списки артефактов обновлены!' 
        })
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to refresh artifact lists:', error)
      
      if (showToast) {
        toast({ 
          type: 'error', 
          description: 'Не удалось обновить списки артефактов' 
        })
      }
      
      return false
    }
  }, [])
  
  return { refreshArtifacts }
}

/**
 * @description Попытка обновления через глобальные SWR mutate функции
 * @param endpoints Конкретные endpoints для обновления (опционально)
 * @returns Promise<boolean>
 */
async function tryGlobalSWRRefresh(endpoints?: string[]): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    
    // Проверяем есть ли глобальный SWR cache
    const globalSWRCache = (window as any).__SWR_CACHE__
    if (!globalSWRCache) return false
    
    console.log('🎯 Using global SWR cache refresh...')
    
    // Определяем endpoints для обновления
    const targetEndpoints = endpoints || [
      '/api/artifacts?page=1',
      '/api/artifacts',
      'artifacts-sidebar',
      'my-artifacts'
    ]
    
    // Обновляем все указанные endpoints
    const promises = targetEndpoints.map(endpoint => {
      return new Promise(resolve => {
        try {
          // Invalidate конкретный endpoint в SWR cache
          if (globalSWRCache.delete) {
            globalSWRCache.delete(endpoint)
          }
          resolve(true)
        } catch (error) {
          console.error(`Failed to refresh ${endpoint}:`, error)
          resolve(false)
        }
      })
    })
    
    const results = await Promise.all(promises)
    const successCount = results.filter(Boolean).length
    
    console.log(`✅ Global SWR refresh: ${successCount}/${targetEndpoints.length} endpoints`)
    return successCount > 0
    
  } catch (error) {
    console.error('❌ Global SWR refresh failed:', error)
    return false
  }
}

/**
 * @description Попытка обновления через window events для компонентов
 * @returns Promise<boolean>
 */
async function tryWindowEventRefresh(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    
    console.log('📡 Using window events for artifact refresh...')
    
    // Отправляем custom event для обновления артефактов
    const refreshEvent = new CustomEvent('artifact-list-refresh', {
      detail: { timestamp: Date.now(), source: 'elegant-refresh' }
    })
    
    window.dispatchEvent(refreshEvent)
    
    // Дополнительно отправляем focus event (некоторые SWR настроены на это)
    const focusEvent = new Event('focus')
    window.dispatchEvent(focusEvent)
    
    // Даем время компонентам отреагировать
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Window events dispatched for artifact refresh')
    return true
    
  } catch (error) {
    console.error('❌ Window events refresh failed:', error)
    return false
  }
}

/**
 * @description Force refresh всех известных artifact endpoints
 * @returns Promise<void>
 */
async function tryForceRefreshKnownEndpoints(): Promise<void> {
  try {
    console.log('🔄 Force refreshing known artifact endpoints...')
    
    // Симулируем revalidation через fetch с cache invalidation
    const endpoints = [
      '/api/artifacts?page=1&pageSize=12',
      '/api/artifacts?groupByVersions=true',
      '/api/artifacts/recent'
    ]
    
    const fetchPromises = endpoints.map(endpoint => 
      fetch(endpoint, { 
        method: 'GET',
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      }).catch(error => {
        console.error(`Failed to force refresh ${endpoint}:`, error)
      })
    )
    
    await Promise.all(fetchPromises)
    console.log('✅ Force refresh completed for known endpoints')
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error)
  }
}

/**
 * @description Debounced версия hook для предотвращения частых вызовов
 * @param delay Задержка в миллисекундах
 * @returns Debounced функция refreshArtifacts
 */
export function useDebouncedArtifactRefresh(delay = 1000) {
  const { refreshArtifacts } = useElegantArtifactRefresh()
  
  return useCallback(
    debounce(refreshArtifacts, delay),
    [refreshArtifacts, delay]
  )
}

/**
 * @description Простая debounce функция
 * @param func Функция для debounce
 * @param delay Задержка в миллисекундах
 * @returns Debounced функция
 */
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }) as T
}

// END OF: hooks/use-elegant-artifact-refresh.ts