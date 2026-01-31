const Piece = require('./Piece.js');
const { PIECE_TYPES, DIRECTION_VECTORS } = require('../utils/Constants.js');

class Sphinx extends Piece {
  constructor(player, x, y, orientation) {
    super(PIECE_TYPES.SPHINX, player, x, y, orientation);
  }

  canRotate() {
    return true;
  }

  canMove() {
    return false; // Sphinx immobile
  }

  blocksLaser() {
    return true;
  }

  getLaserDirection() {
    // Le laser part dans la direction de l'orientation du Sphinx
    return DIRECTION_VECTORS[this.orientation];
  }

  interactWithLaser(dir) {
    // Sphinx indestructible
    return { 
      type: 'BLOCK', 
      stop: true 
    };
  }

  getShieldSides() {
    // Sphinx protégé sur 4 faces
    return {
      top: true,
      right: true,
      bottom: true,
      left: true
    };
  }
}

module.exports = Sphinx;