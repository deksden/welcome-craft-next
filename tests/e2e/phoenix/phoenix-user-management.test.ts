import { test, expect } from '@playwright/test';

test.describe('Phoenix User Management', () => {
  test('should have a basic test', async ({ page }) => {
    await page.goto('/phoenix/users');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });
});
