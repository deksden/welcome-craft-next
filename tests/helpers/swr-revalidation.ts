/**
 * @file tests/helpers/swr-revalidation.ts
 * @description SWR Cache Management для элегантного обновления списков в приложении и тестах
 * @version 2.0.0
 * @date 2025-06-27
 * @updated Расширен для работы с реальным кодом приложения: mutate функции, programmatic revalidation
 */

import type { Page } from '@playwright/test'

/**
 * @description Принудительно обновляет SWR кэш через имитацию пользовательского действия (для E2E тестов)
 * @param page Playwright page instance
 * @param timeout Максимальное время ожидания в миллисекундах
 * @returns Promise<boolean> - true если обновление прошло успешно
 */
export async function forceSWRRevalidation(page: Page, timeout = 10000): Promise<boolean> {
  console.log('🔄 Forcing SWR revalidation through user interaction simulation...')
  
  try {
    // Метод 1: Используем mutate функцию SWR напрямую через window объект
    const mutateSuccess = await page.evaluate(() => {
      // Проверяем есть ли глобальная mutate функция
      if (typeof window !== 'undefined' && (window as any).__SWR_MUTATE__) {
        console.log('🎯 Using direct SWR mutate function...')
        const mutate = (window as any).__SWR_MUTATE__
        // Invalidate все API endpoints связанные с артефактами
        mutate('/api/artifacts?page=1', undefined, { revalidate: true })
        return true
      }
      return false
    }).catch(() => false)
    
    if (mutateSuccess) {
      await page.waitForTimeout(2000)
      return true
    }
    
    // Метод 2: Имитируем смену фильтра для принудительного обновления SWR
    const kindFilter = page.locator('select, [data-testid*="filter"], [data-testid*="select"]').first()
    const hasFilter = await kindFilter.isVisible().catch(() => false)
    
    if (hasFilter) {
      console.log('🎛️ Found filter control, triggering SWR update via filter change...')
      
      // Временно меняем фильтр чтобы вызвать SWR revalidation
      await kindFilter.click()
      await page.waitForTimeout(500)
      
      // Возвращаем обратно на "all"
      const allOption = page.locator('option, [role="option"]').filter({ hasText: /all|все/i }).first()
      if (await allOption.isVisible().catch(() => false)) {
        await allOption.click()
      }
      
      await page.waitForTimeout(2000) // Ждем SWR revalidation
      return true
    }
    
    // Метод 3: Имитируем search input change для принудительного обновления
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="поиск"]').first()
    const hasSearchInput = await searchInput.isVisible().catch(() => false)
    
    if (hasSearchInput) {
      console.log('🔍 Found search input, triggering SWR update via search change...')
      
      await searchInput.fill('temp-search-trigger')
      await page.waitForTimeout(1000)
      await searchInput.fill('')
      await page.waitForTimeout(2000) // Ждем SWR revalidation
      return true
    }
    
    // Метод 4: Focus/blur на странице для trigger revalidation
    console.log('👆 Using focus/blur method to trigger SWR revalidation...')
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'))
      setTimeout(() => window.dispatchEvent(new Event('blur')), 100)
      setTimeout(() => window.dispatchEvent(new Event('focus')), 200)
    })
    
    await page.waitForTimeout(2000)
    return true
    
  } catch (error) {
    console.log(`❌ SWR revalidation failed: ${error}`)
    return false
  }
}

/**
 * @description Ждет появления артефакта через комбинацию SWR revalidation + polling
 * @param page Playwright page instance
 * @param artifactTitle Название артефакта для поиска
 * @param timeout Максимальное время ожидания
 * @returns Promise<boolean>
 */
