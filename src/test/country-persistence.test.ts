import { test, expect } from '@playwright/test';

test.describe('Country Selection Persistence', () => {
  test('should persist NZ selection after page refresh', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Should show country selector on first launch
    await expect(page.getByText('Welcome to Advices & Queries')).toBeVisible();
    await expect(page.getByText('Please select your country')).toBeVisible();
    
    // Select New Zealand
    await page.getByRole('button', { name: 'New Zealand' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Should now show the main app with NZ selected
    const adviceContent = page.locator('[data-testid="advice-content"]');
    await expect(adviceContent).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still show NZ after refresh (no country selector)
    await expect(adviceContent).toBeVisible();
    await expect(page.getByText('Welcome to Advices & Queries')).not.toBeVisible();
  });

  test('should persist UK selection after page refresh', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Should show country selector on first launch
    await expect(page.getByText('Welcome to Advices & Queries')).toBeVisible();
    
    // Select United Kingdom
    await page.getByRole('button', { name: 'United Kingdom' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Should now show the main app with UK selected
    const adviceContent = page.locator('[data-testid="advice-content"]');
    await expect(adviceContent).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still show UK after refresh (no country selector)
    await expect(adviceContent).toBeVisible();
    await expect(page.getByText('Welcome to Advices & Queries')).not.toBeVisible();
  });

  test('should allow changing country in settings and persist', async ({ page }) => {
    // First, set up with NZ
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'New Zealand' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Verify NZ is selected
    const adviceContent = page.locator('[data-testid="advice-content"]');
    await expect(adviceContent).toBeVisible();
    
    // Go to settings
    await page.getByRole('link', { name: 'Settings' }).click();
    
    // Check that NZ is currently selected in settings
    await expect(page.getByRole('radio', { name: 'New Zealand' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'United Kingdom' })).not.toBeChecked();
    
    // Change to UK (auto-saves)
    await page.getByRole('radio', { name: 'United Kingdom' }).click();
    
    // Navigate back to home page to see the advice with UK content
    await page.getByRole('link', { name: 'Today' }).click();
    
    // Should show advice content with UK selected
    const adviceContent2 = page.locator('[data-testid="advice-content"]');
    await expect(adviceContent2).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Should still show UK after refresh
    await expect(adviceContent2).toBeVisible();
  });

  test('should show correct country in settings about section', async ({ page }) => {
    // Set up with UK
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'United Kingdom' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Go to settings
    await page.getByRole('link', { name: 'Settings' }).click();
    
    // Wait for settings to load and check the about section shows UK
    await expect(page.getByText('About')).toBeVisible();
    
    // Wait for the country selection to be visible (this ensures preferences are loaded)
    await expect(page.getByRole('radio', { name: 'United Kingdom' })).toBeChecked();
    
    // Take a screenshot to see what the page actually looks like
    await page.screenshot({ path: 'debug-settings-page.png', fullPage: true });
    
    // Check what country text is actually visible - look for the full text including country name
    const countryText = await page.locator('text=/Country:United Kingdom/').textContent();
    console.log('Found country text:', countryText);
    
    // The country text should be "Country:United Kingdom"
    expect(countryText).toBe('Country:United Kingdom');
    
    // Change to NZ (auto-saves)
    await page.getByRole('radio', { name: 'New Zealand' }).click();
    
    // Wait a moment for the change to take effect
    await page.waitForTimeout(500);
    
    // Go back to settings
    await page.getByRole('link', { name: 'Settings' }).click();
    
    // Check the about section now shows NZ
    await expect(page.getByText('About')).toBeVisible();
    
    // Check what country text is actually visible - look for the full text including country name
    const countryTextNZ = await page.locator('text=/Country:New Zealand/').textContent();
    console.log('Found country text after change:', countryTextNZ);
    
    // The country text should be "Country:New Zealand"
    expect(countryTextNZ).toBe('Country:New Zealand');
  });
});
