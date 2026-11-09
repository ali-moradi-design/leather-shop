import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@weltandgrain.local', password: 'Admin123!' };

async function signIn(page: Page, next: string) {
  await page.goto(`/account/login?next=${encodeURIComponent(next)}`);
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/\//g, '\\/')));
}

test('admin creates a product, sees it in the shop, deletes and restores it', async ({ page }) => {
  await signIn(page, '/admin/products/new');
  const color = `Oxblood ${Date.now()}`;

  // client-side validation from the shared zod schema
  await page.getByRole('button', { name: 'Create product' }).click();
  await expect(page.locator('#name-error')).toHaveText('Enter a name');

  await page.getByRole('textbox', { name: 'Style name' }).fill('E2E Ranger');
  await page.getByRole('textbox', { name: 'Color', exact: true }).fill(color);
  await page.getByRole('textbox', { name: 'Price (USD)' }).fill('210');
  await page.getByRole('textbox', { name: 'Compare-at price (optional)' }).fill('300');
  await page.getByRole('textbox', { name: 'Size, row 1' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Stock, row 1' }).fill('4');
  await page.getByRole('button', { name: 'Create product' }).click();
  await expect(page.getByText('Product created. It is live in the shop.')).toBeVisible({ timeout: 15_000 });

  // the cached catalog was refreshed: the shop shows it at once, on sale
  const shop = await page.context().newPage();
  await shop.goto(`/products/mens-e2e-ranger-${color.toLowerCase().replace(/ /g, '-')}`);
  await expect(shop.getByRole('heading', { name: 'E2E Ranger', exact: true })).toBeVisible();
  await expect(shop.getByText('30% off')).toBeVisible();
  await shop.close();

  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Move to trash' }).click();
  await expect(page).toHaveURL(/\/admin\/products\?deleted=1/, { timeout: 15_000 });

  await page.goto('/admin/products/trash');
  await page.waitForLoadState('networkidle'); // the Restore button works once hydrated
  const row = page.getByRole('row', { name: new RegExp(`E2E Ranger \\| ${color}`) });
  await row.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByText(/is back in the shop/)).toBeVisible({ timeout: 15_000 });
});

test('admin product list has no serious accessibility violations', async ({ page }) => {
  await signIn(page, '/admin/products');
  await expect(page.getByTestId('admin-product').first()).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
