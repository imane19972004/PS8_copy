import Piece from './Piece.js';
import { PIECE_TYPES, DIRECTION_VECTORS } from '../utils/Constants.js';

export default class Sphinx extends Piece {
  constructor(player, x, y, orientation) {
    super(PIECE_TYPES.SPHINX, player, x, y, orientation);
  }

  canRotate() {
    return true;
  }

  blocksLaser() {
    return true;
  }

  getLaserDirection() {
    return DIRECTION_VECTORS[this.orientation];
  }

  interactWithLaser() {
    return { type: 'BLOCK', stop: true };
  }

  getShieldSides() {
    return {
      top: true,
      right: true,
      bottom: true,
      left: true
    };
  }
}