import { BoardBase, BoardPiece, type Player } from '@kenrick95/c4'
import { onThemeChange } from '../shell/theme'
import { animationFrame } from '../utils/animate-frame'
import { clearCanvas, drawCircle, drawMask, onresize } from './utils'

let activeBoard: Board | undefined

export function relayoutActiveBoard() {
  activeBoard?.relayout()
}

export class Board extends BoardBase {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  hoverColumn: number | null = null
  private hoverFill = BoardBase.PLAYER_1_COLOR
  private animationId: number = 0
  private removeResizeListener: (() => void) | undefined
  private removeThemeListener: (() => void) | undefined

  constructor(canvas: HTMLCanvasElement) {
    Board.measure(canvas)
    super()
    this.canvas = canvas
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.initConstants()
    this.reset()
    this.onresize()
    this.removeThemeListener = onThemeChange(() => {
      this.hoverFill = BoardBase.PLAYER_1_COLOR
      this.render()
    })
    activeBoard = this
  }

  static measure(canvas: HTMLCanvasElement) {
    const slot = canvas.closest('.board-slot')
    const width = slot?.clientWidth || window.innerWidth
    const height =
      slot && slot.clientHeight > 160
        ? slot.clientHeight
        : Math.max(240, window.innerHeight * 0.58)
    const scale = Math.min((width - 16) / 640, (height - 16) / 480)
    BoardBase.SCALE = Math.max(0.46, Math.min(scale, 1.45))
    return BoardBase.SCALE
  }

  getBoardScale() {
    return Board.measure(this.canvas)
  }

  relayout() {
    const previous = BoardBase.SCALE
    this.getBoardScale()
    if (Math.abs(previous - BoardBase.SCALE) > 0.01) {
      this.initConstants()
      clearCanvas(this)
      this.render()
    }
  }

  setHoverColumn(column: number | null, fillStyle: string) {
    const next =
      column !== null &&
      column >= 0 &&
      column < BoardBase.COLUMNS &&
      this.map[0][column] === BoardPiece.EMPTY
        ? column
        : null
    this.hoverFill = fillStyle || BoardBase.PLAYER_1_COLOR
    if (next === this.hoverColumn) {
      return
    }
    this.hoverColumn = next
    this.render()
  }

  onresize() {
    let prevBoardScale = BoardBase.SCALE
    this.removeResizeListener = onresize(() => {
      this.getBoardScale()
      if (Math.abs(prevBoardScale - BoardBase.SCALE) > 0.01) {
        prevBoardScale = BoardBase.SCALE
        this.initConstants()
        clearCanvas(this)
        this.render()
      }
    })
  }

  reset() {
    this.animationId = (this.animationId || 0) + 1
    super.reset()
    if (this.canvas) {
      clearCanvas(this)
      this.render()
    }
  }

  initConstants() {
    super.initConstants()
    if (this.canvas) {
      /**
       * Scale the canvas to make it look sharper on hi-dpi devices
       * https://www.html5rocks.com/en/tutorials/canvas/hidpi/
       */
      const dpr = self.devicePixelRatio || 1
      this.canvas.width = Board.CANVAS_WIDTH * dpr
      this.canvas.height = Board.CANVAS_HEIGHT * dpr
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0)
      this.canvas.style.width = `${Board.CANVAS_WIDTH}px`
      this.canvas.style.height = `${Board.CANVAS_HEIGHT}px`
    }
  }

  dispose() {
    this.animationId++
    this.removeResizeListener?.()
    this.removeResizeListener = undefined
    this.removeThemeListener?.()
    this.removeThemeListener = undefined
    if (activeBoard === this) {
      activeBoard = undefined
    }
  }

  private async animateAction(
    newRow: number,
    column: number,
    boardPiece: BoardPiece,
    animationId: number,
  ): Promise<boolean> {
    const fillStyle = this.getPlayerColor(boardPiece)
    let currentY = 0
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      currentY = newRow * 3 * BoardBase.PIECE_RADIUS
    }
    const doAnimation = () => {
      if (animationId !== this.animationId) {
        return false
      }
      clearCanvas(this)
      drawCircle(this.context, {
        x:
          3 * BoardBase.PIECE_RADIUS * column +
          BoardBase.MASK_X_BEGIN +
          2 * BoardBase.PIECE_RADIUS,
        y: currentY + BoardBase.MASK_Y_BEGIN + 2 * BoardBase.PIECE_RADIUS,
        r: BoardBase.PIECE_RADIUS,
        fillStyle: fillStyle,
        strokeStyle: BoardBase.PIECE_STROKE_STYLE,
      })
      this.render()
      currentY += BoardBase.PIECE_RADIUS
      return true
    }
    while (
      animationId === this.animationId &&
      newRow * 3 * BoardBase.PIECE_RADIUS >= currentY
    ) {
      await animationFrame()
      if (!doAnimation()) {
        return false
      }
    }
    return animationId === this.animationId
  }

  render() {
    drawMask(this)
    for (let y = 0; y < BoardBase.ROWS; y++) {
      for (let x = 0; x < BoardBase.COLUMNS; x++) {
        drawCircle(this.context, {
          x:
            3 * BoardBase.PIECE_RADIUS * x +
            BoardBase.MASK_X_BEGIN +
            2 * BoardBase.PIECE_RADIUS,
          y:
            3 * BoardBase.PIECE_RADIUS * y +
            BoardBase.MASK_Y_BEGIN +
            2 * BoardBase.PIECE_RADIUS,
          r: BoardBase.PIECE_RADIUS,
          fillStyle: this.getPlayerColor(this.map[y][x]),
          strokeStyle: BoardBase.PIECE_STROKE_STYLE,
        })
      }
    }
    if (
      this.hoverColumn !== null &&
      this.map[0][this.hoverColumn] === BoardPiece.EMPTY
    ) {
      this.context.save()
      this.context.globalAlpha = 0.5
      drawCircle(this.context, {
        x:
          3 * BoardBase.PIECE_RADIUS * this.hoverColumn +
          BoardBase.MASK_X_BEGIN +
          2 * BoardBase.PIECE_RADIUS,
        y: BoardBase.MASK_Y_BEGIN + 2 * BoardBase.PIECE_RADIUS,
        r: BoardBase.PIECE_RADIUS,
        fillStyle: this.hoverFill,
        strokeStyle: BoardBase.PIECE_STROKE_STYLE,
      })
      this.context.restore()
    }
  }

  async applyPlayerAction(player: Player, column: number): Promise<boolean> {
    if (
      column < 0 ||
      column >= BoardBase.COLUMNS ||
      this.map[0][column] !== BoardPiece.EMPTY
    ) {
      return false
    }

    let isColumnEverFilled = false
    let row = 0
    for (let i = 0; i < BoardBase.ROWS - 1; i++) {
      if (this.map[i + 1][column] !== BoardPiece.EMPTY) {
        isColumnEverFilled = true
        row = i
        break
      }
    }
    if (!isColumnEverFilled) {
      row = BoardBase.ROWS - 1
    }

    const animationId = this.animationId
    if (
      !(await this.animateAction(row, column, player.boardPiece, animationId))
    ) {
      return false
    }
    if (animationId !== this.animationId) {
      return false
    }

    // reflect player's action to the map
    this.map[row][column] = player.boardPiece
    this.debug()

    await animationFrame()
    if (animationId !== this.animationId) {
      return false
    }
    this.render()
    return true
  }
}
