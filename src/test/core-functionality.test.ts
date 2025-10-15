import { test, expect } from '@playwright/test';

test.describe('Core App Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up with NZ for each test
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'New Zealand' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('should load daily advice on home page', async ({ page }) => {
    // Should show advice content (not loading state)
    await expect(page.getByText('Loading today\'s reflection...')).not.toBeVisible();
    
    // Should show advice content
    const adviceContent = page.locator('[data-testid="advice-content"]');
    await expect(adviceContent).toBeVisible();
  });

  test('should show daily advice persistence', async ({ page }) => {
    // Get initial advice content
    const initialAdvice = page.locator('[data-testid="advice-content"]');
    const initialText = await initialAdvice.textContent();
    
    // Refresh the page
    await page.reload();
    
    // Should show the same advice (daily persistence)
    const reloadedAdvice = page.locator('[data-testid="advice-content"]');
    await expect(reloadedAdvice).toBeVisible();
    
    // The advice should be the same (daily persistence working)
    const reloadedText = await reloadedAdvice.textContent();
    expect(reloadedText).toBe(initialText);
  });

  test('should navigate to list page and show all advices', async ({ page }) => {
    // Click All A+Qs in bottom navigation
    await page.getByRole('link', { name: 'All A+Qs' }).click();
    
    // Should be on list page
    await expect(page.getByText('All A+Qs')).toBeVisible();
    
    // Should show search box
    await expect(page.getByPlaceholder('Search advices and queries...')).toBeVisible();
    
    // Should show advice cards
    const adviceCards = page.locator('[data-testid="advice-card"]');
    await expect(adviceCards.first()).toBeVisible();
  });

  test('should search and filter advices', async ({ page }) => {
    // Go to list page
    await page.getByRole('link', { name: 'All A+Qs' }).click();
    
    // Search for "love"
    await page.getByPlaceholder('Search advices and queries...').fill('love');
    
    // Should show filtered results
    const adviceCards = page.locator('[data-testid="advice-card"]');
    await expect(adviceCards.first()).toBeVisible();
    
    // Clear search
    await page.getByPlaceholder('Search advices and queries...').fill('');
    
    // Should show all advices again
    await expect(adviceCards.first()).toBeVisible();
  });

  test('should navigate back to home from list page', async ({ page }) => {
    // Go to list page
    await page.getByRole('link', { name: 'All A+Qs' }).click();
    
    // Click Today in bottom navigation
    await page.getByRole('link', { name: 'Today' }).click();
    
    // Should be back on home page
    const adviceContent = page.locator('[data-testid="advice-content"]');
    await expect(adviceContent).toBeVisible();
  });

  test('should show bottom navigation', async ({ page }) => {
    // Should show bottom navigation with all three tabs
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All A+Qs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });
});
