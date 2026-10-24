type Bucket = {
  played: number
  p1: number
  p2: number
  draws: number
}

type Stats = {
  rival: Bucket
  pass: Bucket
  watch: Bucket
}

const STORAGE_KEY = 'aureline.stats'

function emptyBucket(): Bucket {
  return { played: 0, p1: 0, p2: 0, draws: 0 }
}

function load(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { rival: emptyBucket(), pass: emptyBucket(), watch: emptyBucket() }
    }
    const parsed = JSON.parse(raw) as Partial<Stats>
    return {
      rival: { ...emptyBucket(), ...parsed.rival },
      pass: { ...emptyBucket(), ...parsed.pass },
      watch: { ...emptyBucket(), ...parsed.watch },
    }
  } catch {
    return { rival: emptyBucket(), pass: emptyBucket(), watch: emptyBucket() }
  }
}

export function recordResult(mode: string, winner: 'p1' | 'p2' | 'draw'): void {
  if (
    mode !== 'offline-ai' &&
    mode !== 'offline-human' &&
    mode !== 'ai-vs-ai'
  ) {
    return
  }
  const stats = load()
  const bucket =
    mode === 'offline-human'
      ? stats.pass
      : mode === 'ai-vs-ai'
        ? stats.watch
        : stats.rival
  bucket.played += 1
  if (winner === 'draw') {
    bucket.draws += 1
  } else if (winner === 'p1') {
    bucket.p1 += 1
  } else {
    bucket.p2 += 1
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  renderStats(stats)
}

export function renderStats(stats = load()): void {
  const rival = document.querySelector('.stat-rival')
  const pass = document.querySelector('.stat-pass')
  const watch = document.querySelector('.stat-watch')
  if (rival) {
    rival.textContent = `Rival: ${stats.rival.p1} wins, ${stats.rival.p2} losses, ${stats.rival.draws} draws`
  }
  if (pass) {
    pass.textContent = `Pass and play: ${stats.pass.played} matches`
  }
  if (watch) {
    watch.textContent = `Watched: ${stats.watch.played} matches`
  }
}
