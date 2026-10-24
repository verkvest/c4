import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  deviceScaleFactor: 1,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

test('phone menu and gameplay', async ({ page }) => {
  mkdirSync('phone-screenshots', { recursive: true })
  await page.goto('/')

  const menu = page.locator('.init-screen')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('heading', { name: 'Aureline' })).toBeVisible()
  await page.getByRole('button', { name: 'Grove' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'grove')
  await page.getByRole('button', { name: 'Harbor' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'harbor')
  await page.screenshot({ path: 'phone-screenshots/menu.png', fullPage: true })

  await page.getByRole('button', { name: 'Credits and licenses' }).click()
  const credits = page.locator('.credits-screen')
  await expect(credits).toContainText('Kenrick')
  await expect(credits).toContainText('MIT License')
  await credits.getByRole('button', { name: 'Close' }).click()
  await expect(credits).not.toBeVisible()

  await page.getByRole('radio', { name: 'Pass and play' }).check()
  await expect(page.locator('.difficulty-fieldset')).toBeHidden()
  await page.getByRole('radio', { name: 'Play a rival' }).check()
  await expect(page.locator('.difficulty-fieldset')).toBeVisible()
  await page.getByRole('radio', { name: 'Sharp' }).check()
  await page.getByRole('radio', { name: 'Pass and play' }).check()
  await page.getByRole('button', { name: 'Start game' }).click()
  await expect(menu).not.toBeVisible()

  const firstColumn = page.locator('.game-control').first()
  await expect(firstColumn).toBeEnabled()
  await firstColumn.click()
  await page.locator('.game-control[data-column="2"]').click()
  await page.locator('.game-control[data-column="1"]').click()
  await expect(page.locator('.section-message')).toContainText(
    "Player 2's turn.",
  )
  await page.screenshot({
    path: 'phone-screenshots/gameplay.png',
    fullPage: true,
  })
})
