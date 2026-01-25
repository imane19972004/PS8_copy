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
    // Trouver l'angle du laser entrant
    const dirAngle = Object.keys(DIRECTION_VECTORS).find(
      angle => {
        const vec = DIRECTION_VECTORS[angle];
        return vec.dx === laserDir.dx && vec.dy === laserDir.dy;
      }
    );

    if (!dirAngle) return false;

    // Le bouclier bloque si orienté VERS le laser
    // = si orientation opposée à la direction du laser
    const oppositeAngle = (parseInt(dirAngle) + 180) % 360;
    return this.orientation === oppositeAngle;
  }

  interactWithLaser(dir) {
    if (this.blocksLaser(dir)) {
      return { 
        type: 'BLOCK', 
        stop: true 
      };
    }
    
    // Touché sur côté vulnérable
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

    // Le bouclier est sur la face orientée
    switch (this.orientation) {
      case 0:   sides.right = true; break;  // Face EST protégée
      case 90:  sides.bottom = true; break; // Face SUD protégée
      case 180: sides.left = true; break;   // Face OUEST protégée
      case 270: sides.top = true; break;    // Face NORD protégée
    }

    return sides;
  }
}