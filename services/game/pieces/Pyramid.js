const Piece = require('./Piece.js');
const LaserPhysics = require('../rules/LaserPhysics.js');
const { PIECE_TYPES } = require('../utils/Constants.js');

class Pyramid extends Piece {
  constructor(player, x, y, orientation) {
    super(PIECE_TYPES.PYRAMID, player, x, y, orientation);

    this.baseFaces = ['faceA', 'faceB', 'faceC', 'faceD'];
    this.updateFacesNames();
  }

  canMove() {
    return true;
  }

  canRotate() {
    return true;
  }

  rotate(clockwise = true) {
    super.rotate(clockwise);
    this.updateFacesNames();
  }

  getFaceDirections() {
    const steps = (this.orientation / 90) % 4;

    const rotatedFaces =
      this.baseFaces.slice(-steps).concat(this.baseFaces.slice(0, -steps));

    return {
      NORTH: rotatedFaces[0],
      EAST:  rotatedFaces[1],
      SOUTH: rotatedFaces[2],
      WEST:  rotatedFaces[3]
    };
  }

  getDirectionOfFace(faceName) {
    const faces = this.getFaceDirections();
    return Object.entries(faces)
      .find(([, f]) => f === faceName)?.[0] || null;
  }

  updateFacesNames() {
    const steps = (this.orientation / 90) % 4;

    this.faces = this.baseFaces.slice(-steps).concat(this.baseFaces.slice(0, -steps));

    this.boardFaces = {
      NORTH: this.faces[0],
      EAST:  this.faces[1],
      SOUTH: this.faces[2],
      WEST:  this.faces[3]
    };
  }

  getFaceHit(boardSide) {
    return this.boardFaces[boardSide];
  }

  reflectsLaser(dir) {
    return LaserPhysics.isPyramidReflectiveSide(this.orientation, dir);
  }

  interactWithLaser(dir) {
    console.log(`[PYRAMID] Incoming laser direction: ${JSON.stringify(dir)}`);
    const newDirection = LaserPhysics.reflectOnPyramid(this, dir);

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

    return sides;
  }
}

module.exports = Pyramid;