import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  getScore,
  getScoreRange,
  MAX_SCORE,
  SCENARIO_COUNT,
  CHAPTER_SIZE,
  chapters,
  scenarios,
} from '../src/data'
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '../src/progress'

const perfectAnswers = scenarios.map((scene) => scene.options.findIndex((option) => option.points === 10))

async function startQuest(page: Page) {
  await page.goto('./')
  await page.getByRole('button', { name: 'Начать квест', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Если другу трудно дышать')
  await page.getByRole('button', { name: 'Всё понятно, начнём' }).click()
}
async function checkWidth(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}
async function next(page: Page, index: number) {
  await page
    .getByRole('button', { name: index === SCENARIO_COUNT - 1 ? 'Узнать результат' : 'Следующая ситуация' })
    .click()
}
async function finishWithPoints(page: Page, points: 0 | 5 | 10) {
  let score = 0
  for (const [i, scene] of scenarios.entries()) {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(scene.title)
    await expect(page.locator('.question-eyebrow')).toHaveText(
      `Ситуация ${String(i + 1).padStart(2, '0')} / ${SCENARIO_COUNT}`,
    )
    await checkWidth(page)
    await page
      .locator('.answer-option')
      .nth(scene.options.findIndex((option) => option.points === points))
      .click()
    score += points
    await expect(page.getByTestId('score')).toHaveText(String(score))
    await expect(page.locator('.feedback')).toContainText('потому что')
    await expect(page.locator('.answer-option:disabled')).toHaveCount(3)
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(i + 1))
    await next(page, i)
  }
}

test('twenty unique situations, 10/5/0 choices and a maximum of 200', () => {
  expect(scenarios).toHaveLength(20)
  expect(SCENARIO_COUNT).toBe(20)
  expect(MAX_SCORE).toBe(200)
  expect(new Set(scenarios.map((scene) => scene.id)).size).toBe(20)
  expect(new Set(scenarios.map((scene) => scene.image)).size).toBe(20)
  expect(chapters.length * CHAPTER_SIZE).toBe(20)
  for (const scene of scenarios) {
    expect(scene.options).toHaveLength(3)
    expect(scene.options.map((answer) => answer.points).sort((a, b) => a - b)).toEqual([0, 5, 10])
    expect(scene.image.startsWith('/')).toBe(false)
    expect(scene.imageAlt.length).toBeGreaterThan(20)
    for (const answer of scene.options) {
      expect(answer.feedback).toContain('потому что')
      expect(answer.feedback.length).toBeLessThan(260)
    }
  }
  expect(getScore(perfectAnswers)).toBe(200)
  for (let score = 0; score <= 200; score++) {
    const range = getScoreRange(score)
    expect(range.min).toBeLessThanOrEqual(score)
    expect(range.max).toBeGreaterThanOrEqual(score)
  }
  expect(getScoreRange(80).label).toBe('Начало положено!')
  expect(getScoreRange(81).label).toBe('Хорошая основа!')
  expect(getScoreRange(150).label).toBe('Хорошая основа!')
  expect(getScoreRange(151).label).toBe('Ты — надёжный друг!')
})

test('start screen shows 20 situations, a disclaimer and a working overview link', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Астма:')
  await expect(page.locator('.disclaimer')).toContainText('не медицинская инструкция')
  await expect(page.locator('.hero-meta')).toContainText('20 ситуаций')
  await expect(page.locator('.score-out-of')).toHaveText('/ 200')
  await expect(page.getByTestId('score')).toHaveText('0')
  await page.getByRole('button', { name: 'Что меня ждёт?' }).click()
  await expect(page.getByRole('heading', { name: 'Один друг. 20 ситуаций.' })).toBeInViewport()
  await checkWidth(page)
})

test('all four chapters preview their five illustrated situations', async ({ page }) => {
  await page.goto('./')
  for (const [chapterIndex, chapter] of chapters.entries()) {
    await page
      .locator('.chapter-switcher')
      .getByRole('button', { name: new RegExp(chapter.title) })
      .click()
    await expect(page.locator('.scene-card')).toHaveCount(5)
    await expect(page.locator('.scene-card h3')).toHaveText(
      scenarios.slice(chapterIndex * 5, chapterIndex * 5 + 5).map((scene) => scene.location),
    )
    await expect(page.locator('.scene-number').first()).toHaveText(
      String(chapterIndex * 5 + 1).padStart(2, '0'),
    )
    await checkWidth(page)
  }
})

