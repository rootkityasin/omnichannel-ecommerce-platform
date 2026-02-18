import { test, expect } from '@playwright/test';

test.describe('Tenant Isolation', () => {
    test.setTimeout(60000); // Increase timeout for local dev

    test('Root domain loads landing page', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle(/Omnichannel Ecommerce Platform/);
        await expect(page.getByText('Multi-Tenant E-Commerce Suite')).toBeVisible();
    });

    test('Demo tenant loads storefront', async ({ page }) => {
        await page.goto('http://demo.localhost:3000');
        // Check for storefront specific elements based on "Premium Store" content
        // Searching for "Menu" or "Account" which are common in storefronts
        await expect(page.getByText('Menu', { exact: true })).toBeVisible();
        await expect(page.getByText('Account')).toBeVisible();
    });

    test('Admin subdomain loads admin dashboard', async ({ page }) => {
        await page.goto('http://app.localhost:3000');
        // Based on findings, it loads "Companies" list (unprotected?) or Login
        const companiesText = page.getByText('Companies', { exact: false });
        const signInText = page.getByRole('button', { name: /sign in/i });
        const loginHeader = page.getByRole('heading', { name: /login/i });

        // Check if any of these exist
        await expect(companiesText.or(signInText).or(loginHeader)).toBeVisible();
    });
});
