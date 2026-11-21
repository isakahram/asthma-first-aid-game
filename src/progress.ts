import { SCENARIO_COUNT } from './data'
import type { Screen } from './data'

export const STORAGE_KEY = 'ryadom-quest-v2'
export const LEGACY_STORAGE_KEY = 'ryadom-quest-v1'

export type Progress = {
  screen: Screen
  questionIndex: number
  answers: number[]
}

export const freshProgress: Progress = { screen: 'intro', questionIndex: 0, answers: [] }

export function loadProgress(): Progress {
  try {
    const current = localStorage.getItem(STORAGE_KEY)
    const legacy = current === null ? localStorage.getItem(LEGACY_STORAGE_KEY) : null
    const saved: unknown = JSON.parse(current ?? legacy ?? 'null')
    if (!saved || typeof saved !== 'object') return { ...freshProgress, answers: [] }
    const value = saved as Partial<Progress>
    if (
      !Array.isArray(value.answers) ||
      value.answers.length > SCENARIO_COUNT ||
      !value.answers.every((answer) => Number.isInteger(answer) && answer >= 0 && answer <= 2)
    ) {
      return { ...freshProgress, answers: [] }
    }
    const validScreens: Screen[] = ['intro', 'rules', 'play', 'result']
    const requestedScreen = validScreens.includes(value.screen as Screen) ? (value.screen as Screen) : 'intro'
    const unfinishedResult = requestedScreen === 'result' && value.answers.length !== SCENARIO_COUNT
    const completedLegacyQuest = legacy !== null && value.answers.length === 6
    const requestedIndex =
      completedLegacyQuest || unfinishedResult
        ? value.answers.length
        : Number.isInteger(value.questionIndex)
          ? value.questionIndex!
          : value.answers.length
    return {
      screen: unfinishedResult || completedLegacyQuest ? 'intro' : requestedScreen,
      questionIndex: Math.min(
        Math.max(requestedIndex, Math.max(0, value.answers.length - 1)),
        value.answers.length,
        SCENARIO_COUNT - 1,
      ),
      answers: value.answers,
    }
  } catch {
    return { ...freshProgress, answers: [] }
  }
}
