export class UIManager {
  constructor(renderer, gameApi = null) {
    this.renderer = renderer;
    this.gameApi = gameApi;
    
    this.selectedPiece = null;
    this.validMoves = [];
    this.validActions = [];
    this.gameState = null;
    this.mode = null; // 'local', 'ai', 'online'
    this.isPlayerTurn = true;
    this.isProcessing = false;
    this.currentMode = 'SELECT'; // SELECT | MOVE | PLACE_PYRAMID
    this.selectedOrientation = 0;
    this.lastPlayerAction = null;

    this.setupEventListeners();
  }

  syncFromState(state) {
    this.mode = state.mode;
    console.log('[UI] Game mode set to:', this.mode);
  }

  setupEventListeners() {
    const canvas = this.renderer.canvas;
    canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.updateActionButtons();
  }

  async handleCanvasClick(event) {
    if (this.isProcessing) {
      console.log('⏸️ Action processing or not your turn');
      return;
    }

    const rect = this.renderer.canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / this.renderer.cellSize);
    const y = Math.floor((event.clientY - rect.top) / this.renderer.cellSize);

    console.log(`[UI] Click at (${x}, ${y}), mode: ${this.currentMode}`);

    if (this.currentMode === 'PLACE') {
      const isValidPlacement = this.validMoves.some(m => m.x === x && m.y === y);
      if (isValidPlacement) {
        await this.executePlacePyramid(x, y);
        return;
      } else {
        this.showHint('❌ Invalid placement location');
        this.cancelPlacementMode();
        return;
      }
    }

    if (this.currentMode === 'MOVE' && this.selectedPiece) {
      const isValidMove = this.validMoves.some(m => m.x === x && m.y === y);
      if (isValidMove) {
        await this.executeMove(x, y);
        return;
      } else {
        this.resetSelection();
        return;
      }
    }

