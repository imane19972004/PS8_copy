import Piece from './Piece.js';
import { PIECE_TYPES } from '../utils/Constants.js';
import LaserPhysics from '../utils/LaserPhysics.js';

export default class Scarab extends Piece {
  constructor(player, x, y, orientation) {
    super(PIECE_TYPES.SCARAB, player, x, y, orientation);
    this.swapCooldowns = { sphinx: 0, pharaoh: 0 };
  }

  canMove() {
    return true;
  }

  canRotate() {
    return true;
  }

  reflectsLaser(dir) {
    return true; // Scarab réfléchit toujours
  }

  canSwapWith(pieceType) {
    const validTypes = ['sphinx', 'pharaoh'];
    return validTypes.includes(pieceType) && this.swapCooldowns[pieceType] === 0;
  }

  interactWithLaser(dir) {
    return {
      type: 'REFLECT',
      stop: false,
      newDirection: LaserPhysics.reflectOnScarab(dir)
    };
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