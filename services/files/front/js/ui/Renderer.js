import { CELL_SIZE, PIECE_TYPES, BOARD_SIZE } from '../utils/Constants.js';

export default class Renderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.engine = engine;
    this.cellSize = CELL_SIZE;
    this.images = {};
    this.imagesLoaded = 0;
    this.totalImages = 5;
    this.highlightedCells = [];
    this.selectedCell = null;
    this.loadImages();
  }

  loadImages() {
    const imageFiles = {
      [PIECE_TYPES.SPHINX]: './media/Sphinx.jpg',
      [PIECE_TYPES.PHARAOH]: './media/Pharaoh.png',
      [PIECE_TYPES.ANUBIS]: './media/Anubis.jpg',
      [PIECE_TYPES.PYRAMID]: './media/Pyramid.png',
      [PIECE_TYPES.SCARAB]: './media/Scarab.jpg',
    };

    Object.keys(imageFiles).forEach(type => {
      const img = new Image();
      img.onload = () => {
        this.imagesLoaded++;
      };
      img.src = imageFiles[type];
      this.images[type] = img;
    });
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderBoard() {
    const ctx = this.ctx;

    // Draw cells with alternating colors (Egyptian style)
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = '#d4af37'; // Doré
        } else {
          ctx.fillStyle = '#1a0f08'; // Noir
        }
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;

    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CELL_SIZE * BOARD_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CELL_SIZE * BOARD_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw highlighted cells
    this.highlightedCells.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });

    // Draw selected cell
    if (this.selectedCell) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.selectedCell.x * CELL_SIZE + 2,
        this.selectedCell.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    }
  }

  renderPieces() {
    this.engine.board.getPieces().forEach(piece => {
      if (!piece.alive) return;
      this.drawPiece(piece);
    });
  }

  drawPiece(piece) {
  const x = piece.x * this.cellSize;
  const y = piece.y * this.cellSize;
  const ctx = this.ctx;

  ctx.save();
  ctx.translate(x + this.cellSize / 2, y + this.cellSize / 2);
  ctx.rotate((piece.orientation * Math.PI) / 180);
  ctx.translate(-this.cellSize / 2, -this.cellSize / 2);

  const img = this.images[piece.type];
  if (img && img.complete) {
      ctx.drawImage(img, 2, 2, this.cellSize - 4, this.cellSize - 4);
  } else {
    ctx.fillStyle = piece.player === 1 ? '#4A90E2' : '#F5A623';
    ctx.fillRect(5, 5, this.cellSize - 10, this.cellSize - 10);
  }

  // shields { top: bool, right: bool, bottom: bool, left: bool }
  const shields = piece.getShieldSides?.();
  if (shields) {
    ctx.strokeStyle = '#15ff00';
    ctx.lineWidth = 4;

    if (shields.top) {
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(this.cellSize - 4, 4);
      ctx.stroke();
    }
    if (shields.right) {
      ctx.beginPath();
      ctx.moveTo(this.cellSize - 4, 4);
      ctx.lineTo(this.cellSize - 4, this.cellSize - 4);
      ctx.stroke();
    }
    if (shields.bottom) {
      ctx.beginPath();
      ctx.moveTo(4, this.cellSize - 4);
      ctx.lineTo(this.cellSize - 4, this.cellSize - 4);
      ctx.stroke();
    }
    if (shields.left) {
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(4, this.cellSize - 4);
      ctx.stroke();
    }
  }

  // Indicateur joueur
  ctx.fillStyle = piece.player === 1 ? '#0077ff' : '#ffa410';
  ctx.beginPath();
  ctx.arc(this.cellSize - 10, 10, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}


  renderLaser() {
    if (!this.engine.lastLaserEvents || this.engine.lastLaserEvents.length === 0) return;

    const ctx = this.ctx;
    const events = this.engine.lastLaserEvents;

    // Create gradient for laser
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#ff4500');
    gradient.addColorStop(0.5, '#ff8c00');
    gradient.addColorStop(1, '#ffd700');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    events.forEach((e, i) => {
      const cx = e.x * this.cellSize + this.cellSize / 2;
      const cy = e.y * this.cellSize + this.cellSize / 2;

      if (i === 0) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    });

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  highlightCells(cells, color = 'rgba(34, 197, 94, 0.4)') {
    this.highlightedCells = cells.map(cell => ({ ...cell, color }));
  }

  selectCell(x, y) {
    this.selectedCell = { x, y };
  }

  clearHighlights() {
    this.highlightedCells = [];
    this.selectedCell = null;
  }

  getValidMoves(piece) {
    const moves = [];
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    directions.forEach(([dx, dy]) => {
      const newX = piece.x + dx;
      const newY = piece.y + dy;
      if (this.engine.board.isValidPosition(newX, newY) &&
        !this.engine.board.getPieceAt(newX, newY)) {
        moves.push({ x: newX, y: newY });
      }
    });

    return moves;
  }

  getValidPlacements() {
    const placements = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (!this.engine.board.getPieceAt(x, y)) {
          const adjacent = this.engine.board.getAdjacentPieces(x, y);
          const forbidden = adjacent.filter(p => p.type === 'pharaoh' || p.type === 'sphinx');
          if (forbidden.length === 0) {
            placements.push({ x, y });
          }
        }
      }
    }
    return placements;
  }
}