    await this.selectPiece(x, y);
  }

  async selectPiece(x, y) {
    if (!this.gameApi) {
      this.showHint('❌ No game API connected');
      return;
    }

    try {
      this.gameState = await this.gameApi.getGameState();

      const piece = this.gameState.gameState.board.pieces.find(p => p.x === x && p.y === y);

      if (!piece) {
        this.showHint('Click on your piece to select it');
        this.resetSelection();
        return;
      }

      if (piece.player !== this.gameState.gameState.turn) {
        this.showHint('❌ Not your piece!');
        return;
      }

      this.selectedPiece = piece;
      this.currentMode = 'SELECT';
      this.renderer.selectCell(x, y);

      this.validActions = await this.gameApi.getValidActions(x, y);

      if (this.validActions.length === 0) {
        this.showHint('⚠️ No valid actions for this piece');
        this.resetSelection();
        return;
      }

      const canMove = this.validActions.some(a => a.type === 'MOVE');
      if (canMove) {
        this.validMoves = await this.gameApi.getValidMoves(x, y);
        this.renderer.highlightCells(this.validMoves, 'rgba(34, 197, 94, 0.5)');
        this.currentMode = 'MOVE';
      } else {
        this.validMoves = [];
      }

      this.displayContextualActions(piece);

      this.showHint(`✔ ${piece.type} selected. ${canMove ? 'Click highlighted cell to move or ' : ''}Choose action below.`);
      this.renderer.render();

    } catch (error) {
      this.showHint(`❌ Error: ${error.message}`);
    }
  }

  displayContextualActions(piece) {
    const player = this.gameState.gameState.turn;
    const actionsContainer = document.getElementById(`p${player}-actions`);
    
    if (!actionsContainer) {
      console.error('Actions container not found');
      return;
    }

    actionsContainer.innerHTML = '';
    actionsContainer.style.display = 'block';

    const cancelBtn = this.createActionButton('✖ Cancel', 'cancel');
    cancelBtn.addEventListener('click', () => this.resetSelection());
    actionsContainer.appendChild(cancelBtn);

    this.validActions.forEach(action => {
      if (action.type === 'ROTATE') {
        const btn = this.createActionButton(
          action.direction === 'clockwise' ? '↻ Rotate Right' : '↺ Rotate Left',
          'ROTATE'
        );
        btn.addEventListener('click', () => this.executeRotation(action.direction));
        actionsContainer.appendChild(btn);
      }
      
      if (action.type === 'EXCHANGE') {
        const cooldown = action.cooldown || 0;
        const label = `🔄 Swap ${action.targetPiece.type}${cooldown > 0 ? ` (${cooldown})` : ''}`;
        const btn = this.createActionButton(label, 'EXCHANGE');
        btn.disabled = cooldown > 0;
        btn.addEventListener('click', () => this.executeSwap(action.targetPiece));
        actionsContainer.appendChild(btn);
      }
    });
  }

  createActionButton(label, className = '') {
    const btn = document.createElement('button');
    btn.className = `contextual-action-btn ${className}`;
    btn.textContent = label;
    return btn;
  }

  async activatePlacementMode() {
    if (!this.isPlayerTurn || this.isProcessing) return;

    const player = this.gameState.gameState.turn;
    const reserve = this.gameState.gameState.reserves[player];

    if (reserve <= 0) {
      this.showHint('❌ No pyramids in reserve');
      return;
    }

    this.isProcessing = true;

    this.validMoves = await this.gameApi.getValidPlacements();

    if (this.validMoves.length === 0) {
      this.showHint('❌ No valid placement locations');
      this.isProcessing = false;
      return;
    }

    this.currentMode = 'PLACE';
    this.selectedPiece = null;
    this.selectedOrientation = 0;
    this.renderer.clearHighlights();
    this.renderer.highlightCells(this.validMoves, 'rgba(250, 204, 21, 0.6)');
    this.showHint('🔺 Choose orientation, then click on a yellow cell');
    this.renderer.render();
    this.isProcessing = false;

    this.showOrientationSelector();
  }

  showOrientationSelector() {
    const player = this.gameState.gameState.turn;
    const actionsContainer = document.getElementById(`p${player}-actions`);
    
    if (!actionsContainer) return;

    actionsContainer.innerHTML = '';
    actionsContainer.style.display = 'block';

    const title = document.createElement('div');
    title.className = 'orientation-title';
    title.textContent = 'Mirror Direction:';
    actionsContainer.appendChild(title);

    const orientations = [
      { angle: 0, icon: '→', label: 'Right & Up' },
      { angle: 90, icon: '↓', label: 'Right & Down' },
      { angle: 180, icon: '←', label: 'Left & Down' },
      { angle: 270, icon: '↑', label: 'Left & Up' }
    ];

    const orientationContainer = document.createElement('div');
    orientationContainer.className = 'orientation-buttons';
    
    orientations.forEach(({ angle, icon, label }) => {
      const btn = document.createElement('button');
      btn.className = `orientation-btn ${this.selectedOrientation === angle ? 'selected' : ''}`;
      btn.innerHTML = `<span class="direction-icon">${icon}</span><span class="direction-label">${label}</span>`;
      btn.addEventListener('click', () => {
        this.selectedOrientation = angle;
        this.showOrientationSelector();
      });
      orientationContainer.appendChild(btn);
    });

    actionsContainer.appendChild(orientationContainer);

    const cancelBtn = this.createActionButton('✖ Cancel Placement', 'cancel');
    cancelBtn.addEventListener('click', () => this.cancelPlacementMode());
    actionsContainer.appendChild(cancelBtn);
  }

  cancelPlacementMode() {
    this.currentMode = 'SELECT';
    this.resetSelection();
  }

  async executeRotation(direction) {
    if (!this.selectedPiece) return;

    const action = {
      type: 'ROTATE',
      player: this.gameState.gameState.turn,
      params: {
        at: {
          x: this.selectedPiece.x,
          y: this.selectedPiece.y
        },
        clockwise: direction === 'clockwise'
      }
    };

    await this.finalizeAction(action);
  }

  async executeMove(toX, toY) {
    if (!this.selectedPiece) return;

    const action = {
      type: 'MOVE',
      player: this.gameState.gameState.turn,
      params: {
        from: {
          x: this.selectedPiece.x,
          y: this.selectedPiece.y
        },
        toX,
        toY
      }
    };

    await this.finalizeAction(action);
  }

  async executePlacePyramid(x, y) {
    const action = {
      type: 'PLACE',
      player: this.gameState.gameState.turn,
      params: {
        x,
        y,
        orientation: this.selectedOrientation || 0,
        player: this.gameState.gameState.turn
      }
    };

    await this.finalizeAction(action);
  }

  async executeSwap(targetPiece) {
    const action = {
      type: 'EXCHANGE',
      player: this.gameState.gameState.turn,
      params: {
        from: { x: this.selectedPiece.x, y: this.selectedPiece.y },
        to: { x: targetPiece.x, y: targetPiece.y }
      }
    };

    await this.finalizeAction(action);
  }

  async finalizeAction(action) {
    this.isProcessing = true;
    this.lastPlayerAction = action;

    try {
        const response = await this.gameApi.executeAction(action);

        if (!response.success) {
            this.showHint(`❌ ${response.error || 'Action failed'}`);
            this.isProcessing = false;
            return;
        }

        this.gameState = response.state || await this.gameApi.getGameState();

        if (response.lastLaserEvents && response.lastLaserEvents.length > 0) {
            this.renderer.highlightLaserPath(response.lastLaserEvents);
            this.renderer.render(this.gameState);
            await new Promise(r => setTimeout(r, 1500));
            
            this.renderer.clearHighlights();
        }

        this.resetSelection();

        if (this.gameState.gameState.gameOver) {
            this.showGameOverModal(this.gameState.gameState.winner);
            return;
        }

        const currentTurn = this.gameState.gameState.turn;
        
        if (this.mode === 'ai') {
            this.isPlayerTurn = currentTurn === 1;
            
            if (!this.isPlayerTurn) {
                this.showHint('🤖 AI is thinking...');
                this.renderer.render(this.gameState);
                this.updateActionButtons();
                
                // Petit délai pour que l'UI se mette à jour
                await new Promise(r => setTimeout(r, 100));
                
                await this.handleAITurn();
            } else {
                this.showHint('Your turn - Select a piece');
            }
        } else {
            this.showHint(`Player ${currentTurn}'s turn - Select a piece`);
        }

    } catch (error) {
        this.showHint(`❌ Error: ${error.message}`);
        this.isProcessing = false;
    } finally {
        this.isProcessing = false;
        this.renderer.render(this.gameState);
        this.updateActionButtons();
    }
}

