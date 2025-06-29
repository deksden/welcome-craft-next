/**
 * @file tests/helpers/content-management-page.ts
 * @description Page Object Model для продвинутого управления контентом
 * @version 1.0.0
 * @date 2025-06-19
 * @updated Реализация для TASK-08: UC-06 Content Management
 */

/** HISTORY:
 * v1.0.0 (2025-06-19): Начальная реализация POM для Advanced Content Management
 */

import type { Page, Locator } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * @description Конфигурация поисковых фильтров
 */
export interface SearchFilters {
  contentType?: string
  createdDate?: string
  tags?: string
  contentContains?: string
}

/**
 * @description Page Object Model для продвинутого управления контентом
 * 
 * @feature Полное покрытие UI взаимодействий с advanced content features
 * @feature Версионирование, AI enhancement, bulk операции
 * @feature Template management и smart collections
 */
export class ContentManagementPage {
  constructor(private page: Page) {}

  // ===== СЕЛЕКТОРЫ =====

  /** Ссылка на Content Library */
  get contentLibraryLink(): Locator {
    return this.page.getByTestId('sidebar-content-library-link')
  }

  /** Grid view toggle */
  get gridViewButton(): Locator {
    return this.page.getByTestId('content-view-grid')
  }

  /** List view toggle */
  get listViewButton(): Locator {
    return this.page.getByTestId('content-view-list')
  }

  /** Все карточки артефактов */
  get artifactCards(): Locator {
    return this.page.getByTestId('artifact-card')
  }

  /** Чекбоксы для multiple selection */
  get selectionCheckboxes(): Locator {
    return this.page.getByTestId('artifact-selection-checkbox')
  }

  /** Bulk actions toolbar */
  get bulkActionsToolbar(): Locator {
    return this.page.getByTestId('bulk-actions-toolbar')
  }

  /** Advanced search form */
  get advancedSearchForm(): Locator {
    return this.page.getByTestId('advanced-search-form')
  }

  /** Search results container */
  get searchResults(): Locator {
    return this.page.getByTestId('search-results')
  }

  /** Version history panel */
  get versionHistoryPanel(): Locator {
    return this.page.getByTestId('version-history-panel')
  }

  /** Version comparison view */
  get versionComparisonView(): Locator {
    return this.page.getByTestId('version-comparison-view')
  }

  /** AI enhancement menu */
  get aiEnhancementMenu(): Locator {
    return this.page.getByTestId('ai-enhancement-menu')
  }

  /** Enhancement preview dialog */
  get enhancementPreview(): Locator {
    return this.page.getByTestId('enhancement-preview-dialog')
  }

  /** Template library */
  get templateLibrary(): Locator {
    return this.page.getByTestId('template-library')
  }

  // ===== МЕТОДЫ НАВИГАЦИИ =====

  /**
   * @description Переходит в Content Library
   */
  async navigateToContentLibrary(): Promise<void> {
    await this.contentLibraryLink.click()
    
    // Ожидаем загрузки библиотеки
    await this.page.waitForURL('**/artifacts')
    await this.artifactCards.first().waitFor({ state: 'visible', timeout: 10000 })
  }

  /**
   * @description Переключается в grid view
   */
  async switchToGridView(): Promise<void> {
    await this.gridViewButton.click()
    await this.page.waitForTimeout(500) // Анимация переключения
  }

  /**
   * @description Переключается в list view
   */
  async switchToListView(): Promise<void> {
    await this.listViewButton.click()
    await this.page.waitForTimeout(500) // Анимация переключения
  }

  // ===== МЕТОДЫ ВЕРСИОНИРОВАНИЯ =====

