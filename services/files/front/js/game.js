// Game state
const gameState = {
    pieces: [],
    currentPlayer: 1,
    selectedPiece: null,
    currentAction: null,
    gameOver: false,
    turnCount: 0,
    players: {
        1: { pyramidReserve: 7, swapCooldowns: {sphinx: 0, pharaoh: 0} },
        2: { pyramidReserve: 7, swapCooldowns: {sphinx: 0, pharaoh: 0} }
    }
};

// Initialize game
function initGame() {
    addLog('Initializing game...');
    
    // Clear pieces
    gameState.pieces = [];
    
    // Player 1 pieces (top)
    const p1SphinxCol = Math.floor(Math.random() * BOARD_SIZE);
    const p1SphinxOrientation = p1SphinxCol < 5 ? 0 : 180; // Face right or left
    
    gameState.pieces.push(new Sphinx(1, p1SphinxCol, 0, p1SphinxOrientation));
    
    // Player 1 Pharaoh (line 2, random but not in forbidden columns)
    let p1PharaohCol;
    do {
        p1PharaohCol = Math.floor(Math.random() * (BOARD_SIZE - 2)) + 1;
    } while (p1PharaohCol === p1SphinxCol);
    
    gameState.pieces.push(new Pharaoh(1, p1PharaohCol, 2));
    
    // Player 1 Anubis
    gameState.pieces.push(new Anubis(1, p1PharaohCol, 4, 180)); // Line 4, facing down
    
    // Player 1 Scarab (line 3, random)
    const p1ScarabCol = Math.floor(Math.random() * BOARD_SIZE);
    gameState.pieces.push(new Scarab(1, p1ScarabCol, 3, Math.floor(Math.random() * 4) * 90));
    
    // Player 2 pieces (symmetry)
    const p2SphinxCol = BOARD_SIZE - 1 - p1SphinxCol;
    const p2SphinxOrientation = (p1SphinxOrientation + 180) % 360;
    
    gameState.pieces.push(new Sphinx(2, p2SphinxCol, BOARD_SIZE - 1, p2SphinxOrientation));
    
    const p2PharaohCol = BOARD_SIZE - 1 - p1PharaohCol;
    gameState.pieces.push(new Pharaoh(2, p2PharaohCol, BOARD_SIZE - 3));
    
    gameState.pieces.push(new Anubis(2, p2PharaohCol, BOARD_SIZE - 5, 0)); // Facing up
    
    const p2ScarabCol = BOARD_SIZE - 1 - p1ScarabCol;
    gameState.pieces.push(new Scarab(2, p2ScarabCol, BOARD_SIZE - 4, Math.floor(Math.random() * 4) * 90));
    
    // Player 2 Anubis on P1 Sphinx column
    gameState.pieces.push(new Anubis(2, p1SphinxCol, BOARD_SIZE - 3, 0));
    
    // Player 1 Anubis on P2 Sphinx column  
    gameState.pieces.push(new Anubis(1, p2SphinxCol, 2, 180));
    
    addLog('Game initialized! Player 1 starts.');
    
    // Initial render
    renderBoard(gameState);
    updatePlayerInfo(gameState);
}

// Get piece at position
function getPieceAt(x, y) {
    return gameState.pieces.find(p => p.x === x && p.y === y);
}

// Handle canvas click
function handleCanvasClick(event) {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
    
    const clickedPiece = getPieceAt(x, y);
    
    // Handle different actions
    if (gameState.currentAction === 'rotate') {
        handleRotateClick(clickedPiece);
    } else if (gameState.currentAction === 'move') {
        handleMoveClick(x, y, clickedPiece);
    } else if (gameState.currentAction === 'place') {
        handlePlaceClick(x, y);
    } else if (gameState.currentAction === 'swap') {
        handleSwapClick(clickedPiece);
    } else {
        // Just select piece
        if (clickedPiece && clickedPiece.player === gameState.currentPlayer) {
            gameState.selectedPiece = clickedPiece;
            addLog(`Selected ${clickedPiece.type}`);
            renderBoard(gameState);
        }
    }
}

// Handle rotate action
function handleRotateClick(piece) {
    if (!piece || piece.player !== gameState.currentPlayer) {
        addLog('Select your own piece to rotate');
        return;
    }
    
    if (piece.type === 'pharaoh') {
        addLog('Pharaoh cannot be rotated');
        return;
    }
    
    piece.rotate(true);
    addLog(`Rotated ${piece.type} 90° clockwise`);
    
    endTurn();
}