async handleAITurn() {
    if (this.isPlayerTurn) return;
    
    this.isProcessing = true;
    
    try {
        const aiMove = await this.gameApi.getAIMove(
            this.gameState.gameState,
            this.lastPlayerAction
        );
        
        console.log('[AI] Move received:', aiMove);
        
        const response = await this.gameApi.executeAction(aiMove);

        if (!response.success) {
            this.showHint(`❌ AI error: ${response.error}`);
            this.isProcessing = false;
            return;
        }

        this.gameState = response.state || await this.gameApi.getGameState();
        await this.updateDisplay();

        if (response.lastLaserEvents && response.lastLaserEvents.length > 0) {
            this.renderer.highlightLaserPath(response.lastLaserEvents);
            this.renderer.render(this.gameState);
            await new Promise(r => setTimeout(r, 1500));
            
            this.renderer.clearHighlights();
        }

        if (this.gameState.gameState.gameOver) {
            this.showGameOverModal(this.gameState.gameState.winner);
            return;
        }

        this.isPlayerTurn = true;
        this.showHint('✅ Your turn!');

    } catch (error) {
        this.showHint(`❌ AI error: ${error.message}`);
        console.error('[AI] Error:', error);
    } finally {
        this.isProcessing = false;
        this.renderer.render(this.gameState);
        this.updateActionButtons();
    }
  }

  showGameOverModal(winner) {
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.style.cssText = `
      background: linear-gradient(145deg, #2a1810, #0f0805);
      border: 3px solid #d4af37;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 0 60px rgba(212, 175, 55, 0.6);
      animation: slideIn 0.5s ease-out;
    `;

    const title = document.createElement('h2');
    title.style.cssText = `
      color: #facc15;
      font-size: 48px;
      font-family: 'Cinzel', serif;
      margin-bottom: 20px;
      text-shadow: 0 0 20px rgba(250, 204, 21, 0.8);
    `;

    if (this.mode === 'ai') {
      if (winner === 1) {
        title.textContent = '🏆 YOU WIN! 🏆';
      } else if (winner === 2) {
        title.textContent = '💀 YOU LOSE! 💀';
      } else {
        title.textContent = '🤝 DRAW! 🤝';
      }
    } else {
      // Local mode
      title.textContent = `🏆 PLAYER ${winner} WINS! 🏆`;
    }

    const message = document.createElement('p');
    message.style.cssText = `
      color: #fef3c7;
      font-size: 18px;
      font-family: 'Cinzel', serif;
      margin-bottom: 40px;
      line-height: 1.6;
    `;

    if (this.mode === 'ai') {
      if (winner === 1) {
        message.textContent = 'Congratulations! You have defeated the AI!';
      } else if (winner === 2) {
        message.textContent = 'The AI has defeated you. Try again!';
      } else {
        message.textContent = 'Both Pharaohs were destroyed.';
      }
    } else {
      message.textContent = 'Congratulations on your victory!';
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 20px;
      justify-content: center;
    `;

    const restartBtn = document.createElement('button');
    restartBtn.className = 'btn-primary';
    restartBtn.textContent = '🎮 Play Again';
    restartBtn.style.cssText = `
      padding: 15px 40px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    restartBtn.addEventListener('click', () => {
      location.reload();
    });

    const homeBtn = document.createElement('button');
    homeBtn.className = 'btn-primary';
    homeBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
    homeBtn.textContent = '🏠 Home';
    homeBtn.style.cssText = `
      padding: 15px 40px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    homeBtn.addEventListener('click', () => {
      window.location.href = '/index.html';
    });

    buttonContainer.appendChild(restartBtn);
    buttonContainer.appendChild(homeBtn);

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(buttonContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.isProcessing = true;
    this.isPlayerTurn = false;
  }

  resetSelection() {
    this.selectedPiece = null;
    this.validMoves = [];
    this.validActions = [];
    this.currentMode = 'SELECT';

    [1, 2].forEach(player => {
      const container = document.getElementById(`p${player}-actions`);
      if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
      }
    });

    this.renderer.clearHighlights();
    this.renderer.render();
    this.showHint('Select a piece or place a pyramid');
    this.updateActionButtons();
  }

  updateActionButtons() {
    if (!this.gameState) return;

    const player = this.gameState.gameState.turn;
    const reserve = this.gameState.gameState.reserves[player];
    
    const placePyramidBtn = document.getElementById(`p${player}-place-pyramid-btn`);
    
    if (placePyramidBtn) {
      if (reserve > 0 && this.isPlayerTurn && !this.isProcessing) {
        placePyramidBtn.style.display = 'block';
        placePyramidBtn.disabled = false;
        placePyramidBtn.onclick = () => this.activatePlacementMode();
      } else {
        placePyramidBtn.style.display = 'none';
      }
    }
  }

  showHint(message) {
    const hint = document.getElementById('actionHint');
    if (hint) {
      hint.textContent = message;
    }
    console.log('[HINT]', message);
  }

  async updateDisplay() {
    try {
      if (!this.gameApi) {
        console.warn('[UI] No game API connected');
        return;
      }

      this.gameState = await this.gameApi.getGameState();
      this.renderer.render(this.gameState);

      const p1 = document.getElementById('p1-reserve');
      const p2 = document.getElementById('p2-reserve');
      if (p1) p1.textContent = this.gameState.gameState.reserves?.[1] || 7;
      if (p2) p2.textContent = this.gameState.gameState.reserves?.[2] || 7;

      const indicator = document.getElementById('turnIndicator');
      if (indicator) {
        if (this.mode === 'ai') {
          indicator.textContent = this.gameState.gameState.turn === 1 ? 'Your Turn' : 'AI Turn';
        } else {
          indicator.textContent = `Player ${this.gameState.gameState.turn}'s Turn`;
        }
      }

      this.updateActionButtons();

    } catch (error) {
      console.error('[UI] Error updating display:', error);
    }
  }
}