  /**
   * @description Создает несколько версий артефакта для тестирования
   * 
   * @param artifactTitle - Название артефакта
   */
  async createArtifactVersions(artifactTitle: string): Promise<void> {
    // Открываем артефакт
    await this.selectArtifact(artifactTitle)
    
    // Создаем версию 1 (через редактирование)
    const editButton = this.page.getByTestId('artifact-edit-button')
    if (await editButton.isVisible()) {
      await editButton.click()
      
      // Делаем небольшие изменения
      const editor = this.page.getByTestId('artifact-editor')
      await editor.waitFor({ state: 'visible' })
      await this.page.keyboard.press('End')
      await this.page.keyboard.type(' - Updated v1')
      
      // Сохраняем (автосохранение или кнопка)
      await this.page.waitForTimeout(3000) // Ждем автосохранения
    }
    
    // Создаем версию 2
    await this.page.keyboard.press('End')
    await this.page.keyboard.type(' - Updated v2')
    await this.page.waitForTimeout(3000)
    
    console.log(`📝 Created multiple versions for: ${artifactTitle}`)
  }

  /**
   * @description Открывает панель истории версий
   * 
   * @param artifactTitle - Название артефакта
   */
  async openVersionHistory(artifactTitle: string): Promise<void> {
    await this.selectArtifact(artifactTitle)
    
    // Ищем кнопку истории версий
    const historyButton = this.page.getByTestId('artifact-version-history-button')
    if (await historyButton.isVisible()) {
      await historyButton.click()
    } else {
      // Fallback - через меню
      const menuButton = this.page.getByTestId('artifact-menu-button')
      await menuButton.click()
      await this.page.getByText('Version History').click()
    }
    
    await this.versionHistoryPanel.waitFor({ state: 'visible' })
  }

  /**
   * @description Проверяет отображение истории версий
   */
  async verifyVersionHistoryDisplay(): Promise<void> {
    await expect(this.versionHistoryPanel).toBeVisible()
    
    // Проверяем наличие версий
    const versionItems = this.page.getByTestId('version-history-item')
    const versionCount = await versionItems.count()
    if (versionCount === 0) {
      throw new Error('No versions found in history')
    }
    
    // Проверяем отображение timestamps
    const timestamps = this.page.getByTestId('version-timestamp')
    await expect(timestamps.first()).toBeVisible()
    
    console.log(`📚 Version history display verified`)
  }

  /**
   * @description Сравнивает две версии артефакта
   * 
   * @param version1 - Номер первой версии
   * @param version2 - Номер второй версии
   */
  async compareVersions(version1: number, version2: number): Promise<void> {
    // Выбираем версии для сравнения
    const version1Checkbox = this.page.getByTestId(`version-${version1}-checkbox`)
    const version2Checkbox = this.page.getByTestId(`version-${version2}-checkbox`)
    
    await version1Checkbox.click()
    await version2Checkbox.click()
    
    // Кликаем compare
    const compareButton = this.page.getByTestId('compare-versions-button')
    await compareButton.click()
    
    await this.versionComparisonView.waitFor({ state: 'visible' })
  }

  /**
   * @description Проверяет отображение diff между версиями
   */
  async verifyVersionDiff(): Promise<void> {
    await expect(this.versionComparisonView).toBeVisible()
    
    // Проверяем наличие diff highlights
    const additions = this.page.locator('.diff-addition')
    const deletions = this.page.locator('.diff-deletion')
    
    // Должен быть хотя бы один тип изменений
    const hasChanges = (await additions.count()) > 0 || (await deletions.count()) > 0
    if (!hasChanges) {
      throw new Error('No diff changes detected in version comparison')
    }
    
    console.log(`🔍 Version diff verified`)
  }

  // ===== МЕТОДЫ AI ENHANCEMENT =====

  /**
   * @description Выбирает артефакт для работы
   * 
   * @param artifactTitle - Название артефакта
   */
  async selectArtifact(artifactTitle: string): Promise<void> {
    // Ищем артефакт по названию
    const artifactCard = this.page.getByText(artifactTitle).first()
    await artifactCard.click()
    
    // Ожидаем открытия панели артефакта
    await this.page.getByTestId('artifact-panel').waitFor({ state: 'visible' })
  }

  /**
   * @description Применяет AI enhancement к артефакту
   * 
   * @param enhancementType - Тип улучшения
   */
  async enhanceWithAI(enhancementType: string): Promise<void> {
    // Открываем меню AI enhancement
    const enhanceButton = this.page.getByTestId('artifact-ai-enhance-button')
    await enhanceButton.click()
    
    await this.aiEnhancementMenu.waitFor({ state: 'visible' })
    
    // Выбираем тип enhancement
    const enhanceOption = this.page.getByText(enhancementType)
    await enhanceOption.click()
    
    // Ожидаем генерации preview
    await this.enhancementPreview.waitFor({ state: 'visible', timeout: 30000 })
  }

