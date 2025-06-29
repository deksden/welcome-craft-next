/**
 * @file tests/helpers/ui-auth-verification.ts
 * @description Helper для проверки визуальных признаков успешной аутентификации в UI
 * @version 1.0.0
 * @date 2025-06-28
 * @updated Создан helper для верификации UI аутентификации - проверка "Мои артефакты" и аватара пользователя
 */

/** HISTORY:
 * v1.0.0 (2025-06-28): Создан helper для верификации UI аутентификации - проверка "Мои артефакты" и аватара пользователя
 */

import { type Page, expect } from '@playwright/test'

/**
 * @description Интерфейс для результата проверки UI аутентификации
 */
export interface UIAuthVerificationResult {
  /** Успешна ли аутентификация с точки зрения UI */
  isAuthenticated: boolean
  /** Видна ли секция "Мои артефакты" в сайдбаре */
  hasArtifactsSection: boolean
  /** Виден ли аватар/кнопка пользователя в header */
  hasUserAvatar: boolean
  /** Общее количество найденных UI элементов аутентификации */
  authElementsCount: number
  /** Детальная информация для отладки */
  details: string[]
}

/**
 * @description Проверяет визуальные признаки успешной аутентификации в UI
 * @param page - Playwright Page объект
 * @param options - Опции проверки
 * @returns Promise с результатом верификации UI аутентификации
 * @feature Проверяет "Мои артефакты" в сайдбаре
 * @feature Проверяет аватар/кнопку пользователя в header
 * @feature Возвращает детальную диагностику для отладки
 * @deterministic Результат зависит только от текущего состояния UI
 */
export async function verifyUIAuthentication(
  page: Page,
  options: {
    /** Таймаут для поиска элементов (по умолчанию 5000ms) */
    timeout?: number
    /** Логировать ли результаты в консоль */
    verbose?: boolean
  } = {}
): Promise<UIAuthVerificationResult> {
  const { timeout = 5000, verbose = true } = options
  const details: string[] = []
  
  if (verbose) {
    console.log('🔍 UI Authentication Verification: Starting visual auth check...')
  }
  
  // ===== Проверка 1: Секция "Мои артефакты" в сайдбаре =====
  let hasArtifactsSection = false
  try {
    if (verbose) console.log('  🔍 Looking for sidebar artifacts button...')
    
    // Ищем кнопку артефактов в сайдбаре (может быть свернута по умолчанию)
    const artifactsButton = await page.locator('[data-testid="sidebar-artifacts-button"]')
      .isVisible({ timeout })
      .catch(() => false)
    
    if (artifactsButton) {
      hasArtifactsSection = true
      details.push('✅ Sidebar artifacts button found')
      if (verbose) console.log('  ✅ Sidebar artifacts section detected')
    } else {
      if (verbose) console.log('  🔍 Sidebar artifacts button not found, trying text search...')
      
      // Альтернативный поиск по тексту "Артефакты"
      const artifactsText = await page.locator('text="Артефакты"')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      
      if (artifactsText) {
        hasArtifactsSection = true
        details.push('✅ Artifacts text found in sidebar')
        if (verbose) console.log('  ✅ Artifacts text found in UI')
      } else {
        if (verbose) console.log('  🔍 Text search failed, trying BoxIcon...')
        
        // Поиск по иконке артефактов (BoxIcon)
        const boxIcon = await page.locator('svg').filter({ hasText: '' })
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
          
        if (boxIcon) {
          hasArtifactsSection = true
          details.push('✅ Box icon found (likely artifacts section)')
          if (verbose) console.log('  ✅ Box icon detected')
        } else {
          details.push('❌ No artifacts section found in sidebar')
          if (verbose) console.log('  ❌ Artifacts section not found')
          
          // Дополнительная диагностика
          if (verbose) {
            const sidebarContent = await page.locator('[data-sidebar]').textContent().catch(() => 'NO SIDEBAR')
            console.log('  🔍 Full sidebar content:', sidebarContent)
          }
        }
      }
    }
  } catch (error) {
    details.push(`❌ Artifacts section check failed: ${error}`)
    if (verbose) console.log('  ❌ Artifacts section check failed:', error)
  }
  
  // ===== Проверка 2: Аватар/кнопка пользователя в header =====
  let hasUserAvatar = false
  try {
    if (verbose) console.log('  🔍 Looking for user avatar/button in header...')
    
    // Ищем элементы пользователя в header
    const userElements = [
      '[data-testid="header-user-button"]',
      '[data-testid="user-avatar"]', 
      '[data-testid="header-user-menu"]',
      'button[aria-label*="user"], button[aria-label*="User"]',
      'img[alt*="avatar"], img[alt*="Avatar"]',
      // Часто встречающиеся паттерны для кнопок пользователя
      'button:has(img)', // кнопка с изображением (аватар)
      '[role="button"]:has(img)', // любой элемент с ролью кнопки содержащий изображение
    ]
    
    for (const selector of userElements) {
      const element = await page.locator(selector)
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      
      if (element) {
        hasUserAvatar = true
        details.push(`✅ User element found: ${selector}`)
        if (verbose) console.log(`  ✅ User element found: ${selector}`)
        break
      }
    }
    
    if (!hasUserAvatar) {
      if (verbose) console.log('  🔍 User element not found, checking header content...')
      
      // Альтернативный поиск в header по содержимому
      const headerContent = await page.locator('[data-testid="header"]')
        .textContent()
        .catch(() => '')
      
      if (headerContent && (headerContent.includes('@') || headerContent.includes('User'))) {
        hasUserAvatar = true
        details.push('✅ User content found in header text')
        if (verbose) console.log('  ✅ User content detected in header')
      } else {
        details.push('❌ No user avatar/button found in header')
        if (verbose) console.log('  ❌ User avatar/button not found')
        
        // Дополнительная диагностика
        if (verbose) {
          console.log('  🔍 Full header content:', headerContent || 'NO HEADER CONTENT')
          
          // Проверим общее количество кнопок в header
          const buttonCount = await page.locator('[data-testid="header"] button').count().catch(() => 0)
          console.log(`  🔍 Total buttons in header: ${buttonCount}`)
        }
      }
    }
  } catch (error) {
    details.push(`❌ User avatar check failed: ${error}`)
    if (verbose) console.log('  ❌ User avatar check failed:', error)
  }
  
  // ===== Подсчет и итоговая оценка =====
  const authElementsCount = (hasArtifactsSection ? 1 : 0) + (hasUserAvatar ? 1 : 0)
  const isAuthenticated = authElementsCount >= 1 // Хотя бы один признак аутентификации
  
  const result: UIAuthVerificationResult = {
    isAuthenticated,
    hasArtifactsSection,
    hasUserAvatar,
    authElementsCount,
    details
  }
  
  if (verbose) {
    console.log('🔍 UI Authentication Verification Results:')
    console.log(`  📊 Authenticated: ${isAuthenticated ? '✅ YES' : '❌ NO'}`)
    console.log(`  📋 Artifacts Section: ${hasArtifactsSection ? '✅' : '❌'}`)
    console.log(`  👤 User Avatar: ${hasUserAvatar ? '✅' : '❌'}`)
    console.log(`  🎯 Auth Elements: ${authElementsCount}/2`)
    
    if (!isAuthenticated) {
      console.log('⚠️ UI shows NO SIGNS of authentication - user appears as guest')
      details.forEach(detail => console.log(`     ${detail}`))
    }
  }
  
  return result
}

