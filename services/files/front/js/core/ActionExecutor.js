import Pyramid from '../pieces/Pyramid.js';

export default class ActionExecutor {
  constructor(board, turnManager) {
    this.board = board;
    this.turnManager = turnManager;
  }

  executeAction(action) {
      // Validation
      if (!this.validate(action)) {
        return { success: false, error: action.error };
      }

      // Exécution
      const result = this[action.type](action.params);

      // Mise à jour état
      if (result.success) {
        this.turnManager.recordAction(action);
      }

      return result;
  }

  rotate(params) {
    const { piece, clockwise = true } = params;

    // Validation
    if (piece.type === 'pharaoh') {
      return { success: false, error: 'Pharaoh cannot rotate' };
    }
    if (!piece.canRotate()) {
      return { success: false, error: 'Piece cannot rotate' };
    }

    // Exécution
    piece.rotate(clockwise);

    return {
      success: true,
      message: `Rotated ${piece.type} 90°`
    };
  }

  move(params) {
    const { piece, toX, toY } = params;

    // Validation complète
    if (!piece.canMove()) {
      return { success: false, error: 'Piece cannot move' };
    }

    if (!this.board.isValidPosition(toX, toY)) {
      return { success: false, error: 'Invalid position' };
    }

    if (this.board.getPieceAt(toX, toY)) {
      return { success: false, error: 'Cell occupied' };
    }

    if (!this._isAdjacentOrthogonal(piece, toX, toY)) {
      return { success: false, error: 'Must move orthogonally (one cell)' };
    }

    // Exécution
    this.board.movePiece(piece, toX, toY);

    return {
      success: true,
      message: `Moved ${piece.type} to (${toX}, ${toY})`
    };
  }

  placePyramid(params) {
    const { x, y, player, orientation = 0 } = params;

    // Vérifier réserve
    const reserve = this.turnManager.getReserve(player);
    if (reserve <= 0) {
      return { success: false, error: 'No pyramids in reserve' };
    }

    // Vérifier case vide
    if (this.board.getPieceAt(x, y)) {
      return { success: false, error: 'Cell occupied' };
    }

    // Vérifier adjacence Pharaoh/Sphinx (TOUS)
    const forbidden = this.board.getAdjacentPieces(x, y)
      .filter(p => p.type === 'pharaoh' || p.type === 'sphinx');

    if (forbidden.length > 0) {
      return {
        success: false,
        error: 'Cannot place adjacent to Pharaoh/Sphinx'
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

  swapScarab(params) {
    const { scarab, target } = params;

    // Validations
    if (scarab.type !== 'scarab') {
      return { success: false, error: 'Must select Scarab' };
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
        error: `Swap with ${target.type} on cooldown`
      };
    }

    // Exécution swap
    const [x1, y1] = [scarab.x, scarab.y];
    const [x2, y2] = [target.x, target.y];

    scarab.x = x2;
    scarab.y = y2;
    target.x = x1;
    target.y = y1;

    // Mise à jour de la grille
    this.board.grid[y1][x1] = target;
    this.board.grid[y2][x2] = scarab;

    // Cooldown
    scarab.swapCooldowns[target.type] = 4;

    // Flag pour skip laser si Sphinx
    const skipLaser = target.type === 'sphinx';

    return {
      success: true,
      message: `Swapped Scarab with ${target.type}`,
      skipLaser
    };
  }

  validate(action) {
    // Validation générique
    const currentPlayer = this.turnManager.getCurrentPlayer();

    if (action.player !== currentPlayer) {
      action.error = 'Not your turn';
      return false;
    }

    return true;
  }

  _isAdjacentOrthogonal(piece, toX, toY) {
    const dx = Math.abs(piece.x - toX);
    const dy = Math.abs(piece.y - toY);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
}