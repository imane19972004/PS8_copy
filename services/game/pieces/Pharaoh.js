const Piece = require('./Piece.js');
const { PIECE_TYPES } = require('../utils/Constants.js');

class Pharaoh extends Piece {
    constructor(player, x, y) {
        super(PIECE_TYPES.PHARAOH, player, x, y, 0);
    }

    // Pharaoh est immobile et vulnérable
    // Hérite de canMove() = false et canRotate() = false
    // Hérite de interactWithLaser() qui retourne DESTROY
}

module.exports = Pharaoh;