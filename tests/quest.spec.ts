import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { getScore, getScoreRange, scenarios } from '../src/data'

async function startQuest(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать квест', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Если другу трудно дышать')
  await page.getByRole('button', { name: 'Всё понятно, начнём' }).click()
}

async function checkWidth(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

async function finishWithPoints(page: Page, points: 0 | 5 | 10) {
  let score = 0
  for (const [i, scene] of scenarios.entries()) {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(scene.title)
    await checkWidth(page)
    await page
      .locator('.answer-option')
      .nth(scene.options.findIndex((option) => option.points === points))
      .click()
    score += points
    await expect(page.getByTestId('score')).toHaveText(String(score))
    await expect(page.locator('.feedback')).toContainText('потому что')
    await expect(page.locator('.answer-option:disabled')).toHaveCount(3)
    await page.getByRole('button', { name: i === 5 ? 'Узнать результат' : 'Следующая ситуация' }).click()
  }
}

test('content and scoring satisfy the brief', () => {
  expect(scenarios).toHaveLength(6)
  for (const scene of scenarios) {
    expect(scene.options).toHaveLength(3)
    expect(scene.options.map((answer) => answer.points).sort((a, b) => a - b)).toEqual([0, 5, 10])
    for (const answer of scene.options) expect(answer.feedback).toContain('потому что')
  }
  for (const score of [0, 25, 26, 45, 46, 60]) {
    expect(getScoreRange(score).min).toBeLessThanOrEqual(score)
    expect(getScoreRange(score).max).toBeGreaterThanOrEqual(score)
  }
  expect(getScore(scenarios.map((scene) => scene.options.findIndex((option) => option.points === 10)))).toBe(
    60,
  )
})

test('start screen has a disclaimer, six scenes and a working preview link', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Астма:')
  await expect(page.locator('.disclaimer')).toContainText('не медицинская инструкция')
  await expect(page.locator('.scene-card')).toHaveCount(6)
  await expect(page.getByTestId('score')).toHaveText('0')
  await page.getByRole('button', { name: 'Что меня ждёт?' }).click()
  await expect(page.getByRole('heading', { name: 'Один друг. Шесть ситуаций.' })).toBeInViewport()
  await checkWidth(page)
})

test('complete quest: 60 points, checklist, help, download, review and restart', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  await startQuest(page)
  await finishWithPoints(page, 10)
  await expect(page.getByRole('heading', { name: 'Ты — надёжный друг!', exact: true })).toBeVisible()
  await expect(page.locator('.score-ring-inner > strong')).toHaveText('60/ 60')
  await expect(page.locator('.remember-list > li')).toHaveCount(4)
  await expect(page.getByRole('link', { name: '103 — скорая помощь в России' })).toHaveAttribute(
    'href',
    'tel:103',
  )
  await expect(page.getByRole('link', { name: '112 — экстренная помощь', exact: true })).toHaveAttribute(
    'href',
    'tel:112',
  )
  await expect(page.locator('.disclaimer-final')).toContainText('не медицинская инструкция')
  await page.locator('.review > summary').click()
  await expect(page.locator('.review-list > article')).toHaveCount(6)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Сохранить памятку', exact: true }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('ryadom-pamyatka.txt')
  const contents = readFileSync((await download.path())!, 'utf8')
  expect(contents).toContain('Сообщи взрослому')
  expect(contents).toContain('103')
  expect(contents).toContain('не медицинская инструкция')
  await checkWidth(page)
  await page.getByRole('button', { name: 'Пройти заново' }).click()
  await expect(page.getByRole('button', { name: 'Начать квест', exact: true })).toBeVisible()
  await expect(page.getByTestId('score')).toHaveText('0')
  await page.reload()
  await expect(page.getByTestId('score')).toHaveText('0')
  expect(errors).toEqual([])
})

for (const [points, label] of [
  [0, 'Начало положено!'],
  [5, 'Хорошая основа!'],
] as const) {
  test(`supportive interpretation for ${points * 6} points`, async ({ page }) => {
    await startQuest(page)
    await finishWithPoints(page, points)
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
    await expect(page.getByTestId('score')).toHaveText(String(points * 6))
  })
}

test('progress survives reload, rules and help; choices are counted only once', async ({ page }) => {
  await startQuest(page)
  await page
    .locator('.answer-option')
    .nth(1)
    .evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
    })
  await expect(page.getByTestId('score')).toHaveText('10')
  await page.reload()
  await expect(page.getByTestId('score')).toHaveText('10')
  await expect(page.locator('.feedback')).toBeVisible()
  await page.locator('.header-nav').getByRole('button', { name: 'О квесте', exact: true }).click()
  await page.getByRole('button', { name: 'Продолжить квест' }).click()
  await page.getByRole('button', { name: 'Следующая ситуация' }).click()
  await page.getByRole('button', { name: 'Вспомнить правила' }).click()
  await page.getByRole('button', { name: 'Продолжить квест' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(scenarios[1].title)
  await page.locator('.header-nav').getByRole('button', { name: 'Памятка', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.dialog-steps > li')).toHaveCount(4)
  await page.keyboard.press('1')
  await expect(page.getByTestId('score')).toHaveText('10')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.keyboard.press('3')
  await expect(page.getByTestId('score')).toHaveText('20')
  await checkWidth(page)
})

test('invalid or unavailable browser storage does not break the quest', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('ryadom-quest-v1', '{"answers":[999],"screen":"result"}'),
  )
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Начать квест', exact: true })).toBeVisible()
  await expect(page.getByTestId('score')).toHaveText('0')
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage is unavailable')
    }
    Storage.prototype.setItem = () => {
      throw new Error('Storage is unavailable')
    }
  })
  await startQuest(page)
  await expect(page.locator('.answer-option')).toHaveCount(3)
})

test('core screens meet WCAG A and AA automated checks', async ({ page }) => {
  test.setTimeout(90_000)
  const checkAccessibility = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        help: violation.help,
        nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    ).toEqual([])
  }
  await page.goto('/')
  await checkAccessibility()
  await page.getByRole('button', { name: 'Начать квест', exact: true }).click()
  await checkAccessibility()
  await page.getByRole('button', { name: 'Всё понятно, начнём' }).click()
  await checkAccessibility()
  await page.locator('.answer-option').nth(0).click()
  await checkAccessibility()
  await page.locator('.header-nav').getByRole('button', { name: 'Памятка', exact: true }).click()
  await checkAccessibility()
  await page.getByRole('button', { name: 'Закрыть памятку' }).click()
  await page.getByRole('button', { name: 'Следующая ситуация' }).click()
  for (let i = 1; i < scenarios.length; i++) {
    await page
      .locator('.answer-option')
      .nth(scenarios[i].options.findIndex((option) => option.points === 10))
      .click()
    await page.getByRole('button', { name: i === 5 ? 'Узнать результат' : 'Следующая ситуация' }).click()
  }
  await checkAccessibility()
  await page.locator('.review > summary').click()
  await checkAccessibility()
})