test('all scene images, hero and favicon load from the site root', async ({ page }) => {
  await page.goto('./')
  expect(new URL(page.url()).pathname).toBe('/')
  for (const asset of [
    'favicon.svg',
    'images/school-friends.webp',
    ...scenarios.map((scene) => scene.image),
  ]) {
    const response = await page.request.get(new URL(asset, page.url()).href)
    expect(response.status(), asset).toBe(200)
    expect(response.headers()['content-type'], asset).toMatch(/^image\//)
  }
})

test('complete quest: 200 points, checklist, download, 20 answers and restart', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  await startQuest(page)
  await finishWithPoints(page, 10)
  await expect(page.getByRole('heading', { name: 'Ты — надёжный друг!', exact: true })).toBeVisible()
  await expect(page.locator('.score-ring-inner > strong')).toHaveText('200/ 200')
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
  await expect(page.locator('.review-list > article')).toHaveCount(20)
  await expect(page.locator('.review-title h3 > span').last()).toHaveText('20')
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
  test(`supportive result after ${SCENARIO_COUNT} answers worth ${points} points each`, async ({ page }) => {
    await startQuest(page)
    await finishWithPoints(page, points)
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
    await expect(page.getByTestId('score')).toHaveText(String(points * SCENARIO_COUNT))
  })
}

test('progress survives reload, rules and help; choices count only once', async ({ page }) => {
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
  await next(page, 0)
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
})

test('completed legacy six-situation progress resumes at situation seven', async ({ page }) => {
  await page.addInitScript(
    ({ key, answers }) =>
      localStorage.setItem(key, JSON.stringify({ answers, screen: 'result', questionIndex: 5 })),
    { key: LEGACY_STORAGE_KEY, answers: perfectAnswers.slice(0, 6) },
  )
  await page.goto('./')
  await expect(page.getByTestId('score')).toHaveText('60')
  await expect(page.locator('.score-out-of')).toHaveText('/ 200')
  await page.getByRole('button', { name: 'Продолжить квест' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(scenarios[6].title)
  await expect(page.locator('.question-eyebrow')).toHaveText('Ситуация 07 / 20')
  await page.locator('.answer-option').nth(perfectAnswers[6]).click()
  await expect(page.getByTestId('score')).toHaveText('70')
  await page.reload()
  await expect(page.getByTestId('score')).toHaveText('70')
  await expect(page.locator('.question-eyebrow')).toHaveText('Ситуация 07 / 20')
})

test('the twentieth situation is numbered correctly and finishes only after an answer', async ({ page }) => {
  await page.addInitScript(
    ({ key, answers }) =>
      localStorage.setItem(key, JSON.stringify({ answers, screen: 'play', questionIndex: 19 })),
    { key: STORAGE_KEY, answers: perfectAnswers.slice(0, 19) },
  )
  await page.goto('./')
  await expect(page.locator('.question-eyebrow')).toHaveText('Ситуация 20 / 20')
  await expect(page.locator('.quiz-scene-number')).toHaveText('20')
  await expect(page.getByTestId('score')).toHaveText('190')
  await expect(page.getByRole('button', { name: 'Узнать результат' })).toHaveCount(0)
  await page.locator('.answer-option').nth(perfectAnswers[19]).click()
  await expect(page.getByTestId('score')).toHaveText('200')
  await next(page, 19)
  await expect(page.locator('.score-ring-inner > strong')).toHaveText('200/ 200')
})

test('invalid or unavailable browser storage does not break the quest', async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{"answers":[999],"screen":"result"}'),
    STORAGE_KEY,
  )
  await page.goto('./')
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

test('core screens and new illustrated scenes pass automated WCAG A and AA checks', async ({ page }) => {
  test.setTimeout(120_000)
  const checkAccessibility = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    ).toEqual([])
  }
  await page.goto('./')
  await checkAccessibility()
  await page.locator('.chapter-switcher button').last().click()
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
  await next(page, 0)
  for (let i = 1; i < SCENARIO_COUNT; i++) {
    if (i === 16 || i === 19) await checkAccessibility()
    await page.locator('.answer-option').nth(perfectAnswers[i]).click()
    await next(page, i)
  }
  await checkAccessibility()
  await page.locator('.review > summary').click()
  await checkAccessibility()
})
