const ORIENTATIONS = {
  COLUMN_LEFT: 0,    // Colonne gauche
  COLUMN_RIGHT: 9,   // Colonne droite
  ROW_BOTTOM: 90,    // Ligne du bas
  ROW_TOP: 99        // Ligne du haut
};

const ORIENTATION_TO_ANGLE = {
  0: 0,      // EST
  9: 180,    // OUEST
  90: 90,    // SUD
  99: 270    // NORD
};

const ANGLE_TO_ORIENTATION = {
  0: 0,      // EST → colonne gauche
  90: 90,    // SUD → ligne du bas
  180: 9,    // OUEST → colonne droite
  270: 99    // NORD → ligne du haut
};

const DIRECTION_VECTORS = {
  0: { dx: 1, dy: 0 },    // EST
  90: { dx: 0, dy: 1 },   // SUD
  180: { dx: -1, dy: 0 }, // OUEST
  270: { dx: 0, dy: -1 }  // NORD
};

const PIECE_TYPES = {
  SPHINX: 'sphinx',
  PHARAOH: 'pharaoh',
  ANUBIS: 'anubis',
  PYRAMID: 'pyramid',
  SCARAB: 'scarab'
};

const VALID_ORIENTATIONS = {
  sphinx: [0, 90, 180, 270],      // Angles internes uniquement
  pharaoh: [],                     // Pas d'orientation
  anubis: [0, 9, 90, 99],         // Toutes orientations
  pyramid: [0, 9, 90, 99],        // Toutes orientations
  scarab: [0, 9]                  // Uniquement colonnes
};

const ACTION_TYPES = {
  ROTATE: 'ROTATE',
  MOVE: 'MOVE',
  PLACE: 'PLACE',
  EXCHANGE: 'EXCHANGE'
};

// Directions de rotation
const ROTATION_DIRECTIONS = {
  CLOCKWISE: 'CLOCKWISE',
  ANTICLOCKWISE: 'ANTICLOCKWISE'
};

// CELLULES SPÉCIALES
const SPECIAL_CELLS = {
  RESERVE_P1: -1,    // Réserve joueur 1
  RESERVE_P2: -2     // Réserve joueur 2
};

// CONFIGURATION JEU
const BOARD_SIZE = 10;
const TOTAL_CELLS = 100; // 0-99

const GAME_CONFIG = {
  MAX_TURNS: 100,
  INITIAL_PYRAMIDS: 7,
  SCARAB_SWAP_COOLDOWN: 4,
  
  AI_SETUP_TIMEOUT: 1000,
  AI_MOVE_TIMEOUT: 250
};

module.exports = {
  // Orientations
  ORIENTATIONS,
  ORIENTATION_TO_ANGLE,
  ANGLE_TO_ORIENTATION,
  DIRECTION_VECTORS,
  VALID_ORIENTATIONS,
  
  // Pièces
  PIECE_TYPES,
  
  // Actions
  ACTION_TYPES,
  ROTATION_DIRECTIONS,
  
  // Cellules
  SPECIAL_CELLS,
  
  // Configuration
  BOARD_SIZE,
  TOTAL_CELLS,
  GAME_CONFIG
};