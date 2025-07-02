import { test, } from '@playwright/test';
import { universalAuthentication } from '../../helpers/auth.helper';
import { PhoenixSeedExportPage } from '../../pages/phoenix-seed-export.page';
import crypto from 'node:crypto';

test.describe('Phoenix Seed Export', () => {
  let seedExportPage: PhoenixSeedExportPage;
  
  // Увеличиваем timeout для работы с Radix UI Select компонентами
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    seedExportPage = new PhoenixSeedExportPage(page);
    
    // Mock the worlds API to return test data
    await page.route('/api/phoenix/worlds', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'TEST_WORLD_001', name: 'Test World 1' },
          { id: 'TEST_WORLD_002', name: 'Test World 2' }
        ]),
      });
    });
    
    // Authenticate admin user before each test and navigate to Phoenix seed export page
    await universalAuthentication(page, {
      email: `phoenix-seed-export-${Date.now()}@test.com`,
      id: crypto.randomUUID(),
      type: 'admin'  // КРИТИЧНО: Требуются admin права для Phoenix
    }, {
      targetPath: '/phoenix/seed-export',
      skipNavigation: false
    });
    
    // Debug page state if needed
    await seedExportPage.debugPageState();
    
    // Verify page is ready for testing
    await seedExportPage.verifyPageReady();
  });

  test('should display form elements and allow export', async ({ page }) => {
    // Check if all form elements are visible
    await seedExportPage.verifyAllFormElements();

    // Mock the API response for export
    await page.route('/api/phoenix/seed/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, path: '/tmp/exported/my-custom-seed-export' }),
      });
    });

    // Perform full export using POM
    await seedExportPage.performFullExport({
      worldName: 'Test World 1',
      dataSource: 'LOCAL',  // Используем LOCAL вместо BETA для тестов
      includeBlobs: true,
      directoryName: 'my-custom-seed-export'
    });

    // Verify export success
    await seedExportPage.verifyExportSuccess('/tmp/exported/my-custom-seed-export');
  });

  test('should show error for missing fields', async ({ page }) => {
    // Test missing fields error using POM
    await seedExportPage.testMissingFieldsError();
  });

  test('should show manual DB URL input when selected', async ({ page }) => {
    // Test manual DB URL visibility using POM
    await seedExportPage.verifyManualDbUrlVisibility();
  });
});
