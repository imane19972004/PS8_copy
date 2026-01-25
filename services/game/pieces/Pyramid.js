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
    const newDirection = LaserPhysics.reflectOnPyramid(this.orientation, dir);
    
    if (newDirection) {
      console.log(`[PYRAMID] Reflecting laser from ${JSON.stringify(dir)} to ${JSON.stringify(newDirection)}`);
      return {
        type: 'REFLECT',
        stop: false,
        newDirection
      };
    }
    
    console.log(`[PYRAMID] Destroyed by laser (non-reflective side hit)`);
    return { 
      type: 'DESTROY', 
      stop: false
    };
  }

  getShieldSides() {
    const sides = { 
      top: false, 
      right: false, 
      bottom: false, 
      left: false 
    };

    // Miroir diagonal : 2 faces adjacentes protégées
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