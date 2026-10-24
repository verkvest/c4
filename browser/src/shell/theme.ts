import { BoardBase } from '@kenrick95/c4'

export const THEME_IDS = ['harbor', 'grove', 'midnight'] as const
export type ThemeId = (typeof THEME_IDS)[number]

const STORAGE_KEY = 'aureline.theme'
const listeners = new Set<() => void>()

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'harbor' || value === 'grove' || value === 'midnight'
}

export function readThemeId(): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isThemeId(stored) ? stored : 'harbor'
}

export function onThemeChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string) => styles.getPropertyValue(name).trim()
  BoardBase.setColors({
    player1: read('--disc1') || '#ff5d4a',
    player2: read('--disc2') || '#ffd15c',
    mask: read('--board') || '#1f6f93',
    stroke: read('--stroke') || '#082033',
  })
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) {
    themeColor.setAttribute('content', read('--bg0') || '#071421')
  }
  localStorage.setItem(STORAGE_KEY, id)
  for (const listener of listeners) {
    listener()
  }
}
