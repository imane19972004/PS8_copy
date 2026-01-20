import { BOARD_SIZE } from '../utils/Constants.js';

export default class Board {
    constructor() {
      this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    }

    isValidPosition(x, y) {
      return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
    }

    getPieceAt(x, y) {
      if (!this.isValidPosition(x, y)) return null;
      return this.grid[y][x];
    }

    getPieces() {
      return this.grid.flat().filter(Boolean);
    }

    addPiece(piece) {
      if (this.getPieceAt(piece.x, piece.y)) {
        throw new Error("Cell already occupied");
      }
      this.grid[piece.y][piece.x] = piece;
    }

    removePiece(piece) {
      this.grid[piece.y][piece.x] = null;
      piece.alive = false;
    }

    movePiece(piece, x, y) {
      if (!this.isValidPosition(x, y)) {
        throw new Error("Invalid move");
      }
      this.grid[piece.y][piece.x] = null;
      piece.x = x;
      piece.y = y;
      this.grid[y][x] = piece;
    }

    getAdjacentPieces(x, y) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      return dirs
        .map(([dx, dy]) => this.getPieceAt(x + dx, y + dy))
        .filter(Boolean);
    }

    clone() {
      const board = new Board();
      this.getPieces().forEach(p => {
        const copy = Object.assign(
          Object.create(Object.getPrototypeOf(p)),
          JSON.parse(JSON.stringify(p))
        );
        board.addPiece(copy);
      });
      return board;
    }
}