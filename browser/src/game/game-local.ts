import {
  BoardBase,
  BoardPiece,
  GameBase,
  getColumnFromCoord,
  type Player,
  PlayerAi,
  PlayerHuman,
} from '@kenrick95/c4'
import { Board } from '../board'
import { playDraw, playDrop, playWin } from '../shell/audio'
import { recordResult } from '../shell/stats'
import { animationFrame } from '../utils/animate-frame'
import { showMessage } from '../utils/message'
import { announce, getMoveRow, renderBoardState } from './game-accessibility'
import { activateGameControls } from './game-controls'

const statusbox = document.querySelector('.statusbox')
const statusboxBodyGame = document.querySelector('.statusbox-body-game')
const statusboxBodyConnection = document.querySelector(
  '.statusbox-body-connection',
)
const statusboxBodyPlayer = document.querySelector('.statusbox-body-player')
const playAgainButton = document.querySelector(
  '.statusbox-button-play-again',
) as HTMLButtonElement

export class GameLocal extends GameBase {
  controls?: ReturnType<typeof activateGameControls>
  private pendingMoveAnnouncement: string | undefined

  reset() {
    this.pendingMoveAnnouncement = undefined
    document.querySelector('.move-hint')?.classList.remove('hidden')
    super.reset()
  }
  beforeMoveApplied() {
    this.controls?.setTurn(false)
    if (statusboxBodyGame) {
      const currentPlayer = this.players[this.currentPlayerId]
      statusboxBodyGame.textContent = `Dropping ${currentPlayer.boardPiece} disc`
    }
  }
  waitingForMove() {
    renderBoardState(this.board, this.players)
    this.controls?.setTurn(
      this.isMoveAllowed &&
        !this.isGameWon &&
        !this.isGameEnded &&
        this.players[this.currentPlayerId] instanceof PlayerHuman,
    )
    if (!this.isMoveAllowed || this.isGameWon) {
      return
    }

    // `currentPlayerId` is not updated yet
    const currentPlayer = this.players[this.currentPlayerId]
    if (statusboxBodyGame) {
      statusboxBodyGame.textContent =
        currentPlayer instanceof PlayerAi ? 'Choosing a column' : 'Your turn'
    }
    if (statusboxBodyPlayer) {
      statusboxBodyPlayer.textContent = currentPlayer.label
      statusboxBodyPlayer.setAttribute(
        'data-piece',
        currentPlayer.boardPiece === BoardPiece.PLAYER_1 ? '1' : '2',
      )
    }
    const turnAnnouncement = `${currentPlayer.label}'s turn.`
    announce(
      this.pendingMoveAnnouncement
        ? `${this.pendingMoveAnnouncement} It is now ${turnAnnouncement}`
        : turnAnnouncement,
    )
    this.pendingMoveAnnouncement = undefined
  }
  afterMove(action: number) {
    renderBoardState(this.board, this.players)
    const currentPlayer = this.players[this.currentPlayerId]
    const row = getMoveRow(this.board, action)
    this.pendingMoveAnnouncement = `${currentPlayer.label} placed a disc in column ${action + 1}${
      row ? `, row ${row}` : ''
    }.`
    document.querySelector('.move-hint')?.classList.add('hidden')
    playDrop()
  }

