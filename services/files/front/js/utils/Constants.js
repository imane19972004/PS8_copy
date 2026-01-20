export const BOARD_SIZE = 10;
export const CELL_SIZE = 60;

export const ORIENTATIONS = {
  EAST: 0,
  SOUTH: 90,
  WEST: 180,
  NORTH: 270
};

export const DIRECTION_VECTORS = {
  0: { dx: 1, dy: 0 },
  90: { dx: 0, dy: 1 },
  180: { dx: -1, dy: 0 },
  270: { dx: 0, dy: -1 }
};

export const PIECE_TYPES = {
  SPHINX: 'sphinx',
  PHARAOH: 'pharaoh',
  ANUBIS: 'anubis',
  PYRAMID: 'pyramid',
  SCARAB: 'scarab'
};

export const GAME_CONFIG = {
  MAX_TURNS: 100,
  INITIAL_PYRAMIDS: 7,
  SCARAB_SWAP_COOLDOWN: 4
};

export const ACTION_TYPES = {
  ROTATE: 'rotate',
  MOVE: 'move',
  PLACE_PYRAMID: 'placePyramid',
  SWAP_SCARAB: 'swapScarab'
};