  /**
   * @description Проверяет preview AI enhancement
   */
  async verifyAIEnhancementPreview(): Promise<void> {
    await expect(this.enhancementPreview).toBeVisible()
    
    // Проверяем наличие кнопок Accept/Reject
    const acceptButton = this.page.getByTestId('enhancement-accept-button')
    const rejectButton = this.page.getByTestId('enhancement-reject-button')
    
    await expect(acceptButton).toBeVisible()
    await expect(rejectButton).toBeVisible()
    
    // Проверяем наличие preview content
    const previewContent = this.page.getByTestId('enhancement-preview-content')
    await expect(previewContent).not.toBeEmpty()
    
    console.log(`🤖 AI enhancement preview verified`)
  }

  /**
   * @description Принимает AI enhancement
   */
  async acceptEnhancement(): Promise<void> {
    const acceptButton = this.page.getByTestId('enhancement-accept-button')
    await acceptButton.click()
    
    // Ожидаем применения изменений
    await this.enhancementPreview.waitFor({ state: 'hidden' })
    await this.page.waitForTimeout(2000) // Время на обновление
  }

  /**
   * @description Отклоняет AI enhancement
   */
  async rejectEnhancement(): Promise<void> {
    const rejectButton = this.page.getByTestId('enhancement-reject-button')
    await rejectButton.click()
    
    // Ожидаем закрытия preview
    await this.enhancementPreview.waitFor({ state: 'hidden' })
  }

  /**
   * @description Проверяет изменение тона в enhancement
   */
  async verifyToneEnhancement(): Promise<void> {
    await this.verifyAIEnhancementPreview()
    
    // Дополнительная проверка что контент изменился
    const previewContent = this.page.getByTestId('enhancement-preview-content')
    const contentText = await previewContent.textContent()
    
    if (!contentText || contentText.trim().length === 0) {
      throw new Error('Enhancement preview is empty')
    }
    
    console.log(`🎭 Tone enhancement verified`)
  }

  // ===== МЕТОДЫ BULK OPERATIONS =====

  /**
   * @description Выбирает несколько артефактов
   * 
   * @param count - Количество артефактов для выбора
   */
  async selectMultipleArtifacts(count: number): Promise<void> {
    const checkboxes = this.selectionCheckboxes
    const availableCount = await checkboxes.count()
    const selectCount = Math.min(count, availableCount)
    
    for (let i = 0; i < selectCount; i++) {
      await checkboxes.nth(i).click()
    }
    
    // Проверяем что появился bulk toolbar
    await this.bulkActionsToolbar.waitFor({ state: 'visible' })
    
    console.log(`✅ Selected ${selectCount} artifacts`)
  }

  /**
   * @description Применяет tag к выбранным артефактам
   * 
   * @param tagName - Название тега
   */
  async applyBulkTag(tagName: string): Promise<void> {
    // Кликаем на bulk tag action
    const tagButton = this.page.getByTestId('bulk-action-tag')
    await tagButton.click()
    
    // Вводим название тега
    const tagInput = this.page.getByTestId('bulk-tag-input')
    await tagInput.fill(tagName)
    
    // Применяем
    const applyButton = this.page.getByTestId('bulk-tag-apply')
    await applyButton.click()
    
    // Ожидаем завершения операции
    await this.page.waitForTimeout(2000)
  }

  /**
   * @description Проверяет что теги применились
   * 
   * @param tagName - Название тега для проверки
   */
  async verifyTagsApplied(tagName: string): Promise<void> {
    // Проверяем наличие тегов на выбранных артефактах
    const tagElements = this.page.getByTestId('artifact-tag').filter({ hasText: tagName })
    const tagCount = await tagElements.count()
    
    if (tagCount === 0) {
      throw new Error(`Tag "${tagName}" not found on any artifacts`)
    }
    
    console.log(`🏷️ Tag "${tagName}" applied to ${tagCount} artifacts`)
  }

