const {
  ORIENTATIONS,
  ORIENTATION_TO_ANGLE,
  DIRECTION_VECTORS
} = require('../utils/Constants.js');

class LaserPhysics {
  static directionToAngle(direction) {
    const entry = Object.entries(DIRECTION_VECTORS).find(
      ([, v]) => v.dx === direction.dx && v.dy === direction.dy
    );
    return entry ? Number(entry[0]) : null;
  }

  static angleToDirection(angle) {
    return DIRECTION_VECTORS[angle] || null;
  }

  static getBoardSideHit(dir) {
    if (dir.dx === 1) return 'WEST';
    if (dir.dx === -1) return 'EAST';
    if (dir.dy === 1) return 'NORTH';
    if (dir.dy === -1) return 'SOUTH';
    return null;
  }

  static isReflectiveFace(face) {
    return face === 'faceA' || face === 'faceB';
  }

  /**
   * Réflexion laser sur Pyramid
   * - retourne une nouvelle direction si réflexion
   * - retourne null si face vulnérable (destruction, laser continue)
   */
  static reflectOnPyramid(pyramid, incomingDirection) {
    const entrySide = this.getBoardSideHit(incomingDirection);
    if (!entrySide) return null;

    const hitFace = pyramid.getFaceDirections()[entrySide];
    console.log('[Laser] Hit face:', hitFace);

    // ❌ faces vulnérables
    if (hitFace !== 'faceA' && hitFace !== 'faceB') {
      return null;
    }

    // 🔁 sortie par l’autre face miroir
    const exitFace = hitFace === 'faceA' ? 'faceB' : 'faceA';

    const exitSide = pyramid.getDirectionOfFace(exitFace);
    if (!exitSide) return null;

    return this.angleToDirection({
      NORTH: 270,
      EAST: 0,
      SOUTH: 90,
      WEST: 180
    }[exitSide]);
  }



  
  static isPyramidReflectiveSide(orientation, incomingDirection) {
    return this.reflectOnPyramid(orientation, incomingDirection) !== null;
  }

  /**
   * Scarab :
   * - toujours réfléchissant
   * - indestructible
   * - rotation 90°
   */
  static reflectOnScarab(incomingDirection) {
    const angle = this.directionToAngle(incomingDirection);
    if (angle === null) return incomingDirection;

    const newAngle = (angle + 90) % 360;
    return this.angleToDirection(newAngle);
  }

  /**
   * L’Anubis bloque si son bouclier
   * fait face au laser
   */
  static isAnubisBlocking(anubisOrientation, laserDirection) {
    const laserAngle = this.directionToAngle(laserDirection);
    if (laserAngle === null) return false;

    const shieldAngle = ORIENTATION_TO_ANGLE[anubisOrientation];
    if (shieldAngle === undefined) return false;

    return shieldAngle === laserAngle;
  }
}

module.exports = LaserPhysics;
