/**
 * @file tests/helpers/site-editor-page.ts
 * @description UC-10 SCHEMA-DRIVEN CMS - Page Object Model для визуального редактора сайтов.
 * @version 1.0.0
 * @date 2025-06-20
 * @updated UC-10 SCHEMA-DRIVEN CMS - Создан POM для взаимодействия с новым SiteEditor компонентом и ArtifactSelectorSheet.
 */

/** HISTORY:
 * v1.0.0 (2025-06-20): UC-10 SCHEMA-DRIVEN CMS - Создан POM для Site Editor с поддержкой block manipulation, artifact selection и publication workflow.
 */

import { type Page, type Locator, expect } from '@playwright/test'
import { TestUtils } from '../helpers/test-utils'

/**
 * @description Page Object Model для взаимодействия с Site Editor в UC-10 архитектуре
 * @feature Поддержка блочного редактирования, выбора артефактов и публикации сайтов
 */
export class SiteEditorPage {
  private testUtils: TestUtils

  constructor(private page: Page) {
    this.testUtils = new TestUtils(page)
  }

  // =============================================================================
  // Основные локаторы Site Editor
  // =============================================================================

  /**
   * @description Основной контейнер Site Editor
   */
  get siteEditorContainer(): Locator {
    return this.page.getByTestId('site-editor-container')
  }

  /**
   * @description Кнопка добавления нового блока
   */
  get addBlockButton(): Locator {
    return this.page.getByTestId('site-editor-add-block')
  }

  /**
   * @description Dropdown меню выбора типа блока
   */
  get blockTypeSelect(): Locator {
    return this.page.getByTestId('site-editor-block-type-select')
  }

  /**
   * @description Кнопка сохранения сайта
   */
  get saveSiteButton(): Locator {
    return this.page.getByTestId('site-editor-save-button')
  }

  /**
   * @description Кнопка предварительного просмотра
   */
  get previewButton(): Locator {
    return this.page.getByTestId('site-editor-preview-button')
  }

  /**
   * @description Кнопка публикации сайта
   */
  get publishButton(): Locator {
    return this.page.getByTestId('site-editor-publish-button')
  }

  // =============================================================================
  // Локаторы для блоков сайта
  // =============================================================================

  /**
   * @description Получает блок сайта по индексу
   * @param blockIndex - Индекс блока в списке (0-based)
   */
  getSiteBlock(blockIndex: number): Locator {
    return this.page.getByTestId(`site-block-${blockIndex}`)
  }

  /**
   * @description Получает заголовок блока
   * @param blockIndex - Индекс блока
   */
  getSiteBlockTitle(blockIndex: number): Locator {
    return this.page.getByTestId(`site-block-${blockIndex}-title`)
  }

  /**
   * @description Получает кнопку "Добавить артефакт" для блока
   * @param blockIndex - Индекс блока
   */
  getAddArtifactButton(blockIndex: number): Locator {
    return this.page.getByTestId(`site-block-${blockIndex}-add-artifact`)
  }

  /**
   * @description Получает кнопку удаления блока
   * @param blockIndex - Индекс блока
   */
  getDeleteBlockButton(blockIndex: number): Locator {
    return this.page.getByTestId(`site-block-${blockIndex}-delete`)
  }

  /**
   * @description Получает слот артефакта внутри блока
   * @param blockIndex - Индекс блока
   * @param slotKey - Ключ слота (например, 'content', 'title')
   */
  getArtifactSlot(blockIndex: number, slotKey: string): Locator {
    return this.page.getByTestId(`site-block-${blockIndex}-slot-${slotKey}`)
  }

  // =============================================================================
  // Локаторы ArtifactSelectorSheet
  // =============================================================================

  /**
   * @description Основной контейнер ArtifactSelectorSheet
   */
  get artifactSelectorSheet(): Locator {
    return this.page.getByTestId('artifact-selector-sheet')
  }

  /**
   * @description Поле поиска артефактов
   */
  get artifactSearchInput(): Locator {
    return this.page.getByTestId('artifact-selector-search')
  }

  /**
   * @description Фильтр по типу артефактов
   */
  get artifactKindFilter(): Locator {
    return this.page.getByTestId('artifact-selector-kind-filter')
  }

  /**
   * @description Кнопка создания нового артефакта
   */
  get createNewArtifactButton(): Locator {
    return this.page.getByTestId('artifact-selector-create-new')
  }

  /**
   * @description Получает артефакт в списке селектора по индексу
   * @param artifactIndex - Индекс артефакта в списке
   */
  getArtifactInSelector(artifactIndex: number): Locator {
    return this.page.getByTestId(`artifact-selector-item-${artifactIndex}`)
  }

  /**
   * @description Кнопка выбора артефакта
   * @param artifactIndex - Индекс артефакта
   */
  getSelectArtifactButton(artifactIndex: number): Locator {
    return this.page.getByTestId(`artifact-selector-item-${artifactIndex}-select`)
  }

