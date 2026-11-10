import { expect, test } from '@playwright/test';

/**
 * Opening products by clicking (a client navigation, rendered on the server as
 * an RSC request) once crashed with "Body is unusable" when the API answered 429.
 */
test('product pages open by client navigation without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  for (const start of ['/collections/mens-boots', '/collections/womens-boots']) {
    await page.goto(start);
    const hrefs = [
      ...new Set(await page.locator('a[href^="/products/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')))),
    ].slice(0, 3) as string[];
    for (const href of hrefs) {
      await page.goto(start);
      await page.locator(`a[href="${href}"]:visible`).first().click();
      await page.waitForURL(`**${href}`);
      await expect(page.getByTestId('add-to-cart').locator('visible=true')).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
