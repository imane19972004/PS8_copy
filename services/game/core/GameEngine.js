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
    this.logger.log('✨ Game initialized!');
  }

  /**
   * Obtenir toutes les actions possibles pour une pièce
   */
  getValidActionsForPiece(piece) {
    if (!piece || piece.player !== this.turnManager.getCurrentPlayer()) {
      return [];
    }

    const actions = [];

    // 1. ROTATION (tous sauf Pharaoh)
    if (piece.type !== 'pharaoh' && piece.canRotate?.()) {
      actions.push({
        type: 'rotate',
        direction: 'clockwise',
        label: '↻ Rotation Horaire'
      });
      actions.push({
        type: 'rotate',
        direction: 'anticlockwise',
        label: '↺ Rotation Anti-horaire'
      });
    }

    // 2. DÉPLACEMENT
    if (piece.canMove?.()) {
      const validMoves = this.getValidMovesForPiece(piece);
      if (validMoves.length > 0) {
        actions.push({
          type: 'move',
          label: '↦ Déplacer',
          moveCount: validMoves.length
        });
      }
    }

    // 3. ÉCHANGE SCARAB
    if (piece.type === 'scarab') {
      const swapTargets = this.getValidSwapTargets(piece);
      swapTargets.forEach(target => {
        const cooldown = piece.swapCooldowns?.[target.type] || 0;
        actions.push({
          type: 'swap',
          targetPiece: target,
          label: `🔄 Échanger avec ${target.type}`,
          cooldown: cooldown > 0 ? cooldown : 0
        });
      });
    }

    return actions;
  }

  /**
   * Cases de déplacement valides
   */
  getValidMovesForPiece(piece) {
      if (!piece || !piece.canMove?.()) {
          return [];
      }

      const moves = [];
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

      directions.forEach(([dx, dy]) => {
          const newX = piece.x + dx;
          const newY = piece.y + dy;

          if (this.board.isValidPosition(newX, newY) &&
              !this.board.getPieceAt(newX, newY)) {
              moves.push({ x: newX, y: newY });
          }
      });

      return moves;
  }

  /**
   * Cibles d'échange valides pour Scarab
   */
  getValidSwapTargets(scarab) {
      const targets = [];
      const pieces = this.board.getPieces();

      pieces.forEach(piece => {
          if (piece.player === scarab.player) {
              const cooldown = scarab.swapCooldowns?.[piece.type] || 0;
              if ((piece.type === 'sphinx' || piece.type === 'pharaoh') &&
                  cooldown === 0) {
                  targets.push(piece);
              }
          }
      });

      return targets;
  }

  /**
   * Cases valides pour placement de Pyramid
   */
  getValidPyramidPlacements() {
      const player = this.turnManager.getCurrentPlayer();
      const reserve = this.turnManager.getReserve(player);

      if (reserve <= 0) return [];

      const validCells = [];

      for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
              if (this.board.getPieceAt(x, y)) continue;

              // Vérifier adjacence interdite
              const adjacent = this.board.getAdjacentPieces(x, y);
              const forbidden = adjacent.some(p =>
                  p.type === 'pharaoh' || p.type === 'sphinx'
              );

              if (!forbidden) {
                  validCells.push({ x, y });
              }
          }
      }

      return validCells;
  }

  /**
   * Exécuter une action
   */
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

      // Tir du laser (sauf si swap avec Sphinx)
      if (!result.skipLaser) {
          const laserResult = this.laserSimulator.simulate(
              this.board,
              this.turnManager.getCurrentPlayer()
          );
          this.lastLaserEvents = laserResult;
          this.applyLaserEffects(laserResult);
          this.logger.logLaser(laserResult);
      }

      this.turnManager.endTurn();
      this.checkWinCondition();

      return {
          success: true,
          ...result,
          lastLaserEvents: this.lastLaserEvents
      };
  }

  /**
   * Appliquer les effets du laser
   */
  applyLaserEffects(events) {
    const destroyedPieces = events.filter(e => e.type === 'DESTROY' && e.piece);
    console.log(`[LASER] ${destroyedPieces.length} piece(s) destroyed`);
    destroyedPieces.forEach(event => {
      const piece = event.piece;
      console.log(`[LASER] Destroying ${piece.type} at (${event.x}, ${event.y})`);
      this.board.removePiece(piece);
      
      if (piece.type === 'pharaoh') {
        this.gameOver = true;
        this.winner = piece.player === 1 ? 2 : 1;
        this.logger.logGameOver(this.winner);
        console.log(`[GAME OVER] Player ${this.winner} wins!`);
      } 
      else if (piece.type === 'pyramid') {
        const opponent = piece.player === 1 ? 2 : 1;
        this.turnManager.addPendingPyramid(opponent);
        this.logger.log(
            `Pyramid destroyed! Will be added to Player ${opponent}'s reserve next turn.`,
            'log-laser'
        );
        console.log(`[LASER] Pyramid added to P${opponent} reserve (pending)`);
      }
    });

    const reflections = events.filter(e => e.type === 'REFLECT');
    if (reflections.length > 0) {
      console.log(`[LASER] ${reflections.length} reflection(s)`);
    }
  }

  /**
   * Vérifier la condition de victoire
   */
  checkWinCondition() {
      const pharaohs = this.board.getPieces().filter(p => p.type === 'pharaoh');

      if (pharaohs.length === 1) {
          this.gameOver = true;
          this.winner = pharaohs[0].player;
          this.logger.logGameOver(this.winner);
      } else if (pharaohs.length === 0 || this.turnManager.turnCount > 100) {
          this.gameOver = true;
          this.winner = null;
          this.logger.logGameOver(null);
      }
  }

  /**
   * Obtenir l'état complet du jeu
   */
  getGameState() {
      return {
          board: this.board.toJSON(),
          turn: this.turnManager.getCurrentPlayer(),
          turnCount: this.turnManager.turnCount,
          gameOver: this.gameOver,
          winner: this.winner,
          reserves: {
              1: this.turnManager.getReserve(1),
              2: this.turnManager.getReserve(2)
          }
      };
  }
}