  // =============================================================================
  // Высокоуровневые методы взаимодействия
  // =============================================================================

  /**
   * @description Ждет полной загрузки Site Editor
   * @feature Проверяет наличие основных UI элементов
   */
  async waitForSiteEditorLoad(): Promise<void> {
    await expect(this.siteEditorContainer).toBeVisible()
    await expect(this.addBlockButton).toBeVisible()
    await expect(this.saveSiteButton).toBeVisible()
  }

  /**
   * @description Добавляет новый блок к сайту
   * @param blockType - Тип блока (hero, content, contacts, etc.)
   * @returns Promise, который резолвится после добавления блока
   */
  async addSiteBlock(blockType: string): Promise<void> {
    await this.addBlockButton.click()
    await this.blockTypeSelect.selectOption(blockType)
    
    // Ждем появления нового блока
    const newBlockIndex = await this.getSiteBlocksCount()
    await expect(this.getSiteBlock(newBlockIndex - 1)).toBeVisible()
  }

  /**
   * @description Получает количество блоков в сайте
   * @returns Promise с количеством блоков
   */
  async getSiteBlocksCount(): Promise<number> {
    const blocks = await this.page.locator('[data-testid^="site-block-"]').count()
    return blocks
  }

  /**
   * @description Добавляет артефакт в слот блока
   * @param blockIndex - Индекс блока
   * @param slotKey - Ключ слота
   * @param artifactIndex - Индекс артефакта в селекторе
   */
  async addArtifactToSlot(blockIndex: number, slotKey: string, artifactIndex: number): Promise<void> {
    // Открываем слот для редактирования
    await this.getArtifactSlot(blockIndex, slotKey).click()
    
    // Ждем появления ArtifactSelectorSheet
    await expect(this.artifactSelectorSheet).toBeVisible()
    
    // Выбираем артефакт
    await this.getSelectArtifactButton(artifactIndex).click()
    
    // Ждем закрытия селектора
    await expect(this.artifactSelectorSheet).not.toBeVisible()
  }

  /**
   * @description Ищет артефакты в селекторе
   * @param searchQuery - Поисковый запрос
   */
  async searchArtifacts(searchQuery: string): Promise<void> {
    await this.artifactSearchInput.fill(searchQuery)
    // Ждем обновления результатов поиска
    await this.page.waitForTimeout(500)
  }

  /**
   * @description Фильтрует артефакты по типу
   * @param artifactKind - Тип артефакта (text, image, site, etc.)
   */
  async filterArtifactsByKind(artifactKind: string): Promise<void> {
    await this.artifactKindFilter.selectOption(artifactKind)
    // Ждем обновления результатов фильтрации
    await this.page.waitForTimeout(500)
  }

  /**
   * @description Сохраняет изменения сайта
   * @returns Promise, который резолвится после сохранения
   */
  async saveSite(): Promise<void> {
    await this.saveSiteButton.click()
    
    // Ждем подтверждения сохранения (например, toast notification)
    await this.page.waitForTimeout(1000)
  }

  /**
   * @description Публикует сайт
   * @returns Promise, который резолвится после публикации
   */
  async publishSite(): Promise<void> {
    await this.publishButton.click()
    
    // Ждем подтверждения публикации
    await this.page.waitForTimeout(1000)
  }

  /**
   * @description Открывает предварительный просмотр сайта
   * @returns Promise, который резолвится после открытия превью
   */
  async openPreview(): Promise<void> {
    await this.previewButton.click()
    
    // Ждем загрузки превью
    await this.page.waitForTimeout(1000)
  }

  /**
   * @description Удаляет блок из сайта
   * @param blockIndex - Индекс блока для удаления
   */
  async deleteSiteBlock(blockIndex: number): Promise<void> {
    await this.getDeleteBlockButton(blockIndex).click()
    
    // Ждем исчезновения блока
    await expect(this.getSiteBlock(blockIndex)).not.toBeVisible()
  }

  /**
   * @description Проверяет, что блок содержит артефакт в указанном слоте
   * @param blockIndex - Индекс блока
   * @param slotKey - Ключ слота
   * @param expectedArtifactTitle - Ожидаемый заголовок артефакта
   */
  async expectSlotHasArtifact(blockIndex: number, slotKey: string, expectedArtifactTitle: string): Promise<void> {
    const slot = this.getArtifactSlot(blockIndex, slotKey)
    await expect(slot).toContainText(expectedArtifactTitle)
  }

  /**
   * @description Проверяет, что селектор артефактов содержит определенное количество элементов
   * @param expectedCount - Ожидаемое количество артефактов
   */
  async expectArtifactSelectorHasCount(expectedCount: number): Promise<void> {
    const artifacts = await this.page.locator('[data-testid^="artifact-selector-item-"]').count()
    expect(artifacts).toBe(expectedCount)
  }
}

// END OF: tests/helpers/site-editor-page.ts