import { expect, test } from '@playwright/test';

test.describe('in-app help', () => {
  test('opens from the sidebar and account menu, then switches guides', async ({ page }) => {
    await page.goto('/c/new');

    await page.getByTestId('nav-panel-help').click();
    await expect(page).toHaveURL(/\/help$/);
    await expect(page.getByRole('heading', { name: 'Help center' })).toBeVisible();
    await expect(page.getByTestId('nav-panel-help')).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Upload and reference a file' }).click();
    await expect(
      page.getByRole('heading', { name: 'Upload and reference a file', level: 2 }),
    ).toBeVisible();

    await page.goto('/c/new');
    await page.getByTestId('nav-user').click();
    await page.getByRole('menuitem', { name: 'Help' }).click();
    await page.getByRole('menuitem', { name: 'Help & FAQ' }).click();
    await expect(page).toHaveURL(/\/help$/);
  });

  test('keeps the guide usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/help');

    await expect(page.getByRole('heading', { name: 'Help center' })).toBeVisible();
    await expect(page.getByTestId('open-sidebar-button')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Guides' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
