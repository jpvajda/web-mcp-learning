import { expect, test } from '@playwright/test';

/**
 * Same three actions as the WebMCP tools (add, list, complete) but with
 * ZERO awareness of document.modelContext. This is the "inspect the DOM
 * and hope the selectors stay stable" approach an agent falls back to
 * when a page has no tools.
 *
 * Contrast with src/webmcp.js: an agent there reads inputSchema instead
 * of guessing #title / #priority / button.complete.
 */
test('add, list, and complete a task via raw DOM selectors', async ({ page }) => {
  await page.goto('/');

  await page.locator('#title').fill('Write WebMCP notes');
  await page.locator('#priority').selectOption('high');
  await page.locator('#due-date').fill('2026-09-10');
  await page.locator('#add-task-form button[type="submit"]').click();

  const row = page.locator('#task-list li[data-task-id]').filter({ hasText: 'Write WebMCP notes' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('high');
  await expect(row).toContainText('2026-09-10');

  await row.locator('button.complete').click();
  await expect(row).toHaveClass(/completed/);
  await expect(row.locator('button.complete')).toBeDisabled();
});
