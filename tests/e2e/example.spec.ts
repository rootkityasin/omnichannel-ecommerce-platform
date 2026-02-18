import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title to contain "Omnichannel Ecommerce Platform".
    await expect(page).toHaveTitle(/Omnichannel Ecommerce Platform/);
});
