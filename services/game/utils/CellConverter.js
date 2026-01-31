/**
 * UTILITAIRES DE CONVERSION CELL en COORDONNÉES
 * 
 * Cell : entier 0-99 représentant une case du plateau 10x10
 *        -1 : réserve joueur 1
 *        -2 : réserve joueur 2
 * 
 * Coords : {x, y} où x,y ∈ [0, 9]
 */

const { BOARD_SIZE, SPECIAL_CELLS, TOTAL_CELLS } = require('./Constants.js');

/**
 * Convertit des coordonnées (x, y) en Cell
 * 
 * @param {number} x - Colonne (0-9)
 * @param {number} y - Ligne (0-9)
 * @returns {number} Cell (0-99) ou -1 si invalide
 * 
 * @example
 * coordsToCell(0, 0) → 0
 * coordsToCell(9, 0) → 9
 * coordsToCell(0, 1) → 10
 * coordsToCell(9, 9) → 99
 */
function coordsToCell(x, y) {
  // Validation
  if (typeof x !== 'number' || typeof y !== 'number') {
    console.warn(`[CellConverter] Invalid types: x=${typeof x}, y=${typeof y}`);
    return -1;
  }
  
  if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) {
    console.warn(`[CellConverter] Out of bounds: (${x}, ${y})`);
    return -1;
  }
  
  return y * BOARD_SIZE + x;
}

/**
 * Convertit une Cell en coordonnées {x, y}
 */
function cellToCoords(cell) {
  // Validation type
  if (typeof cell !== 'number') {
    console.warn(`[CellConverter] Invalid cell type: ${typeof cell}`);
    return null;
  }
  
  // Cellules spéciales (réserves)
  if (cell === SPECIAL_CELLS.RESERVE_P1 || cell === SPECIAL_CELLS.RESERVE_P2) {
    return null; // Pas de coordonnées spatiales
  }
  
  // Validation range
  if (cell < 0 || cell >= TOTAL_CELLS) {
    console.warn(`[CellConverter] Invalid cell: ${cell}`);
    return null;
  }
  
  return {
    x: cell % BOARD_SIZE,
    y: Math.floor(cell / BOARD_SIZE)
  };
}

/**
 * Vérifie si une Cell est valide
 * 
 * @param {number} cell - Cell à vérifier
 * @returns {boolean} true si valide
 */
function isValidCell(cell) {
  return (
    cell === SPECIAL_CELLS.RESERVE_P1 ||
    cell === SPECIAL_CELLS.RESERVE_P2 ||
    (typeof cell === 'number' && cell >= 0 && cell < TOTAL_CELLS)
  );
}

/**
 * Vérifie si des coordonnées sont valides
 * 
 * @param {number} x - Colonne
 * @param {number} y - Ligne
 * @returns {boolean} true si valide
 */
function isValidCoords(x, y) {
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    x >= 0 && x < BOARD_SIZE &&
    y >= 0 && y < BOARD_SIZE
  );
}

/**
 * Obtient le numéro de joueur depuis une cellule de réserve
 * 
 * @param {number} cell - Cell (-1 ou -2)
 * @returns {number | null} 1, 2, ou null
 */
function getPlayerFromReserveCell(cell) {
  if (cell === SPECIAL_CELLS.RESERVE_P1) return 1;
  if (cell === SPECIAL_CELLS.RESERVE_P2) return 2;
  return null;
}

/**
 * Obtient la cellule de réserve pour un joueur
 * 
 * @param {number} player - 1 ou 2
 * @returns {number} -1 ou -2
 */
function getReserveCellForPlayer(player) {
  return player === 1 ? SPECIAL_CELLS.RESERVE_P1 : SPECIAL_CELLS.RESERVE_P2;
}

/**
 * Calcule la distance Manhattan entre deux cells
 * 
 * @param {number} cell1 - Première cell
 * @param {number} cell2 - Deuxième cell
 * @returns {number | null} Distance ou null si invalide
 */
function getDistanceBetweenCells(cell1, cell2) {
  const coords1 = cellToCoords(cell1);
  const coords2 = cellToCoords(cell2);
  
  if (!coords1 || !coords2) return null;
  
  return Math.abs(coords1.x - coords2.x) + Math.abs(coords1.y - coords2.y);
}

/**
 * Vérifie si deux cells sont adjacentes (orthogonalement)
 * 
 * @param {number} cell1 - Première cell
 * @param {number} cell2 - Deuxième cell
 * @returns {boolean} true si adjacentes
 */
function areAdjacent(cell1, cell2) {
  const distance = getDistanceBetweenCells(cell1, cell2);
  return distance === 1;
}

function flipCell(cell) {
    const { x, y } = cellToCoords(cell);
    const flippedY = BOARD_SIZE - 1 - y;
    return coordsToCell(x, flippedY);
}


module.exports = {
  coordsToCell,
  cellToCoords,
  flipCell,
  
  isValidCell,
  isValidCoords,
  
  getPlayerFromReserveCell,
  getReserveCellForPlayer,
  
  getDistanceBetweenCells,
  areAdjacent
};