export const DIFFICULTIES = [
  {
    id: 'casual',
    label: 'Casual',
    depth: 2,
    note: 'Looks a move ahead.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    depth: 4,
    note: 'A fair search.',
  },
  {
    id: 'sharp',
    label: 'Sharp',
    depth: 6,
    note: 'Deeper search. May pause to think.',
  },
] as const

export type DifficultyId = (typeof DIFFICULTIES)[number]['id']

const STORAGE_KEY = 'aureline.difficulty'

export function isDifficultyId(value: string | null): value is DifficultyId {
  return value === 'casual' || value === 'balanced' || value === 'sharp'
}

export function readDifficulty(): DifficultyId {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isDifficultyId(stored) ? stored : 'balanced'
}

export function depthFor(id: DifficultyId): number {
  return DIFFICULTIES.find((item) => item.id === id)?.depth ?? 4
}

export function labelFor(id: DifficultyId): string {
  return DIFFICULTIES.find((item) => item.id === id)?.label ?? 'Balanced'
}

export function rememberDifficulty(id: DifficultyId): void {
  localStorage.setItem(STORAGE_KEY, id)
}