// Handle move action
function handleMoveClick(x, y, clickedPiece) {
    if (!gameState.selectedPiece) {
        if (clickedPiece && clickedPiece.player === gameState.currentPlayer && clickedPiece.canMove()) {
            gameState.selectedPiece = clickedPiece;
            addLog(`Selected ${clickedPiece.type} - Click destination`);
            renderBoard(gameState);
        } else {
            addLog('Select a movable piece first');
        }
        return;
    }
    
    // Check if move is valid
    const moves = getPossibleMoves(gameState.selectedPiece, gameState);
    const validMove = moves.find(m => m.x === x && m.y === y);
    
    if (validMove) {
        addLog(`Moved ${gameState.selectedPiece.type} to (${x}, ${y})`);
        gameState.selectedPiece.x = x;
        gameState.selectedPiece.y = y;
        endTurn();
    } else {
        addLog('Invalid move');
    }
}

// Handle place pyramid
function handlePlaceClick(x, y) {
    const player = gameState.currentPlayer;
    
    if (gameState.players[player].pyramidReserve <= 0) {
        addLog('No pyramids left in reserve');
        resetAction();
        return;
    }
    
    // Check if cell is empty
    if (getPieceAt(x, y)) {
        addLog('Cell is occupied');
        return;
    }
    
    // Check adjacency to Pharaoh or Sphinx
    const adjacentToPharaohOrSphinx = gameState.pieces.some(p => {
        if (p.type !== 'pharaoh' && p.type !== 'sphinx') return false;
        const dx = Math.abs(p.x - x);
        const dy = Math.abs(p.y - y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    });
    
    if (adjacentToPharaohOrSphinx) {
        addLog('Cannot place pyramid adjacent to Pharaoh or Sphinx');
        return;
    }
    
    // Place pyramid
    const pyramid = new Pyramid(player, x, y, Math.floor(Math.random() * 4) * 90);
    gameState.pieces.push(pyramid);
    gameState.players[player].pyramidReserve--;
    
    addLog(`Placed pyramid at (${x}, ${y})`);
    endTurn();
}

// Handle swap scarab
function handleSwapClick(piece) {
    if (!gameState.selectedPiece) {
        // Select scarab
        if (piece && piece.type === 'scarab' && piece.player === gameState.currentPlayer) {
            gameState.selectedPiece = piece;
            addLog('Scarab selected - Click Sphinx or Pharaoh to swap');
            renderBoard(gameState);
        } else {
            addLog('Select your Scarab first');
        }
        return;
    }
    
    // Swap with target
    if (!piece || piece.player !== gameState.currentPlayer) {
        addLog('Select your own Sphinx or Pharaoh');
        return;
    }
    
    if (piece.type !== 'sphinx' && piece.type !== 'pharaoh') {
        addLog('Can only swap with Sphinx or Pharaoh');
        return;
    }
    
    const scarab = gameState.selectedPiece;
    
    // Check cooldown
    if (!scarab.canSwapWith(piece.type)) {
        addLog(`Swap with ${piece.type} on cooldown`);
        return;
    }
    
    // Perform swap
    const tempX = scarab.x;
    const tempY = scarab.y;
    scarab.x = piece.x;
    scarab.y = piece.y;
    piece.x = tempX;
    piece.y = tempY;
    
    // Set cooldown
    scarab.swapCooldowns[piece.type] = 4;
    
    addLog(`Swapped Scarab with ${piece.type}`);
    
    // Sphinx doesn't fire if swapped
    if (piece.type === 'sphinx') {
        gameState.sphinxSkipFire = true;
    }
    
    endTurn();
}

// Fire laser
function fireLaser() {
    const sphinx = gameState.pieces.find(p => 
        p.type === 'sphinx' && p.player === gameState.currentPlayer
    );
    
    if (!sphinx || gameState.sphinxSkipFire) {
        gameState.sphinxSkipFire = false;
        return;
    }
    
    addLog('Firing laser...');
    
    const path = [];
    let x = sphinx.x;
    let y = sphinx.y;
    let direction = sphinx.orientation;
    
    path.push({x, y});
    
    // Simulate laser
    const dirMap = {
        0: {dx: 1, dy: 0},    // East
        90: {dx: 0, dy: 1},   // South
        180: {dx: -1, dy: 0}, // West
        270: {dx: 0, dy: -1}  // North
    };
    
    let steps = 0;
    const maxSteps = 100;
    
    while (steps < maxSteps) {
        const dir = dirMap[direction];
        x += dir.dx;
        y += dir.dy;
        
        // Check bounds
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
            addLog('Laser exited the board');
            break;
        }
        
        path.push({x, y});
        
        const hitPiece = getPieceAt(x, y);
        
        if (hitPiece) {
            if (hitPiece.type === 'pyramid') {
                // Reflect
                const newDir = hitPiece.reflectLaser(direction);
                if (newDir !== undefined) {
                    direction = newDir;
                    addLog(`Laser reflected by pyramid`);
                } else {
                    // Hit non-reflective side
                    destroyPiece(hitPiece);
                    break;
                }
            } else if (hitPiece.type === 'scarab') {
                // Always reflects
                direction = hitPiece.reflectLaser(direction);
                addLog('Laser reflected by scarab');
            } else if (hitPiece.type === 'anubis') {
                // Check shield
                if (hitPiece.isShieldFacing(direction)) {
                    addLog('Laser blocked by Anubis shield');
                    break;
                } else {
                    destroyPiece(hitPiece);
                    break;
                }
            } else if (hitPiece.type === 'sphinx') {
                addLog('Laser blocked by Sphinx');
                break;
            } else if (hitPiece.type === 'pharaoh') {
                destroyPiece(hitPiece);
                endGame(gameState.currentPlayer);
                break;
            }
        }
        
        steps++;
    }
    
    // Animate laser
    drawLaserBeam(path);
    
    setTimeout(() => {
        renderBoard(gameState);
    }, 1000);
}

