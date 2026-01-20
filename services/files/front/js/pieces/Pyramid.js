import Piece from './Piece.js';
import { PIECE_TYPES } from '../utils/Constants.js';
import LaserPhysics from '../utils/LaserPhysics.js';

export default class Pyramid extends Piece {
  constructor(player, x, y, orientation) {
    super(PIECE_TYPES.PYRAMID, player, x, y, orientation);
  }

  canMove() {
    return true;
  }

  canRotate() {
    return true;
  }

  reflectsLaser(dir) {
    return LaserPhysics.isPyramidReflectiveSide(this.orientation, dir);
  }

  interactWithLaser(dir) {
    if (this.reflectsLaser(dir)) {
      return {
        type: 'REFLECT',
        stop: false,
        newDirection: LaserPhysics.reflectOnPyramid(this.orientation, dir)
     };
  }
    return { type: 'DESTROY', stop: true };
  }

  getShieldSides() {
    const sides = { top: false, right: false, bottom: false, left: false };

    switch (this.orientation) {
      case 0:
        sides.top = true;
        sides.right = true;
        break;
      case 90:
        sides.right = true;
        sides.bottom = true;
        break;
      case 180:
        sides.bottom = true;
        sides.left = true;
        break;
      case 270:
        sides.left = true;
        sides.top = true;
        break;
    }

    return sides;
  }
}