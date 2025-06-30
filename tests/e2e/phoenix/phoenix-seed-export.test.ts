import { test, expect } from '@playwright/test';

test.describe('Phoenix Seed Export', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we are logged in as admin before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat'); // Wait for successful login redirect
    await page.goto('/phoenix/seed-export');
    await expect(page.getByRole('heading', { name: 'Seed Export' })).toBeVisible();
  });

  test('should display form elements and allow export', async ({ page }) => {
    // Check if form elements are visible
    await expect(page.getByLabel('Select World')).toBeVisible();
    await expect(page.getByLabel('Data Source')).toBeVisible();
    await expect(page.getByLabel('Include binary files (blobs)')).toBeVisible();
    await expect(page.getByLabel('Directory Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Export' })).toBeVisible();

    // Select a world (assuming there's at least one world available)
    await page.locator('#world-select').click();
    await page.locator('.select-content div[role="option"]').first().click();

    // Select a data source (e.g., BETA)
    await page.locator('#source-db').click();
    await page.getByText('BETA').click();

    // Check the include blobs checkbox
    await page.locator('#include-blobs').check();

    // Fill in a custom directory name
    await page.locator('#seed-name').fill('my-custom-seed-export');

    // Mock the API response for export
    await page.route('/api/phoenix/seed/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, path: '/tmp/exported/my-custom-seed-export' }),
      });
    });

    // Click the export button
    await page.getByRole('button', { name: 'Start Export' }).click();

    // Expect success toast and result message
    await expect(page.getByText('Seed export initiated successfully!')).toBeVisible();
    await expect(page.getByText('Export successful! Path: /tmp/exported/my-custom-seed-export')).toBeVisible();
  });

  test('should show error for missing fields', async ({ page }) => {
    // Click export without filling anything
    await page.getByRole('button', { name: 'Start Export' }).click();
    await expect(page.getByText('Please fill all required fields.')).toBeVisible();
  });

  test('should show manual DB URL input when selected', async ({ page }) => {
    await expect(page.getByLabel('Manual DB URL')).not.toBeVisible();
    await page.locator('#source-db').click();
    await page.getByText('Specify Manually').click();
    await expect(page.getByLabel('Manual DB URL')).toBeVisible();
  });
});
