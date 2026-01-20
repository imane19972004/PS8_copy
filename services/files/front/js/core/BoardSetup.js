import { BOARD_SIZE } from '../utils/Constants.js';
import Sphinx from '../pieces/Sphinx.js';
import Scarab from '../pieces/Scarab.js';
import Pharaoh from '../pieces/Pharaoh.js';
import Anubis from '../pieces/Anubis.js';
import Pyramid from '../pieces/Pyramid.js';

export default class BoardSetup {
    static initializeGame(board) {
        const p1Sphinx = this._placeSphinx(1, board);
        const p1Pharaoh = this._placePharaoh(1, board, [
            p1Sphinx.x,
            BOARD_SIZE - 1 - p1Sphinx.x
        ]);

        const p1Anubis1 = this._placeAnubis(1, board, p1Pharaoh.x, 4, 180);
        const p1Anubis2 = this._placeAnubis(1, board, BOARD_SIZE - 1 - p1Sphinx.x, 2, 180);
        const p1Scarab = this._placeScarab(1, board);

        this._mirrorPieces(board, [p1Sphinx, p1Pharaoh, p1Anubis1, p1Anubis2, p1Scarab]);
    }

    static _placeSphinx(player, board) {
        const x = Math.floor(Math.random() * BOARD_SIZE);
        const y = 0; // Ligne 1 (index 0)
        
        // Laser horizontal vers le côté le plus libre
        const distanceToLeft = x;
        const distanceToRight = BOARD_SIZE - 1 - x;
        const orientation = distanceToLeft > distanceToRight ? 180 : 0; // WEST si plus près de droite, EST sinon
        
        const s = new Sphinx(player, x, y, orientation);
        board.addPiece(s);
        return s;
    }

    static _placePharaoh(player, board, forbiddenCols) {
        let x;
        do {
            x = Math.floor(Math.random() * BOARD_SIZE);
        } while (x === 0 || x === BOARD_SIZE - 1 || forbiddenCols.includes(x));
        const p = new Pharaoh(player, x, 2, 0); // Ligne 3 (index 2)
        board.addPiece(p);
        return p;
    }

    static _placeAnubis(player, board, x, y, orientation) {
        const a = new Anubis(player, x, y, orientation);
        board.addPiece(a);
        return a;
    }

    static _placeScarab(player, board) {
        const x = Math.floor(Math.random() * BOARD_SIZE);
        const s = new Scarab(player, x, 3, Math.random() < 0.5 ? 0 : 90); // Ligne 4 (index 3)
        board.addPiece(s);
        return s;
    }

    static _mirrorPieces(board, pieces) {
        pieces.forEach(p => {
            let mirrored;
            
            if (p.type === 'pharaoh') {
                mirrored = new Pharaoh(2, BOARD_SIZE - 1 - p.x, BOARD_SIZE - 1 - p.y);
            } else if (p.type === 'sphinx') {
                mirrored = new Sphinx(2, BOARD_SIZE - 1 - p.x, BOARD_SIZE - 1 - p.y, (p.orientation + 180) % 360);
            } else if (p.type === 'anubis') {
                mirrored = new Anubis(2, BOARD_SIZE - 1 - p.x, BOARD_SIZE - 1 - p.y, (p.orientation + 180) % 360);
            } else if (p.type === 'scarab') {
                mirrored = new Scarab(2, BOARD_SIZE - 1 - p.x, BOARD_SIZE - 1 - p.y, (p.orientation + 180) % 360);
            } else if (p.type === 'pyramid') {
                mirrored = new Pyramid(2, BOARD_SIZE - 1 - p.x, BOARD_SIZE - 1 - p.y, (p.orientation + 180) % 360);
            }
            
            if (mirrored) {
                board.addPiece(mirrored);
            }
        });
    }
}