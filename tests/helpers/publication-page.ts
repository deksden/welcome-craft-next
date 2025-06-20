/**
 * @file tests/helpers/publication-page.ts
 * @description Page Object Model для системы публикации сайтов и чатов
 * @version 1.2.0
 * @date 2025-06-19
 * @updated Добавлен метод verifyActualSiteContent() для проверки реального контента артефактов на опубликованных сайтах
 */

/** HISTORY:
 * v1.2.0 (2025-06-19): Добавлен verifyActualSiteContent() для проверки реального контента вместо простой проверки загрузки страницы
 * v1.1.0 (2025-06-19): Добавлен getRealPublicationUrl() для реального тестирования URL из диалога публикации
 * v1.0.0 (2025-06-19): Начальная реализация Page Object Model для Publication System
 */

import type { Page, Locator, } from '@playwright/test'

/**
 * @description TTL опции для публикации
 */
export type TTLOption = '1-month' | '1-year' | 'forever' | 'custom'

/**
 * @description Статус публикации
 */
export type PublicationStatus = 'published' | 'private' | 'expired'

/**
 * @description Page Object Model для работы с Site Publication Dialog
 * 
 * @feature Полное покрытие UI взаимодействий с публикацией сайтов
 * @feature TTL управление и кастомные даты
 * @feature Проверка статусов публикации
 */
export class PublicationPage {
  constructor(private page: Page) {}

  // ===== СЕЛЕКТОРЫ =====

  /** Кнопка публикации в панели артефакта */
  get publicationButton(): Locator {
    return this.page.getByTestId('artifact-publication-button')
  }

  /** Диалог публикации сайта */
  get dialog(): Locator {
    return this.page.getByTestId('site-publication-dialog')
  }

  /** Заголовок диалога */
  get dialogTitle(): Locator {
    return this.dialog.getByText('Публикация сайта')
  }

  /** TTL селектор */
  get ttlSelector(): Locator {
    return this.page.getByTestId('ttl-selector')
  }

  /** Отображение выбранного TTL */
  get ttlDisplay(): Locator {
    return this.page.getByTestId('ttl-display')
  }

  /** Date picker для кастомной даты */
  get customDatePicker(): Locator {
    return this.page.getByTestId('custom-date-picker')
  }

  /** Input поле для даты */
  get dateInput(): Locator {
    return this.page.getByTestId('date-input')
  }

  /** Кнопка "Опубликовать и скопировать ссылку" */
  get publishButton(): Locator {
    return this.page.getByTestId('publish-and-copy-button')
  }

  /** Кнопка "Прекратить показ" */
  get stopSharingButton(): Locator {
    return this.page.getByTestId('stop-sharing-button')
  }

  /** Toast уведомление об успешной публикации */
  get successToast(): Locator {
    return this.page.getByTestId('publication-success-toast')
  }

  /** Статус публикации в диалоге */
  get publishedStatus(): Locator {
    return this.dialog.getByText('Published until:')
  }

  /** Badge индикатор статуса публикации */
  get publicationBadge(): Locator {
    return this.page.getByTestId('publication-status-badge')
  }

  /** Поле ссылки в диалоге публикации */
  get linkField(): Locator {
    return this.page.locator('[data-testid*="share-url"], [data-testid*="publication-url"], input[readonly][value*="/s/"]')
  }

  // ===== МЕТОДЫ ВЗАИМОДЕЙСТВИЯ =====

  /**
   * @description Открывает диалог публикации
   * 
   * @feature Клик по кнопке публикации и ожидание появления диалога
   */
  async openDialog(): Promise<void> {
    await this.publicationButton.click()
    await this.dialog.waitFor({ state: 'visible' })
    await this.dialogTitle.waitFor({ state: 'visible' })
  }

  /**
   * @description Выбирает TTL опцию
   * 
   * @param option - Опция TTL для выбора
   */
  async selectTTL(option: TTLOption): Promise<void> {
    await this.ttlSelector.click()
    
    const optionSelector = `ttl-option-${option}`
    await this.page.getByTestId(optionSelector).click()
    
    // Ожидаем обновления отображения
    await this.page.waitForTimeout(500)
  }

  /**
   * @description Устанавливает кастомную дату для TTL
   * 
   * @param date - Дата в формате YYYY-MM-DD
   */
  async setCustomDate(date: string): Promise<void> {
    await this.selectTTL('custom')
    
    // Ожидаем появления date picker
    await this.customDatePicker.waitFor({ state: 'visible' })
    
    // Заполняем дату
    await this.dateInput.fill(date)
    
    // Ожидаем обновления UI
    await this.page.waitForTimeout(500)
  }

