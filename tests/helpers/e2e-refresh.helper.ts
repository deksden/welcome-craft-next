/**
 * @file tests/helpers/e2e-refresh.helper.ts
 * @description E2E helper для активации элегантного обновления UI в тестах
 * @version 2.1.0
 * @date 2025-06-27
 * @updated BUG-035 FINAL FIX: Добавлены credentials и X-Test-Environment header для корректной аутентификации в browser-side fetch
 */

/** HISTORY:
 * v2.1.0 (2025-06-27): BUG-035 FINAL FIX - Добавлены credentials:'include' и X-Test-Environment header для правильной аутентификации в createArtifactWithElegantRefresh
 * v2.0.0 (2025-06-27): BUG-035 FIX - Переписан createArtifactWithElegantRefresh для использования browser-side fetch вместо page.request.post() для активации automatic refresh headers
 * v1.0.0 (2025-06-27): Создан helper для активации window events и SWR revalidation в E2E тестах
 */

import type { Page } from '@playwright/test'

/**
 * @description Активирует элегантное обновление артефактов в браузере через window events
 * @param page Playwright page instance
 * @param options Опции для обновления
 * @returns Promise<void>
 */
export async function triggerElegantRefreshInBrowser(
  page: Page, 
  options?: {
    operation?: 'create' | 'update' | 'delete'
    artifactId?: string
    showNotification?: boolean
  }
): Promise<void> {
  const { operation = 'create', artifactId, showNotification = false } = options || {}
  
  console.log('🔄 Triggering elegant refresh in browser for E2E test...')
  
  // Выполняем JavaScript в браузере для активации refresh
  await page.evaluate(async ({ operation, artifactId, showNotification }) => {
    // Отправляем window event для обновления компонентов
    const refreshEvent = new CustomEvent('artifact-list-refresh', {
      detail: { 
        timestamp: Date.now(), 
        source: 'e2e-test',
        operation,
        artifactId
      }
    })
    
    window.dispatchEvent(refreshEvent)
    console.log('📡 Window refresh event dispatched from E2E test')
    
    // Дополнительно пробуем глобальный SWR refresh если доступен
    try {
      const globalSWRCache = (window as any).__SWR_CACHE__
      if (globalSWRCache) {
        // Invalidate ключевые endpoints
        const endpoints = [
          '/api/artifacts?page=1',
          '/api/artifacts',
          'artifacts-sidebar'
        ]
        
        for (const endpoint of endpoints) {
          if (globalSWRCache.delete) {
            globalSWRCache.delete(endpoint)
          }
        }
        
        console.log('✅ SWR cache invalidated from E2E test')
      }
    } catch (error) {
      console.log('⚠️ SWR cache invalidation failed in E2E test:', error)
    }
    
    // Отправляем focus event для revalidation
    const focusEvent = new Event('focus')
    window.dispatchEvent(focusEvent)
    
  }, { operation, artifactId, showNotification })
  
  // Даем время для обработки events
  await page.waitForTimeout(2000)
  
  console.log('✅ Elegant refresh triggered in browser')
}

/**
 * @description Создает артефакт через API и активирует элегантное обновление
 * @param page Playwright page instance
 * @param artifactData Данные артефакта
 * @returns Promise<boolean> - success status
 */