  announceWinner(winnerBoardPiece: BoardPiece) {
    this.controls?.setTurn(false)
    this.pendingMoveAnnouncement = undefined
    super.announceWinner(winnerBoardPiece)

    if (winnerBoardPiece === BoardPiece.EMPTY) {
      return
    }
    let winnerPlayer: Player | undefined
    let result = ''
    if (winnerBoardPiece === BoardPiece.DRAW) {
      result = `It's a draw.`
    } else {
      winnerPlayer = this.players.find(
        (player) => player.boardPiece === winnerBoardPiece,
      )
      if (winnerPlayer) {
        result = `${winnerPlayer.label} won.`
      } else {
        result = `Player ${winnerBoardPiece} won.`
      }
    }
    renderBoardState(this.board, this.players)
    const messageDialog = showMessage({
      title: 'Thank you for playing.',
      messages: [result, 'Use the Play again button to start a new game.'],
    })
    messageDialog?.addEventListener('close', () => playAgainButton?.focus(), {
      once: true,
    })
    playAgainButton?.classList.remove('hidden')

    if (statusboxBodyGame) {
      statusboxBodyGame.textContent = 'Game over'
    }
    if (statusboxBodyPlayer) {
      statusboxBodyPlayer.textContent =
        winnerBoardPiece === BoardPiece.DRAW
          ? `It's a draw`
          : winnerPlayer
            ? `${winnerPlayer.label} won`
            : 'Match over'
      statusboxBodyPlayer.setAttribute(
        'data-piece',
        winnerBoardPiece === BoardPiece.PLAYER_2
          ? '2'
          : winnerBoardPiece === BoardPiece.DRAW
            ? 'draw'
            : '1',
      )
    }
    announce(result)
    const mode = document.body.dataset.mode || ''
    const outcome =
      winnerBoardPiece === BoardPiece.DRAW
        ? 'draw'
        : winnerBoardPiece === BoardPiece.PLAYER_1
          ? 'p1'
          : 'p2'
    recordResult(mode, outcome)
    if (winnerBoardPiece === BoardPiece.DRAW) {
      playDraw()
    } else {
      playWin()
    }
  }
}
export function initGameLocal(
  GameLocalConstructor: typeof GameLocal,
  firstPlayer: PlayerHuman,
  secondPlayer: PlayerHuman | PlayerAi,
  detail = '',
) {
  const canvas = document.querySelector('canvas')
  if (!canvas) {
    console.error('Canvas DOM is null')
    return
  }
  const boardCanvas: HTMLCanvasElement = canvas
  const board = new Board(boardCanvas)
  const game = new GameLocalConstructor([firstPlayer, secondPlayer], board)
  let disposed = false
  statusbox?.classList.remove('hidden')
  playAgainButton?.classList.add('hidden')
  document.querySelector('.move-hint')?.classList.remove('hidden')
  if (detail && statusboxBodyConnection) {
    statusboxBodyConnection.textContent = detail
    statusboxBodyConnection.classList.remove('hidden')
  } else {
    statusboxBodyConnection?.classList.add('hidden')
  }

  if (statusboxBodyGame) {
    statusboxBodyGame.textContent = 'Your turn'
  }

  if (statusboxBodyPlayer) {
    statusboxBodyPlayer.textContent = firstPlayer.label
    statusboxBodyPlayer.setAttribute('data-piece', '1')
  }
  renderBoardState(board, [firstPlayer, secondPlayer])

  function playColumn(column: number) {
    if (disposed || game.isGameWon || game.isGameEnded || !game.isMoveAllowed) {
      return
    }
    if (game.currentPlayerId === 0) {
      firstPlayer.doAction(column)
    } else if (
      game.currentPlayerId === 1 &&
      secondPlayer instanceof PlayerHuman
    ) {
      secondPlayer.doAction(column)
    }
  }

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

  function hoverColumn(column: number | null) {
    const player = game.players[game.currentPlayerId]
    const fill =
      player?.boardPiece === BoardPiece.PLAYER_2
        ? BoardBase.PLAYER_2_COLOR
        : BoardBase.PLAYER_1_COLOR
    board.setHoverColumn(column, fill)
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      '.game-control',
    )) {
      button.classList.toggle(
        'is-aimed',
        column !== null && Number(button.dataset.column) === column,
      )
    }
  }

  function handleCanvasClick(event: MouseEvent) {
    const rect = boardCanvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    controls.playColumn(getColumnFromCoord({ x, y }))
  }

  function handleCanvasMove(event: PointerEvent) {
    const rect = boardCanvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    hoverColumn(getColumnFromCoord({ x, y }))
  }

  function handleCanvasLeave() {
    hoverColumn(null)
  }

  function handleButtonHover(event: Event) {
    const button = event.currentTarget as HTMLButtonElement
    hoverColumn(Number(button.dataset.column))
  }

  const controls = activateGameControls(
    playColumn,
    (column) => board.map[0][column] === BoardPiece.EMPTY,
  )
  const columnButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.game-control'),
  )
  for (const button of columnButtons) {
    button.addEventListener('pointerenter', handleButtonHover)
    button.addEventListener('pointerleave', handleCanvasLeave)
  }
  game.controls = controls
  game.start()
  canvas.addEventListener('click', handleCanvasClick)
  canvas.addEventListener('pointermove', handleCanvasMove)
  canvas.addEventListener('pointerleave', handleCanvasLeave)
  return {
    end: () => {
      if (disposed) {
        return
      }
      disposed = true
      game.end()
      controls.dispose()
      hoverColumn(null)
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('pointermove', handleCanvasMove)
      canvas.removeEventListener('pointerleave', handleCanvasLeave)
      for (const button of columnButtons) {
        button.removeEventListener('pointerenter', handleButtonHover)
        button.removeEventListener('pointerleave', handleCanvasLeave)
      }
      board.dispose()
      playAgainButton?.classList.add('hidden')
      document.querySelector('.move-hint')?.classList.add('hidden')
      statusbox?.classList.add('hidden')
    },
    restart: restartGame,
  }
}
