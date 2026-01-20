import { ACTION_TYPES } from '../utils/Constants.js';

export default class UIController {
  constructor(gameEngine, renderer) {
    this.engine = gameEngine;
    this.renderer = renderer;
    this.logger = gameEngine.logger;

    this.selectedPiece = null;
    this.currentAction = null;
    this.selectedReservePyramid = false;

    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    // Canvas click
    this.renderer.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

    // Action buttons
    const buttons = {
      rotateBtn: ACTION_TYPES.ROTATE,
      moveBtn: ACTION_TYPES.MOVE,
      placePyramidBtn: ACTION_TYPES.PLACE_PYRAMID,
      swapScarabBtn: ACTION_TYPES.SWAP_SCARAB
    };

    Object.entries(buttons).forEach(([id, actionType]) => {
      document.getElementById(id).addEventListener('click', () => this.handleActionButton(actionType));
    });

    // Reserve clicks
    this.setupReserveListeners();
  }

  setupReserveListeners() {
    const p1Reserve = document.getElementById('p1-reserve-display');
    const p2Reserve = document.getElementById('p2-reserve-display');

    [p1Reserve, p2Reserve].forEach((reserve, player) => {
      reserve.addEventListener('click', (e) => {
        if (e.target.classList.contains('pyramid-slot') && !e.target.classList.contains('empty')) {
          const currentPlayer = this.engine.turnManager.getCurrentPlayer();
          if (player + 1 === currentPlayer) {
            this.currentAction = ACTION_TYPES.PLACE_PYRAMID;
            this.selectedReservePyramid = true;
            this.selectedPiece = null;

            // Highlight valid placements
            const validPlacements = this.renderer.getValidPlacements();
            this.renderer.highlightCells(validPlacements, 'rgba(34, 197, 94, 0.4)');

            this.showActionHint('Click on the board to place pyramid');
            this.updateActionButtonStates();

            // Highlight selected pyramid
            document.querySelectorAll('.pyramid-slot').forEach(slot => slot.classList.remove('selected'));
            e.target.classList.add('selected');
          }
        }
      });
    });
  }

  handleActionButton(actionType) {
    this.currentAction = actionType;
    this.selectedPiece = null;
    this.selectedReservePyramid = false;
    this.renderer.clearHighlights();

    this.showActionHint(`Action selected: ${actionType}. Select a piece.`);
    this.updateActionButtonStates();
  }

  handleCanvasClick(event) {
    const rect = this.renderer.canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / this.renderer.cellSize);
    const y = Math.floor((event.clientY - rect.top) / this.renderer.cellSize);

    const piece = this.engine.board.getPieceAt(x, y);

    // If placing pyramid from reserve
    if (this.selectedReservePyramid && this.currentAction === ACTION_TYPES.PLACE_PYRAMID) {
      this.executeAction(x, y);
      return;
    }

    // Select piece
    if (!this.selectedPiece) {
      if (!piece) {
        this.showActionHint('Select a piece first');
        return;
      }

      if (piece.player !== this.engine.turnManager.getCurrentPlayer()) {
        this.showActionHint('Not your piece!');
        return;
      }

      this.selectedPiece = piece;
      this.renderer.selectCell(x, y);
      this.showActionHint(`Selected ${piece.type}. Choose action and target.`);

      // Highlight valid moves if MOVE action is selected
      if (this.currentAction === ACTION_TYPES.MOVE && piece.canMove()) {
        const validMoves = this.renderer.getValidMoves(piece);
        this.renderer.highlightCells(validMoves, 'rgba(34, 197, 94, 0.4)');
      }

      this.updateUI();
      return;
    }