export async function createArtifactWithElegantRefresh(
  page: Page,
  artifactData: {
    id: string
    kind: string
    title: string
    content: string
  }
): Promise<boolean> {
  const { id, kind, title, content } = artifactData
  
  console.log(`🎬 Creating artifact "${title}" with elegant refresh...`)
  
  try {
    // ИСПРАВЛЕНИЕ BUG-035 FINAL: Используем browser-side fetch С правильными headers и credentials
    const success = await page.evaluate(async ({ id, kind, title, content }) => {
      try {
        console.log('🌐 Browser: Making authenticated fetch request to create artifact...')
        
        const response = await fetch(`/api/artifact?id=${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            // ИСПРАВЛЕНИЕ: убираем X-Test-Environment header - он может перенаправлять на тестовые endpoints
          },
          credentials: 'include',  // ВАЖНО: включаем cookies для аутентификации
          body: JSON.stringify({ kind, title, content })
        })
        
        console.log('🌐 Browser: Response status:', response.status)
        
        if (!response.ok) {
          console.error('❌ Browser: Failed to create artifact:', response.status)
          const errorText = await response.text()
          console.error('❌ Browser: Error details:', errorText)
          return false
        }
        
        console.log('✅ Browser: Artifact created successfully via fetch')
        
        // Проверяем refresh headers 
        const shouldRefresh = response.headers.get('X-Trigger-Refresh') === 'true'
        const operation = response.headers.get('X-Refresh-Operation')
        const artifactId = response.headers.get('X-Refresh-Artifact-Id')
        
        console.log('🔍 Browser: Refresh headers:', { shouldRefresh, operation, artifactId })
        
        if (shouldRefresh) {
          console.log('🔄 Browser: Triggering manual refresh event...')
          
          // Manually trigger refresh event поскольку patched fetch может не работать в E2E
          const refreshEvent = new CustomEvent('artifact-list-refresh', {
            detail: { 
              timestamp: Date.now(), 
              source: 'e2e-browser-fetch',
              operation: operation || 'create',
              artifactId: artifactId || id
            }
          })
          
          window.dispatchEvent(refreshEvent)
          
          // Дополнительно активируем focus event для SWR revalidation
          setTimeout(() => {
            const focusEvent = new Event('focus')
            window.dispatchEvent(focusEvent)
          }, 500)
          
          console.log('✅ Browser: Manual refresh events dispatched')
        }
        
        return true
        
      } catch (error) {
        console.error('❌ Browser: Error in fetch request:', error)
        return false
      }
    }, { id, kind, title, content })
    
    if (success) {
      console.log('✅ Artifact created successfully with browser-side elegant refresh')
      
      // Дополнительно активируем server-side refresh trigger
      await triggerElegantRefreshInBrowser(page, {
        operation: 'create',
        artifactId: id,
        showNotification: false
      })
      
      return true
    } else {
      console.log('❌ Failed to create artifact via browser-side fetch')
      return false
    }
    
  } catch (error) {
    console.log('❌ Error creating artifact with elegant refresh:', error)
    return false
  }
}

/**
 * @description Установка глобального обработчика fetch для автоматического refresh в E2E тестах
 * @param page Playwright page instance
 * @returns Promise<void>
 */
export async function setupE2EFetchRefreshHandler(page: Page): Promise<void> {
  console.log('🔧 Setting up E2E fetch refresh handler...')
  
  // Устанавливаем обработчик в браузере
  await page.addInitScript(() => {
    // Сохраняем оригинальный fetch
    const originalFetch = window.fetch
    
    // Патчим fetch для автоматической обработки refresh headers
    window.fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init)
        
        // Проверяем headers для refresh
        const shouldRefresh = response.headers.get('X-Trigger-Refresh') === 'true'
        
        if (shouldRefresh) {
          console.log('🔄 E2E: Detected refresh headers, triggering update...')
          
          // Отправляем window event
          const refreshEvent = new CustomEvent('artifact-list-refresh', {
            detail: { 
              timestamp: Date.now(), 
              source: 'e2e-fetch-handler',
              operation: response.headers.get('X-Refresh-Operation') || 'update',
              artifactId: response.headers.get('X-Refresh-Artifact-Id')
            }
          })
          
          window.dispatchEvent(refreshEvent)
          
          // Небольшая задержка для обработки
          setTimeout(() => {
            const focusEvent = new Event('focus')
            window.dispatchEvent(focusEvent)
          }, 500)
        }
        
        return response
        
      } catch (error) {
        console.error('❌ Error in E2E fetch handler:', error)
        throw error
      }
    }
    
    console.log('✅ E2E fetch refresh handler installed')
  })
  
  console.log('✅ E2E fetch refresh handler setup completed')
}

// END OF: tests/helpers/e2e-refresh.helper.ts