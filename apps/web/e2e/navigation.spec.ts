import { expect, test } from '@playwright/test';

test('hero fills the rest of the first screen', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const box = await page.locator('section[aria-labelledby="hero-title"]').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.y + box!.height)).toBe(viewport.height);
  }
});

test('mega menu opens on hover, closes with Escape and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const men = page.getByRole('button', { name: 'Men', exact: true });
  await men.hover();
  await expect(men).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mega-men').getByRole('link', { name: 'Captain' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(men).toHaveAttribute('aria-expanded', 'false');
  await expect(men).toBeFocused();

  await men.click();
  await page.locator('#mega-men').getByRole('link', { name: 'Captain' }).click();
  await expect(page).toHaveURL(/\/collections\/mens-boots\?q=Captain/);
  await expect(men).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('product-card').first()).toContainText('Captain');
});

test('mobile menu drawer and filter drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Site menu' });
  await expect(menu).toBeVisible();
  await menu.locator('summary', { hasText: 'Women' }).click();
  await menu.getByRole('link', { name: 'All Handbags' }).click();
  await expect(page).toHaveURL(/\/collections\/womens-handbags/);
  await expect(menu).toBeHidden();

  await page.getByRole('button', { name: /^Filter/ }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await expect(filters).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(filters).toBeHidden();
});
