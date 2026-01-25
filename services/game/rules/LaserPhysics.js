import { ORIENTATIONS, DIRECTION_VECTORS } from './Constants.js';

export default class LaserPhysics {
  /**
   * Calcule la réflexion sur une Pyramid
   * 
   * Orientations des miroirs :
   * 0°   : / (miroir bas-gauche → haut-droite)
   * 90°  : \ (miroir haut-gauche → bas-droite)
   * 180° : / (identique à 0°)
   * 270° : \ (identique à 90°)
   */
  static reflectOnPyramid(orientation, incomingDirection) {
    const normalizedOr = orientation % 180;
    
    // Convertir direction en angle
    const dirAngle = Object.keys(DIRECTION_VECTORS).find(
      k => DIRECTION_VECTORS[k].dx === incomingDirection.dx && 
           DIRECTION_VECTORS[k].dy === incomingDirection.dy
    );
    
    if (!dirAngle) return null;
    
    const dir = parseInt(dirAngle);

    // Tables de réflexion
    const reflectionTables = {
      // Miroir / (0° ou 180°)
      0: {
        [ORIENTATIONS.EAST]: ORIENTATIONS.NORTH,   // → ↑
        [ORIENTATIONS.NORTH]: ORIENTATIONS.EAST,   // ↑ →
        [ORIENTATIONS.WEST]: ORIENTATIONS.SOUTH,   // ← ↓
        [ORIENTATIONS.SOUTH]: ORIENTATIONS.WEST    // ↓ ←
      },
      // Miroir \ (90° ou 270°)
      90: {
        [ORIENTATIONS.EAST]: ORIENTATIONS.SOUTH,   // → ↓
        [ORIENTATIONS.SOUTH]: ORIENTATIONS.EAST,   // ↓ →
        [ORIENTATIONS.WEST]: ORIENTATIONS.NORTH,   // ← ↑
        [ORIENTATIONS.NORTH]: ORIENTATIONS.WEST    // ↑ ←
      }
    };

    const newAngle = reflectionTables[normalizedOr]?.[dir];
    return newAngle !== undefined ? DIRECTION_VECTORS[newAngle] : null;
  }

  /**
   * Détermine si un côté de la Pyramid est réfléchissant
   */
  static isPyramidReflectiveSide(orientation, incomingDirection) {
    const reflected = this.reflectOnPyramid(orientation, incomingDirection);
    return reflected !== null && reflected !== undefined;
  }

  /**
   * Calcule la réflexion sur un Scarab
   * Scarab = miroir double face (réfléchit de partout)
   * Réflexion à 90° perpendiculaire
   */
  static reflectOnScarab(incomingDirection) {
    const dirAngle = Object.keys(DIRECTION_VECTORS).find(
      k => DIRECTION_VECTORS[k].dx === incomingDirection.dx && 
           DIRECTION_VECTORS[k].dy === incomingDirection.dy
    );
    
    if (!dirAngle) return DIRECTION_VECTORS[0];

    // Rotation 90° (peut être clockwise ou anticlockwise selon design)
    // Implémentation standard : swap dx/dy avec inversion
    const { dx, dy } = incomingDirection;
    
    // Exemple : EST (1,0) → NORD (0,-1)
    //           NORD (0,-1) → OUEST (-1,0)
    const newDx = -dy;
    const newDy = dx;

    // Trouver l'angle correspondant
    const newAngle = Object.keys(DIRECTION_VECTORS).find(
      k => DIRECTION_VECTORS[k].dx === newDx && 
           DIRECTION_VECTORS[k].dy === newDy
    );

    return newAngle ? DIRECTION_VECTORS[newAngle] : DIRECTION_VECTORS[0];
  }

  /**
   * Vérifie si un Anubis bloque avec son bouclier
   */
  static isAnubisBlocking(anubisOrientation, laserDirection) {
    const dirAngle = Object.keys(DIRECTION_VECTORS).find(
      k => DIRECTION_VECTORS[k].dx === laserDirection.dx && 
           DIRECTION_VECTORS[k].dy === laserDirection.dy
    );
    
    if (!dirAngle) return false;

    // Le bouclier bloque si orienté VERS le laser
    const oppositeDir = (parseInt(dirAngle) + 180) % 360;
    return anubisOrientation === oppositeDir;
  }
}