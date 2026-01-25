import { BOARD_SIZE } from '../utils/Constants.js';
import Sphinx from '../pieces/Sphinx.js';
import Scarab from '../pieces/Scarab.js';
import Pharaoh from '../pieces/Pharaoh.js';
import Anubis from '../pieces/Anubis.js';

export default class BoardSetup {
  static initializeGame(board) {
    console.log('🎲 Setting up board...');

    // ========================================
    // PLAYER 1 - SETUP
    // ========================================

    // 1. SPHINX (Ligne 1 = y:0)
    const p1Sphinx = this._placeSphinx(1, board);
    console.log(`  ✓ P1 Sphinx at (${p1Sphinx.x}, ${p1Sphinx.y}), orientation: ${p1Sphinx.orientation}°`);

    // 2. PHARAOH (Ligne 3 = y:2)
    const forbiddenCols = [
      p1Sphinx.x, 
      BOARD_SIZE - 1 - p1Sphinx.x
    ];
    const p1Pharaoh = this._placePharaoh(1, board, forbiddenCols);
    console.log(`  ✓ P1 Pharaoh at (${p1Pharaoh.x}, ${p1Pharaoh.y})`);

    // 3. ANUBIS 1 (Ligne 5 = y:4, même colonne que Pharaoh)
    const p1Anubis1 = this._placeAnubis(
      1, 
      board, 
      p1Pharaoh.x, 
      4, 
      180 // Orienté vers adversaire (SUD)
    );
    console.log(`  ✓ P1 Anubis1 at (${p1Anubis1.x}, ${p1Anubis1.y})`);

    // 4. ANUBIS 2 (Ligne 3 = y:2, colonne Sphinx adverse)
    const p1Anubis2 = this._placeAnubis(
      1, 
      board, 
      BOARD_SIZE - 1 - p1Sphinx.x, 
      2, 
      180 // Orienté vers adversaire (SUD)
    );
    console.log(`  ✓ P1 Anubis2 at (${p1Anubis2.x}, ${p1Anubis2.y})`);

    // 5. SCARAB (Ligne 4 = y:3)
    const p1Scarab = this._placeScarab(1, board);
    console.log(`  ✓ P1 Scarab at (${p1Scarab.x}, ${p1Scarab.y}), orientation: ${p1Scarab.orientation}°`);

    // ========================================
    // PLAYER 2 - SYMÉTRIE CENTRALE
    // ========================================

    this._mirrorPieces(board, [
      p1Sphinx, 
      p1Pharaoh, 
      p1Anubis1, 
      p1Anubis2, 
      p1Scarab
    ]);

    console.log('✅ Board setup complete!');
  }

  // ========================================
  // PLACEMENT PIÈCES JOUEUR 1
  // ========================================

  static _placeSphinx(player, board) {
    const x = Math.floor(Math.random() * BOARD_SIZE);
    const y = 0; // Ligne 1

    // Laser horizontal vers le côté le plus libre
    const distanceToLeft = x;
    const distanceToRight = BOARD_SIZE - 1 - x;
    const orientation = distanceToLeft > distanceToRight ? 180 : 0;

    const sphinx = new Sphinx(player, x, y, orientation);
    board.addPiece(sphinx);
    return sphinx;
  }

  static _placePharaoh(player, board, forbiddenCols) {
    let x;
    do {
      x = Math.floor(Math.random() * BOARD_SIZE);
    } while (
      x === 0 || 
      x === BOARD_SIZE - 1 || 
      forbiddenCols.includes(x)
    );

    const y = 2; // Ligne 3
    const pharaoh = new Pharaoh(player, x, y);
    board.addPiece(pharaoh);
    return pharaoh;
  }

  static _placeAnubis(player, board, x, y, orientation) {
    const anubis = new Anubis(player, x, y, orientation);
    board.addPiece(anubis);
    return anubis;
  }

  static _placeScarab(player, board) {
    const x = Math.floor(Math.random() * BOARD_SIZE);
    const y = 3; // Ligne 4
    const orientation = Math.random() < 0.5 ? 0 : 90;

    const scarab = new Scarab(player, x, y, orientation);
    board.addPiece(scarab);
    return scarab;
  }

  // ========================================
  // SYMÉTRIE JOUEUR 2
  // ========================================

  static _mirrorPieces(board, pieces) {
    pieces.forEach(p => {
      const mirroredX = BOARD_SIZE - 1 - p.x;
      const mirroredY = BOARD_SIZE - 1 - p.y;
      const mirroredOrientation = (p.orientation + 180) % 360;

      let mirrored;

      switch (p.type) {
        case 'pharaoh':
          mirrored = new Pharaoh(2, mirroredX, mirroredY);
          break;
        case 'sphinx':
          mirrored = new Sphinx(2, mirroredX, mirroredY, mirroredOrientation);
          break;
        case 'anubis':
          mirrored = new Anubis(2, mirroredX, mirroredY, mirroredOrientation);
          break;
        case 'scarab':
          mirrored = new Scarab(2, mirroredX, mirroredY, mirroredOrientation);
          break;
      }

      if (mirrored) {
        board.addPiece(mirrored);
        console.log(`  ✓ P2 ${mirrored.type} at (${mirrored.x}, ${mirrored.y})`);
      }
    });
  }
}