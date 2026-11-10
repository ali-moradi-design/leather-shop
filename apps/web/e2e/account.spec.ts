import { expect, test } from '@playwright/test';

test('guest checkout is offered on the way to checkout, and forgot password answers', async ({ page }) => {
  await page.goto('/account/login?next=/checkout');
  await expect(page.getByRole('heading', { name: 'New customer?' }).locator('visible=true')).toBeVisible();
  await page.getByRole('link', { name: 'Forgot your password?' }).locator('visible=true').click();
  await expect(page).toHaveURL(/forgot-password/);
  await page.getByRole('textbox', { name: 'Email', exact: true }).locator('visible=true').fill('nobody@example.com');
  await page.getByRole('button', { name: 'Email me a link' }).locator('visible=true').click();
  await expect(page.getByText(/a link to reset the password is on its way/)).toBeVisible();
});

test('search suggests products while typing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search' }).first().click();
  await page.getByRole('combobox').fill('boot');
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  await page.getByRole('combobox').press('ArrowDown');
  await page.getByRole('combobox').press('Enter');
  await expect(page).toHaveURL(/\/products\//);
});

test('every page tells search engines to stay away', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['x-robots-tag']).toContain('noindex');
  expect(await res.text()).toContain('<meta name="robots" content="noindex, nofollow, nocache"/>');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).not.toContain('Sitemap');
});
