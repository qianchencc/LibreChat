import { expect, test } from '@playwright/test';

test.describe('in-app help', () => {
  test('keeps help navigation when chat initialization finishes during route loading', async ({
    page,
  }) => {
    let releaseModels!: () => void;
    let releaseHelp!: () => void;
    const modelsReady = new Promise<void>((resolve) => {
      releaseModels = resolve;
    });
    const helpReady = new Promise<void>((resolve) => {
      releaseHelp = resolve;
    });
    await page.route('**/api/models', async (route) => {
      await modelsReady;
      await route.continue();
    });
    await page.route('**/assets/Help.*.js', async (route) => {
      await helpReady;
      await route.continue();
    });
    await page.goto('/c/new');
    const helpRequested = page.waitForRequest('**/assets/Help.*.js');
    await page.getByTestId('nav-panel-help').click();
    await helpRequested;
    const modelsResponse = page.waitForResponse('**/api/models');
    releaseModels();
    await modelsResponse;
    // Keep the lazy route pending while React processes the completed startup queries.
    await page.waitForTimeout(300);
    releaseHelp();
    await expect(page).toHaveURL(/\/help$/);
    await expect(page.getByRole('heading', { name: 'Help center' })).toBeVisible();
  });

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