export async function waitForArtifactWithSWRRevalidation(
  page: Page, 
  artifactTitle: string, 
  timeout = 20000
): Promise<boolean> {
  const startTime = Date.now()
  
  console.log(`🚀 Smart waiting for artifact "${artifactTitle}" with SWR revalidation...`)
  
  // Сначала пробуем принудительную SWR revalidation
  await forceSWRRevalidation(page)
  
  // Затем проверяем появился ли артефакт
  while (Date.now() - startTime < timeout) {
    const artifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: artifactTitle })
    const isVisible = await artifactCard.isVisible().catch(() => false)
    
    if (isVisible) {
      console.log(`✅ Artifact "${artifactTitle}" appeared after ${Date.now() - startTime}ms via SWR revalidation`)
      return true
    }
    
    // Каждые 5 секунд повторяем SWR revalidation
    if ((Date.now() - startTime) % 5000 < 1000) {
      await forceSWRRevalidation(page)
    }
    
    await page.waitForTimeout(1000)
  }
  
  console.log(`❌ Artifact "${artifactTitle}" did not appear even with SWR revalidation within ${timeout}ms`)
  return false
}

/**
 * @description Элегантные функции для обновления SWR в реальном коде приложения
 * @feature Используется в компонентах для обновления списков после создания/изменения артефактов
 */

/**
 * @description Создает функцию для обновления конкретного SWR endpoint
 * @param mutate SWR mutate функция из useSWR hook
 * @param endpoint API endpoint для обновления
 * @returns Функция для принудительного обновления
 */
export function createSWRUpdater(mutate: Function, endpoint: string) {
  return async () => {
    console.log(`🔄 Refreshing SWR cache for: ${endpoint}`)
    try {
      // Принудительная revalidation с optimistic updates
      await mutate(undefined, { revalidate: true })
      console.log(`✅ SWR cache refreshed successfully for: ${endpoint}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to refresh SWR cache for ${endpoint}:`, error)
      return false
    }
  }
}

/**
 * @description Универсальная функция для обновления списков артефактов
 * @param mutateFunctions Массив mutate функций для разных endpoints
 * @returns Promise<boolean> - успешность обновления
 */
export async function refreshArtifactLists(mutateFunctions: Function[]): Promise<boolean> {
  console.log(`🔄 Refreshing ${mutateFunctions.length} artifact lists...`)
  
  try {
    // Обновляем все списки параллельно
    const results = await Promise.all(
      mutateFunctions.map(async (mutate) => {
        try {
          await mutate(undefined, { revalidate: true })
          return true
        } catch (error) {
          console.error('❌ Individual mutate failed:', error)
          return false
        }
      })
    )
    
    const successCount = results.filter(Boolean).length
    console.log(`✅ Successfully refreshed ${successCount}/${mutateFunctions.length} artifact lists`)
    
    return successCount > 0
  } catch (error) {
    console.error('❌ Failed to refresh artifact lists:', error)
    return false
  }
}

/**
 * @description Создает debounced функцию для обновления SWR (предотвращает частые обновления)
 * @param mutate SWR mutate функция
 * @param delay Задержка в миллисекундах (по умолчанию 1000ms)
 * @returns Debounced функция обновления
 */
export function createDebouncedSWRUpdater(mutate: Function, delay = 1000) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(async () => {
      console.log('🔄 Executing debounced SWR refresh...')
      try {
        await mutate(undefined, { revalidate: true })
        console.log('✅ Debounced SWR refresh completed')
      } catch (error) {
        console.error('❌ Debounced SWR refresh failed:', error)
      }
    }, delay)
  }
}

/**
 * @description Hooks-совместимая функция для использования в React компонентах
 * @param useSWRResult Результат useSWR hook ({ mutate, ... })
 * @returns Функция для элегантного обновления
 */
export function useElegantRefresh(useSWRResult: { mutate: Function }) {
  const { mutate } = useSWRResult
  
  return async () => {
    console.log('🔄 Elegant refresh triggered...')
    try {
      await mutate(undefined, { 
        revalidate: true,
        populateCache: true,
        rollbackOnError: true
      })
      console.log('✅ Elegant refresh completed')
      return true
    } catch (error) {
      console.error('❌ Elegant refresh failed:', error)
      return false
    }
  }
}

// END OF: tests/helpers/swr-revalidation.ts