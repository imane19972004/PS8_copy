import Piece from './Piece.js';
import { PIECE_TYPES } from '../utils/Constants.js';

export default class Pharaoh extends Piece {
    constructor(player, x, y) {
        super(PIECE_TYPES.PHARAOH, player, x, y, 0);
    }

    // Pharaoh est immobile et vulnérable
    // Hérite de canMove() = false et canRotate() = false
    // Hérite de interactWithLaser() qui retourne DESTROY
}