// Destroy piece
function destroyPiece(piece) {
    addLog(`${piece.type} destroyed!`);
    
    // If pyramid, add to opponent's reserve
    if (piece.type === 'pyramid') {
        const opponent = piece.player === 1 ? 2 : 1;
        setTimeout(() => {
            gameState.players[opponent].pyramidReserve++;
            addLog(`Pyramid added to Player ${opponent}'s reserve`);
            updatePlayerInfo(gameState);
        }, 1000);
    }
    
    // Remove piece
    const index = gameState.pieces.indexOf(piece);
    if (index > -1) {
        gameState.pieces.splice(index, 1);
    }
}

// End turn
function endTurn() {
    // Fire laser
    fireLaser();
    
    // Update cooldowns
    gameState.pieces.forEach(p => {
        if (p.type === 'scarab' && p.player === gameState.currentPlayer) {
            p.updateCooldowns();
        }
    });
    
    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.turnCount++;
    
    // Check turn limit
    if (gameState.turnCount >= 100) {
        endGame('draw');
        return;
    }
    
    resetAction();
    renderBoard(gameState);
    updatePlayerInfo(gameState);
    
    addLog(`--- Player ${gameState.currentPlayer}'s turn ---`);
}

// Reset action
function resetAction() {
    gameState.currentAction = null;
    gameState.selectedPiece = null;
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateActionHint('Select an action');
}

// End game
function endGame(winner) {
    gameState.gameOver = true;
    showGameOver(winner);
}

// Button handlers
document.getElementById('rotateBtn').addEventListener('click', () => {
    gameState.currentAction = 'rotate';
    gameState.selectedPiece = null;
    updateActionHint('Click a piece to rotate it 90°');
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('rotateBtn').classList.add('selected');
});

document.getElementById('moveBtn').addEventListener('click', () => {
    gameState.currentAction = 'move';
    gameState.selectedPiece = null;
    updateActionHint('Select a piece, then click where to move');
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('moveBtn').classList.add('selected');
});

document.getElementById('placePyramidBtn').addEventListener('click', () => {
    gameState.currentAction = 'place';
    gameState.selectedPiece = null;
    updateActionHint('Click an empty cell to place pyramid');
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('placePyramidBtn').classList.add('selected');
});

document.getElementById('swapScarabBtn').addEventListener('click', () => {
    gameState.currentAction = 'swap';
    gameState.selectedPiece = null;
    updateActionHint('Click Scarab, then Sphinx/Pharaoh to swap');
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('swapScarabBtn').classList.add('selected');
});

// Canvas click handler
canvas.addEventListener('click', handleCanvasClick);

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initGame();
});