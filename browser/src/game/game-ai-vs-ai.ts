import { BoardPiece, PlayerAi } from '@kenrick95/c4'
import { Board } from '../board'
import { animationFrame } from '../utils/animate-frame'
import { GameLocal } from './game-local'

const statusbox = document.querySelector('.statusbox')
const statusboxBodyConnection = document.querySelector(
  '.statusbox-body-connection',
)
const playAgainButton = document.querySelector(
  '.statusbox-button-play-again',
) as HTMLButtonElement

class GameAiVsAi extends GameLocal {
  reset() {
    super.reset()
    document.querySelector('.move-hint')?.classList.add('hidden')
  }
}
export function initGameAiVsAi(maxDepth = 4, detail = '') {
  const canvas = document.querySelector('canvas')
  if (!canvas) {
    console.error('Canvas DOM is null')
    return
  }
  const board = new Board(canvas)
  const firstPlayer = new PlayerAi(BoardPiece.PLAYER_1, 'Gold', maxDepth)
  const secondPlayer = new PlayerAi(BoardPiece.PLAYER_2, 'Tide', maxDepth)
  const game = new GameAiVsAi([firstPlayer, secondPlayer], board)
  let disposed = false

  document.querySelector('.move-hint')?.classList.add('hidden')
  statusbox?.classList.remove('hidden')
  playAgainButton?.classList.add('hidden')
  if (detail && statusboxBodyConnection) {
    statusboxBodyConnection.textContent = detail
    statusboxBodyConnection.classList.remove('hidden')
  } else {
    statusboxBodyConnection?.classList.add('hidden')
  }
  game.start()

  async function restartGame() {
    if (disposed || !game.isGameWon) {
      return
    }
    playAgainButton?.classList.add('hidden')
    game.reset()
    await animationFrame()
    if (disposed) {
      return
    }
    game.start()
  }

  return {
    end: () => {
      if (disposed) {
        return
      }
      disposed = true
      game.end()
      board.dispose()
      playAgainButton?.classList.add('hidden')
    },
    restart: restartGame,
  }
}
