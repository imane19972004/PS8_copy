import Piece from './Piece.js';
import { PIECE_TYPES, DIRECTION_VECTORS } from '../utils/Constants.js';

export default class Anubis extends Piece {
  constructor(player, x, y, orientation) {
    super(PIECE_TYPES.ANUBIS, player, x, y, orientation);
  }

  canMove() {
    return true;
  }

  canRotate() {
    return true;
  }

  blocksLaser(laserDir) {
    // Convertir la direction du laser en angle
    const dirAngle = Object.keys(DIRECTION_VECTORS).find(
      k => DIRECTION_VECTORS[k].dx === laserDir.dx && 
          DIRECTION_VECTORS[k].dy === laserDir.dy
    );
    
    // Le bouclier bloque si orienté vers le laser (opposé à la direction)
    return (parseInt(dirAngle) + 180) % 360 === this.orientation;
  }

  interactWithLaser(dir) {
    if (this.blocksLaser(dir)) {
      return { type: 'BLOCK', stop: true };
    }
    return { type: 'DESTROY', stop: true };
  }

  getShieldSides() {
    const sides = { top: false, right: false, bottom: false, left: false };

    switch (this.orientation) {
      case 0:   sides.top = true; break;
      case 90:  sides.right = true; break;
      case 180: sides.bottom = true; break;
      case 270: sides.left = true; break;
    }

    return sides;
  }
}