    // Execute action
    this.executeAction(x, y);
  }

  executeAction(x, y) {
    let action = null;
    const currentPlayer = this.engine.turnManager.getCurrentPlayer();

    switch (this.currentAction) {
      case ACTION_TYPES.ROTATE:
        if (!this.selectedPiece) {
          this.showActionHint('Select a piece first');
          return;
        }
        action = {
          type: ACTION_TYPES.ROTATE,
          player: currentPlayer,
          params: { piece: this.selectedPiece }
        };
        break;

      case ACTION_TYPES.MOVE:
        if (!this.selectedPiece) {
          this.showActionHint('Select a piece first');
          return;
        }
        action = {
          type: ACTION_TYPES.MOVE,
          player: currentPlayer,
          params: { piece: this.selectedPiece, toX: x, toY: y }
        };
        break;

      case ACTION_TYPES.PLACE_PYRAMID:
        action = {
          type: ACTION_TYPES.PLACE_PYRAMID,
          player: currentPlayer,
          params: { x, y, player: currentPlayer, orientation: 0 }
        };
        break;

      case ACTION_TYPES.SWAP_SCARAB:
        if (!this.selectedPiece) {
          this.showActionHint('Select Scarab first');
          return;
        }
        const target = this.engine.board.getPieceAt(x, y);
        if (!target) {
          this.showActionHint('Select a target piece');
          return;
        }
        action = {
          type: ACTION_TYPES.SWAP_SCARAB,
          player: currentPlayer,
          params: { scarab: this.selectedPiece, target }
        };
        break;

      default:
        this.showActionHint('Select an action first');
        return;
    }

    const result = this.engine.executeAction(action);

    if (result && !result.success) {
      this.showActionHint(result.error);
      return;
    }

    this.resetSelection();
    this.updateUI();
    
    // Animate laser
    setTimeout(() => {
      this.renderer.renderLaser();
    }, 100);

    setTimeout(() => {
      this.engine.lastLaserEvents = null;
      this.updateUI();
    }, 1500);
  }

  updateUI() {
    this.renderer.clear();
    this.renderer.renderBoard();
    this.renderer.renderPieces();

    // Update turn indicator
    document.getElementById('turnIndicator').textContent =
      `Player ${this.engine.turnManager.getCurrentPlayer()}'s Turn`;

    // Update reserves
    this.updateReserveDisplay(1);
    this.updateReserveDisplay(2);

    if (this.engine.gameOver) {
      this.showActionHint(`Game Over! ${this.engine.winner ? `Player ${this.engine.winner} wins!` : 'Draw!'}`);
    }
  }

  updateReserveDisplay(player) {
    const reserve = this.engine.turnManager.getReserve(player);
    document.getElementById(`p${player}-reserve`).textContent = reserve;

    const reserveDisplay = document.getElementById(`p${player}-reserve-display`);
    reserveDisplay.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const slot = document.createElement('div');
      slot.className = 'pyramid-slot';
      if (i >= reserve) {
        slot.classList.add('empty');
      }
      slot.textContent = '▲';
      reserveDisplay.appendChild(slot);
    }
  }

  showActionHint(message) {
    document.getElementById('actionHint').textContent = message;
  }

  updateActionButtonStates() {
    document.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('active'));
    
    const buttonMap = {
      [ACTION_TYPES.ROTATE]: 'rotateBtn',
      [ACTION_TYPES.MOVE]: 'moveBtn',
      [ACTION_TYPES.PLACE_PYRAMID]: 'placePyramidBtn',
      [ACTION_TYPES.SWAP_SCARAB]: 'swapScarabBtn'
    };

    if (this.currentAction && buttonMap[this.currentAction]) {
      document.getElementById(buttonMap[this.currentAction]).classList.add('active');
    }
  }

  resetSelection() {
    this.selectedPiece = null;
    this.currentAction = null;
    this.selectedReservePyramid = false;
    this.renderer.clearHighlights();
    this.updateActionButtonStates();
    document.querySelectorAll('.pyramid-slot').forEach(slot => slot.classList.remove('selected'));
    this.showActionHint('Select an action');
  }
}