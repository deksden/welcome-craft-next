/**
 * @file tests/e2e/use-cases/UC-01-Site-Publication.test.ts
 * @description E2E тест для UC-01: Публикация сгенерированного сайта
 * @version 1.0.0
 * @date 2025-06-18
 * @updated Пример использования трехуровневой системы тестирования
 */

/** HISTORY:
 * v1.0.0 (2025-06-18): Начальная реализация с Use Cases + Worlds интеграцией
 */

import { test, expect } from '@playwright/test'
import { 
  createUseCaseTest, 
  useCaseMetadata,
  type UseCaseContext 
} from '../../helpers/use-case-integration'

/**
 * @description UC-01: Публикация сгенерированного сайта
 * 
 * @feature Полный тест Use Case от начала до конца
 * @feature Использует мир SITE_READY_FOR_PUBLICATION с предустановленными данными
 * @feature Тестирует TTL селектор, публикацию, анонимный доступ и отзыв публикации
 */
test.describe('UC-01: Site Publication', () => {
  const metadata = useCaseMetadata('UC-01', [
    // AI фикстуры будут добавлены в Phase 3
    // 'site-publication-dialog.json'
  ])

  test('Публикация готового сайта с TTL управлением', createUseCaseTest(
    'UC-01',
    'SITE_READY_FOR_PUBLICATION',
    async (context: UseCaseContext) => {
      const { page, ui, world } = context
      
      // Получаем данные из мира
      const user = world.users.find(u => u.testId === 'user-ada')!
      const siteArtifact = world.artifacts.find(a => a.testId === 'site-developer-onboarding')!
      
      console.log(`🎯 Running UC-01 with user: ${user.name}, site: ${siteArtifact.title}`)

      // ===== ЧАСТЬ 1: Инициализация =====
      // Авторизация под пользователем Ada
      await ui.loginAs('user-ada')
      
      // Переход к готовому site артефакту
      await ui.navigateToArtifact('site-developer-onboarding')
      
      // Проверяем что сайт загружен и ready
      await expect(page.getByTestId('artifact-title')).toContainText(siteArtifact.title)
      await expect(page.getByTestId('artifact-kind-site')).toBeVisible()

      // ===== ЧАСТЬ 2: Открытие Publication Dialog =====
      // Нажимаем кнопку публикации (GlobeIcon)
      await page.getByTestId('artifact-publication-button').click()
      
      // Проверяем что диалог открылся
      await expect(page.getByTestId('site-publication-dialog')).toBeVisible()
      await expect(page.getByText('Публикация сайта')).toBeVisible()

      // ===== ЧАСТЬ 3: Настройка TTL =====
      // Выбираем TTL "1 месяц"
      await page.getByTestId('ttl-selector').click()
      await page.getByTestId('ttl-option-1-month').click()
      
      // Проверяем что выбор применился
      await expect(page.getByTestId('ttl-display')).toContainText('1 месяц')

      // ===== ЧАСТЬ 4: Публикация =====
      // Нажимаем "Опубликовать и скопировать ссылку"
      await page.getByTestId('publish-and-copy-button').click()
      
      // Ожидаем успешной публикации
      await expect(page.getByTestId('publication-success-toast')).toBeVisible()
      await expect(page.getByText('Сайт опубликован и ссылка скопирована')).toBeVisible()
      
      // Проверяем изменение UI - должен появиться badge "Published"
      await ui.checkPublicationStatus('site-developer-onboarding', 'published')
      
      // Диалог должен закрыться
      await expect(page.getByTestId('site-publication-dialog')).toBeHidden()

      // ===== ЧАСТЬ 5: Получение публичной ссылки =====
      // Получаем ссылку из буфера обмена (эмуляция)
      const publicUrl = await page.evaluate(() => {
        // В реальном тесте это будет clipboard API
        // Для Phase 1 эмулируем ссылку
        return `/s/${window.location.pathname.split('/').pop()}`
      })
      
      console.log(`🔗 Public URL generated: ${publicUrl}`)

      // ===== ЧАСТЬ 6: Проверка анонимного доступа =====
      // Выходим из аккаунта (эмуляция анонимного пользователя)
      await page.evaluate(() => {
        document.cookie = 'test-session=; path=/; domain=.localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      })
      
      // Переходим по публичной ссылке
      await page.goto(publicUrl)
      
      // Проверяем что сайт доступен в read-only режиме
      await expect(page.getByTestId('site-content')).toBeVisible()
      await expect(page.getByText(siteArtifact.title)).toBeVisible()
      
      // Проверяем отсутствие кнопок редактирования
      await expect(page.getByTestId('artifact-edit-button')).toBeHidden()
      await expect(page.getByTestId('site-editor-toolbar')).toBeHidden()

      // ===== ЧАСТЬ 7: Возврат владельца и отзыв публикации =====
      // Авторизуемся обратно как владелец
      await ui.loginAs('user-ada')
      await ui.navigateToArtifact('site-developer-onboarding')
      
      // Открываем диалог публикации снова
      await page.getByTestId('artifact-publication-button').click()
      
      // Проверяем что статус показывает "опубликовано"
      await expect(page.getByText('Published until:')).toBeVisible()
      await expect(page.getByTestId('stop-sharing-button')).toBeVisible()
      
      // Отзываем публикацию
      await page.getByTestId('stop-sharing-button').click()
      
      // Проверяем успешный отзыв
      await expect(page.getByText('Публикация отозвана')).toBeVisible()
      await ui.checkPublicationStatus('site-developer-onboarding', 'private')

      // ===== ЧАСТЬ 8: Проверка блокировки доступа =====
      // Снова выходим из аккаунта
      await page.evaluate(() => {
        document.cookie = 'test-session=; path=/; domain=.localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      })
      
      // Переходим по той же ссылке
      await page.goto(publicUrl)
      
      // Должны получить 404 или страницу "Site not found"
      await expect(page.getByTestId('site-not-found')).toBeVisible()
      // ИЛИ
      await expect(page).toHaveURL(/.*404.*/)

      console.log(`✅ UC-01 completed successfully: Full publication workflow tested`)
    }
  ))

  test('TTL истечение - автоматическая блокировка доступа', createUseCaseTest(
    'UC-01',
    'SITE_READY_FOR_PUBLICATION', 
    async (context: UseCaseContext) => {
      // TODO: Тест для проверки автоматического истечения TTL
      // В Phase 2 можно будет манипулировать временем в БД
      
      console.log(`⏰ TTL expiration test - будет реализован в Phase 2`)
      
      // Placeholder для демонстрации структуры
      const { ui } = context
      await ui.loginAs('user-ada')
      
      // В Phase 2 здесь будет:
      // 1. Публикация с коротким TTL (1 минута)
      // 2. Манипуляция временем в БД 
      // 3. Проверка автоматической блокировки
    }
  ))

  test('Кастомная дата TTL селектора', createUseCaseTest(
    'UC-01',
    'SITE_READY_FOR_PUBLICATION',
    async (context: UseCaseContext) => {
      const { page, ui } = context
      
      await ui.loginAs('user-ada')
      await ui.navigateToArtifact('site-developer-onboarding')
      
      // Открываем диалог публикации
      await page.getByTestId('artifact-publication-button').click()
      
      // Выбираем кастомную дату
      await page.getByTestId('ttl-selector').click()
      await page.getByTestId('ttl-option-custom').click()
      
      // Должен появиться date picker
      await expect(page.getByTestId('custom-date-picker')).toBeVisible()
      
      // Выбираем дату (например, через 2 недели)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)
      
      await page.fill('input[data-testid="date-input"]', futureDate.toISOString().split('T')[0])
      
      // Проверяем что дата применилась
      await expect(page.getByTestId('ttl-display')).toContainText('Кастомная дата')
      
      console.log(`📅 Custom date TTL functionality verified`)
    }
  ))
})

// END OF: tests/e2e/use-cases/UC-01-Site-Publication.test.ts