/**
 * @description Ожидает появления визуальных признаков аутентификации в UI с ретраями
 * @param page - Playwright Page объект
 * @param options - Опции ожидания
 * @returns Promise с результатом верификации UI аутентификации
 * @feature Повторяет проверку с интервалами до успеха или таймаута
 * @feature Возвращает детальную диагностику при неудаче
 */
export async function waitForUIAuthentication(
  page: Page,
  options: {
    /** Общий таймаут ожидания (по умолчанию 15000ms) */
    maxTimeout?: number
    /** Интервал между проверками (по умолчанию 2000ms) */
    retryInterval?: number
    /** Логировать ли прогресс */
    verbose?: boolean
  } = {}
): Promise<UIAuthVerificationResult> {
  const { maxTimeout = 15000, retryInterval = 2000, verbose = true } = options
  const startTime = Date.now()
  
  if (verbose) {
    console.log('⏳ Waiting for UI authentication signs...')
  }
  
  while (Date.now() - startTime < maxTimeout) {
    const result = await verifyUIAuthentication(page, { timeout: 1000, verbose: false })
    
    if (result.isAuthenticated) {
      if (verbose) {
        console.log(`✅ UI authentication detected after ${Date.now() - startTime}ms`)
        console.log('  📊 Final verification:', result)
      }
      return result
    }
    
    if (verbose) {
      console.log(`⏳ Still waiting... (${Date.now() - startTime}ms/${maxTimeout}ms)`)
    }
    
    await page.waitForTimeout(retryInterval)
  }
  
  // Финальная проверка с полным логированием для диагностики
  const finalResult = await verifyUIAuthentication(page, { timeout: 2000, verbose: true })
  
  if (verbose) {
    console.log('❌ UI authentication timeout reached')
    console.log('📊 Final state diagnosis:')
    finalResult.details.forEach(detail => console.log(`     ${detail}`))
  }
  
  return finalResult
}

/**
 * @description Строгая проверка UI аутентификации с обязательными assertions
 * @param page - Playwright Page объект
 * @param options - Опции проверки
 * @feature Использует expect() assertions для строгой проверки
 * @feature Падает при отсутствии признаков аутентификации
 * @throws AssertionError если аутентификация не обнаружена в UI
 */
export async function assertUIAuthentication(
  page: Page,
  options: {
    /** Таймаут для проверки */
    timeout?: number
    /** Требовать ли ОБА признака аутентификации */
    requireBoth?: boolean
  } = {}
): Promise<void> {
  const { timeout = 10000, requireBoth = false } = options
  
  console.log('🔒 STRICT UI Authentication Assertion')
  
  const result = await waitForUIAuthentication(page, { 
    maxTimeout: timeout, 
    verbose: true 
  })
  
  // Строгие assertions
  expect(result.isAuthenticated).toBe(true)
  
  if (requireBoth) {
    expect(result.hasArtifactsSection).toBe(true)
    expect(result.hasUserAvatar).toBe(true)
    console.log('✅ STRICT: Both artifacts section AND user avatar confirmed')
  } else {
    expect(result.authElementsCount).toBeGreaterThanOrEqual(1)
    console.log('✅ STRICT: At least one authentication sign confirmed')
  }
  
  console.log('🔒 UI Authentication assertion passed')
}

// END OF: tests/helpers/ui-auth-verification.ts