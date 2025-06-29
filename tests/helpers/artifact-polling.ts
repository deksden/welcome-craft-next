/**
 * @file tests/helpers/artifact-polling.ts
 * @description Элегантные хелперы для ожидания появления артефактов без page.reload()
 * @version 1.0.0
 * @date 2025-06-27
 * @updated Создан для элегантного решения проблемы отображения созданных артефактов
 */

import type { Page } from '@playwright/test'

/**
 * @description Элегантно ждет появления артефакта на странице через polling вместо page.reload()
 * @param page Playwright page instance
 * @param artifactTitle Название артефакта для поиска
 * @param timeout Максимальное время ожидания в миллисекундах
 * @returns Promise<boolean> - true если артефакт появился, false если timeout
 */
export async function waitForArtifactToAppear(
  page: Page, 
  artifactTitle: string, 
  timeout = 30000
): Promise<boolean> {
  const startTime = Date.now()
  
  console.log(`⏳ Elegantly waiting for artifact "${artifactTitle}" to appear...`)
  
  while (Date.now() - startTime < timeout) {
    // Проверяем есть ли артефакт на странице
    const artifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: artifactTitle })
    const isVisible = await artifactCard.isVisible().catch(() => false)
    
    if (isVisible) {
      console.log(`✅ Artifact "${artifactTitle}" appeared after ${Date.now() - startTime}ms`)
      return true
    }
    
    // Небольшая пауза перед следующей проверкой
    await page.waitForTimeout(1000)
  }
  
  console.log(`❌ Artifact "${artifactTitle}" did not appear within ${timeout}ms`)
  return false
}

/**
 * @description Элегантно ждет появления site артефакта с кнопкой публикации
 * @param page Playwright page instance
 * @param siteTitle Название site артефакта
 * @param timeout Максимальное время ожидания в миллисекундах
 * @returns Promise<boolean> - true если site артефакт с publication button появился
 */
export async function waitForSiteArtifactWithPublishButton(
  page: Page, 
  siteTitle: string, 
  timeout = 30000
): Promise<boolean> {
  const startTime = Date.now()
  
  console.log(`⏳ Elegantly waiting for site artifact "${siteTitle}" with publication button...`)
  
  while (Date.now() - startTime < timeout) {
    // Ищем card с нужным названием
    const artifactCard = page.locator('[data-testid="artifact-card"]').filter({ hasText: siteTitle })
    const isCardVisible = await artifactCard.isVisible().catch(() => false)
    
    if (isCardVisible) {
      // Проверяем есть ли в нем кнопка публикации
      const publishButton = artifactCard.locator('[data-testid="artifact-publication-button"]')
      const isButtonVisible = await publishButton.isVisible().catch(() => false)
      
      if (isButtonVisible) {
        console.log(`✅ Site artifact "${siteTitle}" with publication button appeared after ${Date.now() - startTime}ms`)
        return true
      }
    }
    
    // Небольшая пауза перед следующей проверкой
    await page.waitForTimeout(1000)
  }
  
  console.log(`❌ Site artifact "${siteTitle}" with publication button did not appear within ${timeout}ms`)
  return false
}

/**
 * @description Элегантно ждет появления любого artifact с publication button (для общих случаев)
 * @param page Playwright page instance 
 * @param timeout Максимальное время ожидания в миллисекундах
 * @returns Promise<boolean> - true если найден хотя бы один site артефакт с publication button
 */
export async function waitForAnyPublishableArtifact(
  page: Page, 
  timeout = 30000
): Promise<boolean> {
  const startTime = Date.now()
  
  console.log('⏳ Elegantly waiting for any site artifact with publication button...')
  
  while (Date.now() - startTime < timeout) {
    // Ищем любую кнопку публикации на странице
    const publishButtons = page.locator('[data-testid="artifact-publication-button"]')
    const count = await publishButtons.count().catch(() => 0)
    
    if (count > 0) {
      console.log(`✅ Found ${count} publishable artifacts after ${Date.now() - startTime}ms`)
      return true
    }
    
    // Небольшая пауза перед следующей проверкой
    await page.waitForTimeout(1000)
  }
  
  console.log(`❌ No publishable artifacts found within ${timeout}ms`)
  return false
}

// END OF: tests/helpers/artifact-polling.ts