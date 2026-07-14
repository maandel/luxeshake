import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('/');

  // Check if the page title contains LuxeShake
  await expect(page).toHaveTitle(/LuxeShake/);
});