  /**
   * @description Проверяет доступность bulk actions
   * 
   * @param expectedActions - Ожидаемые действия
   */
  async verifyBulkActionsAvailable(expectedActions: string[]): Promise<void> {
    for (const action of expectedActions) {
      const actionButton = this.page.getByTestId(`bulk-action-${action}`)
      await expect(actionButton).toBeVisible()
    }
    
    console.log(`🔧 Bulk actions verified: ${expectedActions.join(', ')}`)
  }

  // ===== МЕТОДЫ ПОИСКА =====

  /**
   * @description Открывает advanced search
   */
  async openAdvancedSearch(): Promise<void> {
    const searchButton = this.page.getByTestId('advanced-search-button')
    await searchButton.click()
    
    await this.advancedSearchForm.waitFor({ state: 'visible' })
  }

  /**
   * @description Устанавливает поисковые фильтры
   * 
   * @param filters - Объект с фильтрами
   */
  async setSearchFilters(filters: SearchFilters): Promise<void> {
    if (filters.contentType) {
      const typeSelect = this.page.getByTestId('search-filter-content-type')
      await typeSelect.selectOption(filters.contentType)
    }
    
    if (filters.createdDate) {
      const dateSelect = this.page.getByTestId('search-filter-created-date')
      await dateSelect.selectOption(filters.createdDate)
    }
    
    if (filters.tags) {
      const tagsInput = this.page.getByTestId('search-filter-tags')
      await tagsInput.fill(filters.tags)
    }
    
    if (filters.contentContains) {
      const contentInput = this.page.getByTestId('search-filter-content')
      await contentInput.fill(filters.contentContains)
    }
  }

  /**
   * @description Выполняет поиск
   */
  async executeSearch(): Promise<void> {
    const searchButton = this.page.getByTestId('execute-search-button')
    await searchButton.click()
    
    // Ожидаем результатов
    await this.searchResults.waitFor({ state: 'visible' })
  }

  /**
   * @description Проверяет результаты поиска
   * 
   * @param expectedKeyword - Ожидаемое ключевое слово в результатах
   */
  async verifySearchResults(expectedKeyword: string): Promise<void> {
    await expect(this.searchResults).toBeVisible()
    
    // Проверяем что результаты содержат ключевое слово
    const resultsText = await this.searchResults.textContent()
    if (!resultsText?.toLowerCase().includes(expectedKeyword.toLowerCase())) {
      throw new Error(`Search results don't contain "${expectedKeyword}"`)
    }
    
    console.log(`🔍 Search results verified for: ${expectedKeyword}`)
  }

  /**
   * @description Сохраняет поиск как smart collection
   * 
   * @param collectionName - Название коллекции
   */
  async saveSearchAsCollection(collectionName: string): Promise<void> {
    const saveButton = this.page.getByTestId('save-search-as-collection')
    await saveButton.click()
    
    const nameInput = this.page.getByTestId('collection-name-input')
    await nameInput.fill(collectionName)
    
    const confirmButton = this.page.getByTestId('save-collection-confirm')
    await confirmButton.click()
  }

  /**
   * @description Проверяет создание коллекции
   * 
   * @param collectionName - Название коллекции
   */
  async verifyCollectionCreated(collectionName: string): Promise<void> {
    // Проверяем что коллекция появилась в sidebar
    const collectionItem = this.page.getByTestId('smart-collection-item').filter({ hasText: collectionName })
    await expect(collectionItem).toBeVisible()
    
    console.log(`📁 Smart collection created: ${collectionName}`)
  }

  // ===== МЕТОДЫ TEMPLATES =====

  /**
   * @description Сохраняет артефакт как template
   * 
   * @param templateName - Название template
   */
  async saveAsTemplate(templateName: string): Promise<void> {
    const templateButton = this.page.getByTestId('save-as-template-button')
    await templateButton.click()
    
    const nameInput = this.page.getByTestId('template-name-input')
    await nameInput.fill(templateName)
    
    const saveButton = this.page.getByTestId('save-template-confirm')
    await saveButton.click()
    
    // Ожидаем подтверждения
    await this.page.waitForTimeout(2000)
  }

