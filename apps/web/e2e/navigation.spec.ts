import { expect, test } from '@playwright/test';

test('hero fills the rest of the first screen', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    // by role, so a hidden copy that is still streaming in is not counted
    const hero = page.getByRole('region', { name: /Full-Grain Leather/ });
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
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

test('home rail can be dragged with the mouse; a drag does not open a tile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const rail = page.getByRole('link', { name: "Men's Boots" }).filter({ has: page.locator('img') }).first().locator('xpath=..');
  await rail.scrollIntoViewIfNeeded();
  const box = (await rail.boundingBox())!;
  const y = box.y + 120;
  await page.mouse.move(box.x + 900, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 400, y, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  await expect(page).toHaveURL(/\/$/);

  // a plain click still opens the tile
  await rail.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/collections\//);
});

test("men's and women's landing pages list sections and link to their collections", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [slug, title] of [['mens', "Men's Collection"], ['womens', "Women's Collection"]]) {
    await page.goto(`/collections/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    const first = page.getByRole('region').filter({ has: page.getByTestId('product-card') }).first();
    await expect(first.getByTestId('product-card')).toHaveCount(9);
  }
  await page.getByRole('link', { name: 'Shop all handbags' }).click();
  await expect(page).toHaveURL(/\/collections\/womens-handbags$/);
});
