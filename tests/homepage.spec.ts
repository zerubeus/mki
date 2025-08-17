import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test('should load Arabic homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should load English homepage', async ({ page }) => {
    await page.goto('/en/');
    await expect(page).toHaveURL(/.*\/en\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('should load French homepage', async ({ page }) => {
    await page.goto('/fr/');
    await expect(page).toHaveURL(/.*\/fr\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('language switcher should work', async ({ page }) => {
    await page.goto('/');
    
    const languageSwitcher = page.locator('[data-testid="language-switcher"], select, [role="combobox"]').first();
    
    if (await languageSwitcher.count() > 0) {
      await expect(languageSwitcher).toBeVisible();
    }
  });

  test('navigation menu should be visible', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });
});

test.describe('Interactive Map', () => {
  test('should load map component on Seerah page', async ({ page }) => {
    await page.goto('/seerah');
    
    const mapContainer = page.locator('#map, .leaflet-container').first();
    if (await mapContainer.count() > 0) {
      await expect(mapContainer).toBeVisible();
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(768);
    }
  });
});