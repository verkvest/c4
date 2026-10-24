import { Board, relayoutActiveBoard } from './board'
import * as Game from './game'
import { setSoundEnabled, soundEnabled } from './shell/audio'
import {
  depthFor,
  isDifficultyId,
  labelFor,
  readDifficulty,
  rememberDifficulty,
} from './shell/difficulty'
import { bootNativeShell, exitNativeApp } from './shell/native'
import { renderStats } from './shell/stats'
import { applyTheme, isThemeId, readThemeId, type ThemeId } from './shell/theme'
import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(readThemeId())
  const canvas = document.querySelector('.section-canvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('Canvas element not found')
    return
  }
  const initScreenDOM = document.querySelector(
    '.init-screen',
  ) as HTMLDialogElement
  const creditsDialog = document.querySelector(
    '.credits-screen',
  ) as HTMLDialogElement
  const settingsForm = document.querySelector(
    '.game-settings-form',
  ) as HTMLFormElement
  if (!initScreenDOM || !settingsForm) {
    console.error('Menu markup is missing')
    return
  }

  let previewBoard: Board | undefined = new Board(canvas)
  previewBoard.render()
  requestAnimationFrame(() => previewBoard?.relayout())

  const backToModeSelector = document.querySelector(
    '.statusbox-button-back',
  ) as HTMLButtonElement
  const playAgainButton = document.querySelector(
    '.statusbox-button-play-again',
  ) as HTMLButtonElement
  const player1NameLabel = settingsForm.querySelector(
    '.game-settings-player-1-name-label',
  ) as HTMLLabelElement
  const player2NameLabel = settingsForm.querySelector(
    '.game-settings-player-2-name-label',
  ) as HTMLLabelElement
  const player1NameInput = settingsForm.querySelector(
    '.game-settings-player-1-name-input',
  ) as HTMLInputElement
  const player2NameInput = settingsForm.querySelector(
    '.game-settings-player-2-name-input',
  ) as HTMLInputElement
  const difficultyField = settingsForm.querySelector(
    '.difficulty-fieldset',
  ) as HTMLElement
  const soundToggle = document.querySelector(
    '#sound-toggle',
  ) as HTMLInputElement
  const menuButton = document.querySelector('#open-menu') as HTMLButtonElement
  const creditsButton = document.querySelector(
    '#open-credits',
  ) as HTMLButtonElement

  let currentGameHandler:
    | {
        end: () => void
        restart?: () => void
      }
    | undefined
    | null = null

  const storedDifficulty = readDifficulty()
  for (const input of settingsForm.querySelectorAll<HTMLInputElement>(
    'input[name="difficulty"]',
  )) {
    input.checked = input.value === storedDifficulty
  }
  soundToggle.checked = soundEnabled()
  markTheme(readThemeId())
  renderStats()
  renderForm(selectedMode())

  backToModeSelector?.classList.add('hidden')
  playAgainButton?.classList.add('hidden')
  initScreenDOM.showModal()

  backToModeSelector?.addEventListener('click', showMenu)
  menuButton?.addEventListener('click', () => {
    if (initScreenDOM.open) {
      return
    }
    showMenu()
  })
  playAgainButton?.addEventListener('click', () => {
    currentGameHandler?.restart?.()
  })
  creditsButton?.addEventListener('click', () => {
    creditsDialog?.showModal()
  })
  soundToggle?.addEventListener('change', () => {
    setSoundEnabled(soundToggle.checked)
  })
  for (const swatch of settingsForm.querySelectorAll<HTMLButtonElement>(
    '.theme-swatch',
  )) {
    swatch.addEventListener('click', () => {
      const theme = swatch.dataset.themeChoice
      if (!isThemeId(theme)) {
        return
      }
      applyTheme(theme)
      markTheme(theme)
      previewBoard?.render()
    })
  }

  initScreenDOM.addEventListener('cancel', (event) => {
    event.preventDefault()
  })
  // Start during submit. The dialog close event can run after Playwright has
  // already sent the first column key, which would drop that move.
  settingsForm.addEventListener('submit', () => {
    const formData = new FormData(settingsForm)
    const gameMode = formData.get('mode')
    const difficultyValue = formData.get('difficulty')
    const difficulty =
      typeof difficultyValue === 'string' && isDifficultyId(difficultyValue)
        ? difficultyValue
        : readDifficulty()
    rememberDifficulty(difficulty)
    const firstPlayerName = formData.get('player-1-name')
    const secondPlayerName = formData.get('player-2-name')
    initGame(
      typeof gameMode === 'string' ? gameMode : null,
      [
        typeof firstPlayerName === 'string' ? firstPlayerName : null,
        typeof secondPlayerName === 'string' ? secondPlayerName : null,
      ],
      difficulty,
    )
  })
  settingsForm.addEventListener('input', () => {
    renderForm(selectedMode())
  })

  void bootNativeShell(() => {
    if (creditsDialog?.open) {
      creditsDialog.close()
      return
    }
    const message = document.querySelector(
      '.message-body',
    ) as HTMLDialogElement | null
    if (message?.open) {
      message.close()
      return
    }
    if (!initScreenDOM.open) {
      showMenu()
      return
    }
    void exitNativeApp()
  })

  function selectedMode() {
    return (
      (
        settingsForm.querySelector(
          'input[name="mode"]:checked',
        ) as HTMLInputElement | null
      )?.value || 'offline-ai'
    )
  }

  function markTheme(theme: ThemeId) {
    for (const swatch of settingsForm.querySelectorAll<HTMLButtonElement>(
      '.theme-swatch',
    )) {
      const selected = swatch.dataset.themeChoice === theme
      swatch.classList.toggle('is-selected', selected)
      swatch.setAttribute('aria-pressed', selected ? 'true' : 'false')
    }
  }

  function renderForm(mode: string) {
    const versusRival = mode === 'offline-ai'
    const passAndPlay = mode === 'offline-human'
    const watching = mode === 'ai-vs-ai'
    difficultyField?.classList.toggle('hidden', passAndPlay)
    player1NameLabel.classList.toggle('hidden', watching)
    player1NameInput.classList.toggle('hidden', watching)
    player2NameLabel.classList.toggle('hidden', !passAndPlay)
    player2NameInput.classList.toggle('hidden', !passAndPlay)
    player1NameInput.disabled = watching
    player2NameInput.disabled = !passAndPlay
    if (versusRival) {
      player1NameLabel.textContent = 'Your name'
    } else if (passAndPlay) {
      player1NameLabel.textContent = "First player's name"
      player2NameLabel.textContent = "Second player's name"
    }
  }

  function showMenu() {
    endCurrentGame()
    backToModeSelector?.classList.add('hidden')
    playAgainButton?.classList.add('hidden')
    if (!previewBoard) {
      previewBoard = new Board(canvas)
    }
    previewBoard.render()
    requestAnimationFrame(() => previewBoard?.relayout())
    renderStats()
    if (!initScreenDOM.open) {
      initScreenDOM.showModal()
    }
  }

  function initGame(
    chosenMode: string | null,
    playerNames: Array<string | null>,
    difficulty: ReturnType<typeof readDifficulty>,
  ) {
    endCurrentGame()
    previewBoard?.dispose()
    previewBoard = undefined
    backToModeSelector?.classList.remove('hidden')
    playAgainButton?.classList.add('hidden')
    document.body.dataset.mode = chosenMode || ''
    const depth = depthFor(difficulty)
    const detail = `${labelFor(difficulty)} search`
    if (chosenMode === 'offline-human') {
      currentGameHandler = Game.initGameLocal2p(
        playerNames[0] || 'Player 1',
        playerNames[1] || 'Player 2',
      )
    } else if (chosenMode === 'offline-ai') {
      currentGameHandler = Game.initGameLocalAi(
        playerNames[0] || 'Player 1',
        depth,
        detail,
      )
    } else if (chosenMode === 'ai-vs-ai') {
      currentGameHandler = Game.initGameAiVsAi(depth, `Watching · ${detail}`)
    } else {
      console.error('Invalid game mode received', chosenMode)
    }
    requestAnimationFrame(() => relayoutActiveBoard())
  }

  function endCurrentGame() {
    currentGameHandler?.end()
    currentGameHandler = undefined
  }
})
