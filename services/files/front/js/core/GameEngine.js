import Board from './Board.js';
import ActionExecutor from './ActionExecutor.js';
import TurnManager from './TurnManager.js';
import LaserSimulator from './LaserSimulator.js';
import BoardSetup from './BoardSetup.js';

export default class GameEngine {
  constructor(logger) {
    this.board = new Board();
    this.turnManager = new TurnManager(this.board);
    this.laserSimulator = new LaserSimulator();
    this.actionExecutor = new ActionExecutor(this.board, this.turnManager);
    this.logger = logger;
    this.gameOver = false;
    this.winner = null;
    this.lastLaserEvents = null;
  }

  init() {
    BoardSetup.initializeGame(this.board);
    this.turnManager.initPlayers();
  }

  executeAction(action) {
    if (this.gameOver) {
      return { success: false, error: 'Game is over' };
    }

    const result = this.actionExecutor.executeAction(action);

    if (!result.success) {
      this.logger.logError(result.error);
      return result;
    }

    this.logger.logAction(action.player, action.type, '');

    if (!result.skipLaser) {
      const laserResult = this.laserSimulator.simulate(
        this.board,
        this.turnManager.getCurrentPlayer()
      );
      this.applyLaserEffects(laserResult);
      this.lastLaserEvents = laserResult;
      this.logger.logLaser(laserResult);
    }

    this.turnManager.endTurn();
    this.checkWinCondition();

    return result;
  }

  applyLaserEffects(events) {
    events
      .filter(e => e.type === 'DESTROY')
      .forEach(e => {
        this.board.removePiece(e.piece);
        if (e.piece.type === 'pharaoh') {
          this.gameOver = true;
        } else if (e.piece.type === 'pyramid') {
          // Pyramide détruite va dans la réserve adverse APRÈS 1 tour
          const opponent = e.piece.player === 1 ? 2 : 1;
          this.turnManager.addPendingPyramid(opponent);
          this.logger.log(`Pyramid destroyed! Will be added to Player ${opponent}'s reserve next turn.`, 'log-laser');
        }
      });
  }

  checkWinCondition() {
    const pharaohs = this.board.getPieces().filter(p => p.type === 'pharaoh');
    if (pharaohs.length === 1) {
      this.gameOver = true;
      this.winner = pharaohs[0].player;
      this.logger.logGameOver(this.winner);
    } else if (pharaohs.length === 0 || this.turnManager.turnCount > 100) {
      this.gameOver = true;
      this.winner = null; // draw
      this.logger.logGameOver(null);
    }
  }

  getGameState() {
    // Retourne un snapshot immuable
    return {
      board: this.board.clone(),
      turn: this.turnManager.getCurrentPlayer(),
      turnCount: this.turnManager.turnCount,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }
}