import { BoardPiece, PlayerAi, PlayerHuman } from '@kenrick95/c4'
import { GameLocal, initGameLocal } from './game-local'

class GameLocalAi extends GameLocal {}
export function initGameLocalAi(playerName: string, maxDepth = 4, detail = '') {
  const firstPlayer = new PlayerHuman(BoardPiece.PLAYER_1, playerName)
  const aiPlayer = new PlayerAi(BoardPiece.PLAYER_2, 'Rival', maxDepth)
  return initGameLocal(GameLocalAi, firstPlayer, aiPlayer, detail)
}