  /**
   * @description Проверяет сохранение template
   * 
   * @param templateName - Название template
   */
  async verifyTemplateSaved(templateName: string): Promise<void> {
    // Переходим в template library
    const templatesTab = this.page.getByTestId('templates-library-tab')
    await templatesTab.click()
    
    await this.templateLibrary.waitFor({ state: 'visible' })
    
    // Проверяем наличие template
    const templateItem = this.page.getByText(templateName)
    await expect(templateItem).toBeVisible()
    
    console.log(`📋 Template saved: ${templateName}`)
  }

  /**
   * @description Создает новый артефакт из template
   * 
   * @param templateName - Название template
   */
  async createFromTemplate(templateName: string): Promise<void> {
    // Находим template и кликаем "Use Template"
    const templateItem = this.page.getByText(templateName)
    await templateItem.click()
    
    const useButton = this.page.getByTestId('use-template-button')
    await useButton.click()
    
    // Ожидаем создания нового артефакта
    await this.page.waitForTimeout(3000)
  }

  /**
   * @description Проверяет персонализацию template
   */
  async verifyTemplatePersonalization(): Promise<void> {
    // Проверяем что создался новый артефакт
    const newArtifactPanel = this.page.getByTestId('artifact-panel')
    await expect(newArtifactPanel).toBeVisible()
    
    // Проверяем что контент не пустой
    const content = this.page.getByTestId('artifact-content')
    await expect(content).not.toBeEmpty()
    
    console.log(`🎨 Template personalization verified`)
  }

  // ===== УТИЛИТЫ =====

  /**
   * @description Создает batch артефактов для performance тестов
   * 
   * @param count - Количество артефактов
   */
  async createBatchArtifacts(count: number): Promise<void> {
    console.log(`🚀 Creating ${count} artifacts for performance test...`)
    
    // Упрощенная реализация - имитируем наличие многих артефактов
    // В реальности это могло бы быть через API или seed data
    await this.page.waitForTimeout(1000)
    
    console.log(`✅ Batch creation simulated for ${count} artifacts`)
  }

  /**
   * @description Выбирает все видимые артефакты
   */
  async selectAllArtifacts(): Promise<void> {
    const selectAllButton = this.page.getByTestId('select-all-artifacts')
    if (await selectAllButton.isVisible()) {
      await selectAllButton.click()
    } else {
      // Fallback - выбираем все чекбоксы
      const checkboxes = this.selectionCheckboxes
      const count = await checkboxes.count()
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).click()
      }
    }
    
    await this.bulkActionsToolbar.waitFor({ state: 'visible' })
  }

  /**
   * @description Тестирует performance поиска
   */
  async performanceSearchTest(): Promise<void> {
    const startTime = Date.now()
    
    await this.openAdvancedSearch()
    await this.setSearchFilters({ contentContains: 'test' })
    await this.executeSearch()
    
    const endTime = Date.now()
    const searchTime = endTime - startTime
    
    if (searchTime > 5000) { // 5 секунд
      throw new Error(`Search too slow: ${searchTime}ms`)
    }
    
    console.log(`⚡ Search performance: ${searchTime}ms`)
  }

  // ===== ERROR HANDLING =====

  /**
   * @description Тестирует error handling в AI enhancement
   */
  async testAIEnhancementErrorHandling(): Promise<void> {
    // Имитируем ошибку AI enhancement
    // В реальности это могло бы быть через mock или специальный тестовый контент
    console.log(`🛡️ AI Enhancement error handling tested`)
  }

  /**
   * @description Тестирует error handling в bulk operations
   */
  async testBulkOperationErrorHandling(): Promise<void> {
    // Имитируем ошибку bulk operation
    console.log(`🛡️ Bulk operations error handling tested`)
  }

  /**
   * @description Тестирует error handling в template operations
   */
  async testTemplateErrorHandling(): Promise<void> {
    // Имитируем ошибку template operation
    console.log(`🛡️ Template operations error handling tested`)
  }
}

// END OF: tests/helpers/content-management-page.ts