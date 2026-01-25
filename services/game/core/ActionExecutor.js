import Pyramid from '../pieces/Pyramid.js';
import { ACTION_TYPES } from '../utils/Constants.js';

export default class ActionExecutor {
  constructor(board, turnManager) {
    this.board = board;
    this.turnManager = turnManager;
  }

  executeAction(action) {
    // Validation globale
    if (!this.validateTurn(action)) {
      return { success: false, error: 'Not your turn' };
    }

    // Routing vers la bonne méthode
    switch (action.type) {
      case ACTION_TYPES.ROTATE:
        return this.rotate(action.params);
      
      case ACTION_TYPES.MOVE:
        return this.move(action.params);
      
      case ACTION_TYPES.PLACE_PYRAMID:
        return this.placePyramid(action.params);
      
      case ACTION_TYPES.SWAP_SCARAB:
        return this.swapScarab(action.params);
      
      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  validateTurn(action) {
    const currentPlayer = this.turnManager.getCurrentPlayer();
    return action.player === currentPlayer;
  }

  // ROTATION
  rotate(params) {
    const { at, clockwise = true } = params;

    const piece = this.board.getPieceAt(at.x, at.y);

    if (!piece) {
      return { success: false, error: 'No piece at position' };
    }

    if (piece.type === 'pharaoh') {
      return { success: false, error: 'Pharaoh cannot rotate' };
    }

    if (!piece.canRotate()) {
      return { success: false, error: 'This piece cannot rotate' };
    }

    // Exécution
    piece.rotate(clockwise);

    return {
      success: true,
      message: `Rotated ${piece.type} ${clockwise ? 'clockwise' : 'anticlockwise'}`
    };
  }

  // DÉPLACEMENT
  move(params) {
    const { from, toX, toY } = params;

    const piece = this.board.getPieceAt(from.x, from.y);

    if (!piece) {
      return { success: false, error: 'No piece at source position' };
    }

    if (!piece.canMove()) {
      return { success: false, error: 'This piece cannot move' };
    }

    if (!this.board.isValidPosition(toX, toY)) {
      return { success: false, error: 'Invalid position' };
    }

    if (this.board.getPieceAt(toX, toY)) {
      return { success: false, error: 'Cell is occupied' };
    }

    // Vérifier déplacement orthogonal adjacent
    if (!this.isAdjacentOrthogonal(piece, toX, toY)) {
      return { success: false, error: 'Must move to adjacent cell (orthogonal only)' };
    }

    // Exécution
    this.board.movePiece(piece, toX, toY);

    return {
      success: true,
      message: `Moved ${piece.type} to (${toX}, ${toY})`
    };
  }

  isAdjacentOrthogonal(piece, toX, toY) {
    const dx = Math.abs(piece.x - toX);
    const dy = Math.abs(piece.y - toY);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  // PLACEMENT PYRAMIDE
  placePyramid(params) {
    const { x, y, player, orientation = 0 } = params;

    // Vérifier réserve
    const reserve = this.turnManager.getReserve(player);
    if (reserve <= 0) {
      return { success: false, error: 'No pyramids in reserve' };
    }

    // Vérifier case vide
    if (this.board.getPieceAt(x, y)) {
      return { success: false, error: 'Cell is occupied' };
    }

    // Vérifier interdiction adjacence Pharaoh/Sphinx
    const adjacent = this.board.getAdjacentPieces(x, y);
    const hasForbiddenNeighbor = adjacent.some(p => 
      p.type === 'pharaoh' || p.type === 'sphinx'
    );

    if (hasForbiddenNeighbor) {
      return {
        success: false,
        error: 'Cannot place adjacent to Pharaoh or Sphinx'
      };
    }

    // Placement
    const pyramid = new Pyramid(player, x, y, orientation);
    this.board.addPiece(pyramid);
    this.turnManager.decrementReserve(player);

    return {
      success: true,
      message: `Placed pyramid at (${x}, ${y})`
    };
  }

  // ÉCHANGE SCARAB
  swapScarab(params) {
    const { from, to } = params;

    const scarab = this.board.getPieceAt(from.x, from.y);
    const target = this.board.getPieceAt(to.x, to.y);

    if (!scarab || !target) {
      return { success: false, error: 'Invalid swap positions' };
    }

    // Validations
    if (scarab.type !== 'scarab') {
      return { success: false, error: 'Must select a Scarab' };
    }

    if (target.player !== scarab.player) {
      return { success: false, error: 'Can only swap with own pieces' };
    }

    if (target.type !== 'sphinx' && target.type !== 'pharaoh') {
      return {
        success: false,
        error: 'Can only swap with Sphinx or Pharaoh'
      };
    }

    // Vérifier cooldown
    if (!scarab.canSwapWith(target.type)) {
      return {
        success: false,
        error: `Swap with ${target.type} on cooldown (${scarab.swapCooldowns[target.type]} turns remaining)`
      };
    }

    // Exécution de l'échange
    const [x1, y1] = [scarab.x, scarab.y];
    const [x2, y2] = [target.x, target.y];

    // Swap positions
    scarab.x = x2;
    scarab.y = y2;
    target.x = x1;
    target.y = y1;

    // Mise à jour grille
    this.board.grid[y1][x1] = target;
    this.board.grid[y2][x2] = scarab;

    // Activer cooldown
    scarab.swapCooldowns[target.type] = 4;

    // Si swap avec Sphinx → pas de laser ce tour
    const skipLaser = target.type === 'sphinx';

    return {
      success: true,
      message: `Swapped Scarab with ${target.type}`,
      skipLaser
    };
  }
}