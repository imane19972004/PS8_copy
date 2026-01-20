import { ORIENTATIONS, DIRECTION_VECTORS } from './Constants.js';

export default class LaserPhysics {
    /**
     * Calcule la réflexion sur une Pyramid
     * 
     * Orientations des miroirs :
     * 0°   : / (miroir bas-gauche vers haut-droite)
     * 90°  : \ (miroir haut-gauche vers bas-droite)
     * 180° : / (identique à 0°)
     * 270° : \ (identique à 90°)
     */
    static reflectOnPyramid(orientation, incomingDirection) {
        const normalizedOr = orientation % 180;
        
        // Convertir la direction en angle
        const dirAngle = Object.keys(DIRECTION_VECTORS).find(
            k => DIRECTION_VECTORS[k].dx === incomingDirection.dx && 
                 DIRECTION_VECTORS[k].dy === incomingDirection.dy
        );
        const dir = parseInt(dirAngle);

        // Tables de réflexion correctes
        const reflectionTables = {
            // Miroir / (0° ou 180°)
            0: {
                [ORIENTATIONS.EAST]: ORIENTATIONS.NORTH,  // → ↑
                [ORIENTATIONS.NORTH]: ORIENTATIONS.EAST,  // ↑ →
                [ORIENTATIONS.WEST]: ORIENTATIONS.SOUTH,  // ← ↓
                [ORIENTATIONS.SOUTH]: ORIENTATIONS.WEST   // ↓ ←
            },
            // Miroir \ (90° ou 270°)
            90: {
                [ORIENTATIONS.EAST]: ORIENTATIONS.SOUTH,  // → ↓
                [ORIENTATIONS.SOUTH]: ORIENTATIONS.EAST,  // ↓ →
                [ORIENTATIONS.WEST]: ORIENTATIONS.NORTH,  // ← ↑
                [ORIENTATIONS.NORTH]: ORIENTATIONS.WEST   // ↑ ←
            }
        };

        const newAngle = reflectionTables[normalizedOr][dir];
        return DIRECTION_VECTORS[newAngle];
    }

    /**
     * Détermine si un côté de la Pyramid est réfléchissant
     */
    static isPyramidReflectiveSide(orientation, incomingDirection) {
        const reflected = this.reflectOnPyramid(orientation, incomingDirection);
        return reflected !== undefined;
    }

    /**
     * Calcule la réflexion sur un Scarab (toujours opposé - miroir 90°)
     */
    static reflectOnScarab(incomingDirection) {
        const dirAngle = Object.keys(DIRECTION_VECTORS).find(
            k => DIRECTION_VECTORS[k].dx === incomingDirection.dx && 
                 DIRECTION_VECTORS[k].dy === incomingDirection.dy
        );
        const newAngle = (parseInt(dirAngle) + 180) % 360;
        return DIRECTION_VECTORS[newAngle];
    }

    /**
     * Vérifie si un Anubis bloque avec son bouclier
     */
    static isAnubisBlocking(anubisOrientation, laserDirection) {
        // Le bouclier bloque si orienté VERS le laser
        // = si l'orientation est l'opposé de la direction du laser
        const dirAngle = Object.keys(DIRECTION_VECTORS).find(
            k => DIRECTION_VECTORS[k].dx === laserDirection.dx && 
                 DIRECTION_VECTORS[k].dy === laserDirection.dy
        );
        const oppositeDir = (parseInt(dirAngle) + 180) % 360;
        return anubisOrientation === oppositeDir;
    }
}