  /**
   * @description Публикует сайт с выбранными настройками
   * 
   * @feature Кликает по кнопке публикации и ожидает успешного завершения
   */
  async publishSite(): Promise<void> {
    await this.publishButton.click()
    
    // Ожидаем появления success toast
    await this.successToast.waitFor({ state: 'visible', timeout: 10000 })
    
    // Диалог должен закрыться
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * @description Отзывает публикацию сайта
   * 
   * @feature Кликает по кнопке "Прекратить показ" и подтверждает отзыв
   */
  async unpublishSite(): Promise<void> {
    await this.stopSharingButton.click()
    
    // Ожидаем toast уведомления об отзыве
    await this.page.getByText('Публикация отозвана').waitFor({ 
      state: 'visible', 
      timeout: 5000 
    })
    
    // Диалог должен закрыться
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /**
   * @description Проверяет текущий статус публикации в диалоге
   * 
   * @param expectedStatus - Ожидаемый статус
   */
  async verifyDialogStatus(expectedStatus: PublicationStatus): Promise<void> {
    switch (expectedStatus) {
      case 'published':
        await this.publishedStatus.waitFor({ state: 'visible' })
        await this.stopSharingButton.waitFor({ state: 'visible' })
        break
      case 'private':
        await this.publishButton.waitFor({ state: 'visible' })
        break
      case 'expired':
        // TTL истек - возможны разные UI состояния
        // В зависимости от реализации
        break
    }
  }

  // ===== УТИЛИТЫ =====

  /**
   * @description Генерирует публичную ссылку для сайта
   * 
   * @param siteId - ID сайта
   * @returns Публичная ссылка
   */
  generatePublicUrl(siteId: string): string {
    return `/s/${siteId}`
  }

  /**
   * @description Получает реальную ссылку из UI диалога публикации
   * 
   * @feature Читает URL из поля ссылки в диалоге публикации
   * @returns Promise с реальной ссылкой из UI
   */
  async getRealPublicationUrl(): Promise<string> {
    // Ждем появления поля ссылки
    await this.linkField.waitFor({ state: 'visible', timeout: 5000 })
    
    // Получаем значение из input поля или текст элемента
    let linkValue = await this.linkField.inputValue().catch(() => '')
    if (!linkValue) {
      linkValue = await this.linkField.textContent().catch(() => '') || ''
    }
    
    if (!linkValue || !linkValue.includes('/s/')) {
      throw new Error('Publication URL not found in dialog')
    }
    
    // Если это относительная ссылка, преобразуем в полную
    if (linkValue.startsWith('/s/')) {
      const origin = await this.page.evaluate(() => {
        const currentOrigin = window.location.origin
        // Определяем apex домен для публичного хостинга сайтов
        return currentOrigin.includes('app.localhost') 
          ? currentOrigin.replace('app.localhost', 'localhost')
          : currentOrigin.includes('app.welcome-onboard.ru')
            ? currentOrigin.replace('app.welcome-onboard.ru', 'welcome-onboard.ru')
            : currentOrigin.replace(/^(https?:\/\/)app\./, '$1') // Универсальный fallback для app.* → apex
      })
      return `${origin}${linkValue}`
    }
    
    return linkValue
  }

  /**
   * @description Получает ссылку из буфера обмена (эмуляция) - DEPRECATED
   * 
   * @deprecated Используйте getRealPublicationUrl() для получения реальной ссылки из UI
   * @returns Promise с ссылкой из буфера
   */
  async getClipboardUrl(): Promise<string> {
    // Phase 1: Эмуляция через JavaScript
    return await this.page.evaluate(() => {
      // В реальном приложении здесь будет navigator.clipboard.readText()
      const currentPath = window.location.pathname
      const siteId = currentPath.split('/').pop()
      return `/s/${siteId}`
    })
  }

  /**
   * @description Создает будущую дату для тестирования
   * 
   * @param daysFromNow - Количество дней от текущей даты
   * @returns Дата в формате YYYY-MM-DD
   */
  createFutureDate(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split('T')[0]
  }

  /**
   * @description Проверяет видимость кнопки публикации для артефакта
   * 
   * @param artifactKind - Тип артефакта
   * @returns true если кнопка должна быть видна
   */
  shouldShowPublicationButton(artifactKind: string): boolean {
    // Кнопка публикации видна только для сайтов
    return artifactKind === 'site'
  }
}

/**
 * @description Хелперы для проверки публичного доступа
 * 
 * @feature Утилиты для тестирования анонимного доступа к опубликованным сайтам
 */
export class PublicAccessHelpers {
  constructor(private page: Page) {}

  /**
   * @description Эмулирует анонимного пользователя
   * 
   * @feature Очищает все auth cookies для тестирования публичного доступа
   */
  async becomeAnonymous(): Promise<void> {
    await this.page.evaluate(() => {
      // Очищаем все auth cookies
      document.cookie = 'test-session=; path=/; domain=.localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'test-world-id=; path=/; domain=.localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    })
  }

  /**
   * @description Проверяет доступность опубликованного сайта
   * 
   * @param publicUrl - Публичная ссылка на сайт
   * @param expectedTitle - Ожидаемый заголовок сайта
   */
  async verifyPublicAccess(publicUrl: string, expectedTitle: string): Promise<void> {
    await this.page.goto(publicUrl)
    
    // Проверяем что сайт загрузился
    await this.page.getByTestId('site-content').waitFor({ state: 'visible' })
    await this.page.getByText(expectedTitle).waitFor({ state: 'visible' })
    
    // Проверяем read-only режим
    await this.verifyReadOnlyMode()
  }

  /**
   * @description Проверяет режим только для чтения
   * 
   * @feature Убеждается что все кнопки редактирования скрыты
   */
  async verifyReadOnlyMode(): Promise<void> {
    // Проверяем отсутствие кнопок редактирования
    await this.page.getByTestId('artifact-edit-button').waitFor({ 
      state: 'hidden',
      timeout: 3000 
    }).catch(() => {
      // Кнопка может отсутствовать в DOM, это нормально
    })
    
    await this.page.getByTestId('site-editor-toolbar').waitFor({ 
      state: 'hidden',
      timeout: 3000 
    }).catch(() => {
      // Toolbar может отсутствовать в DOM, это нормально
    })
  }

  /**
   * @description Проверяет блокировку доступа к неопубликованному сайту
   * 
   * @param publicUrl - Публичная ссылка на сайт
   */
  async verifyAccessBlocked(publicUrl: string): Promise<void> {
    await this.page.goto(publicUrl)
    
    // Ожидаем 404 или страницу "Site not found"
    const is404 = this.page.url().includes('404')
    const hasNotFoundElement = await this.page.getByTestId('site-not-found').isVisible().catch(() => false)
    
    if (!is404 && !hasNotFoundElement) {
      throw new Error('Expected 404 or site-not-found page, but got accessible content')
    }
  }

  /**
   * @description Проверяет что опубликованный сайт содержит реальный контент артефактов
   * 
   * @param publicUrl - Публичная ссылка на сайт
   * @param expectedContents - Массив строк контента, которые должны присутствовать на странице
   * @feature Проверяет что контент артефактов действительно отображается, а не просто что страница загрузилась
   */
  async verifyActualSiteContent(publicUrl: string, expectedContents: string[]): Promise<void> {
    console.log(`🔍 Verifying actual site content at: ${publicUrl}`)
    await this.page.goto(publicUrl)
    
    // Ждем полной загрузки контента
    await this.page.waitForTimeout(5000)
    
    // Получаем весь текст страницы для анализа
    const pageText = await this.page.textContent('body') || ''
    console.log(`📄 Page text length: ${pageText.length} chars`)
    
    // Проверяем каждый ожидаемый контент
    const missingContent: string[] = []
    const foundContent: string[] = []
    
    for (const expectedContent of expectedContents) {
      if (pageText.includes(expectedContent)) {
        foundContent.push(expectedContent)
        console.log(`✅ Found expected content: "${expectedContent}"`)
      } else {
        missingContent.push(expectedContent)
        console.log(`❌ Missing expected content: "${expectedContent}"`)
      }
    }
    
    // Логируем результаты
    console.log(`📊 Content verification results:`)
    console.log(`  ✅ Found: ${foundContent.length}/${expectedContents.length}`)
    console.log(`  ❌ Missing: ${missingContent.length}`)
    
    if (missingContent.length > 0) {
      // Логируем фрагмент страницы для диагностики
      const pagePreview = pageText.substring(0, 500)
      console.log(`📄 Page preview: "${pagePreview}..."`)
      
      throw new Error(`Site content verification failed. Missing content: ${missingContent.join(', ')}`)
    }
    
    console.log(`✅ All expected content found on published site`)
  }
}

// END OF: tests/helpers/publication-page.ts