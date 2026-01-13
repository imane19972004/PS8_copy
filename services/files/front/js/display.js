// Canvas and rendering
const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');

const BOARD_SIZE = 10;
const CELL_SIZE = canvas.width / BOARD_SIZE;

// Draw the grid
function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Draw vertical lines
    for (let i = 0; i <= BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
}

// Draw a single piece
function drawPiece(piece) {
    const centerX = piece.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = piece.y * CELL_SIZE + CELL_SIZE / 2;
    
    // Draw circle background
    ctx.fillStyle = piece.getColor();
    ctx.beginPath();
    ctx.arc(centerX, centerY, CELL_SIZE * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw symbol
    ctx.fillStyle = 'white';
    ctx.font = `bold ${CELL_SIZE * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piece.getSymbol(), centerX, centerY);
    
    // Draw orientation indicator (small arrow)
    if (piece.type === 'sphinx' || piece.type === 'anubis' || piece.type === 'pyramid') {
        drawOrientationArrow(centerX, centerY, piece.orientation);
    }
}

// Draw orientation arrow
function drawOrientationArrow(x, y, orientation) {
    const arrowLength = CELL_SIZE * 0.25;
    const angle = (orientation * Math.PI) / 180;
    
    const endX = x + Math.cos(angle) * arrowLength;
    const endY = y + Math.sin(angle) * arrowLength;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Arrow head
    const headLength = 8;
    const headAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headLength * Math.cos(angle - headAngle),
        endY - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headLength * Math.cos(angle + headAngle),
        endY - headLength * Math.sin(angle + headAngle)
    );
    ctx.stroke();
}

// Highlight selected cell
function highlightCell(x, y, color = 'rgba(255, 255, 0, 0.3)') {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// Draw laser beam animation
function drawLaserBeam(path) {
    if (path.length < 2) return;
    
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    const start = path[0];
    ctx.moveTo(start.x * CELL_SIZE + CELL_SIZE / 2, start.y * CELL_SIZE + CELL_SIZE / 2);
    
    for (let i = 1; i < path.length; i++) {
        const point = path[i];
        ctx.lineTo(point.x * CELL_SIZE + CELL_SIZE / 2, point.y * CELL_SIZE + CELL_SIZE / 2);
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Render the entire board
function renderBoard(gameState) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Highlight selected piece
    if (gameState.selectedPiece) {
        highlightCell(gameState.selectedPiece.x, gameState.selectedPiece.y);
    }
    
    // Highlight possible moves if in move mode
    if (gameState.currentAction === 'move' && gameState.selectedPiece) {
        const moves = getPossibleMoves(gameState.selectedPiece, gameState);
        moves.forEach(move => {
            highlightCell(move.x, move.y, 'rgba(0, 255, 0, 0.2)');
        });
    }
    
    // Draw all pieces
    gameState.pieces.forEach(piece => {
        drawPiece(piece);
    });
}

// Update player info
function updatePlayerInfo(gameState) {
    document.getElementById('turnIndicator').textContent = 
        `Player ${gameState.currentPlayer}'s Turn`;
    
    document.getElementById('p1-reserve').textContent = gameState.players[1].pyramidReserve;
    document.getElementById('p2-reserve').textContent = gameState.players[2].pyramidReserve;
    
    // Update reserve display
    updateReserveDisplay(1, gameState.players[1].pyramidReserve);
    updateReserveDisplay(2, gameState.players[2].pyramidReserve);
}

// Update reserve visual display
function updateReserveDisplay(player, count) {
    const reserveId = `p${player}-reserve-display`;
    const slots = document.querySelectorAll(`#${reserveId} .pyramid-slot`);
    
    slots.forEach((slot, index) => {
        if (index < count) {
            slot.classList.remove('used');
        } else {
            slot.classList.add('used');
        }
    });
}

// Add log message
function addLog(message) {
    const logDiv = document.getElementById('gameLog');
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Update action hint
function updateActionHint(text) {
    document.getElementById('actionHint').textContent = text;
}

// Show game over screen
function showGameOver(winner) {
    const message = winner === 'draw' 
        ? 'Game Over - Draw!' 
        : `Game Over - Player ${winner} Wins!`;
    
    addLog(message);
    
    // Disable all buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Show alert
    setTimeout(() => {
        alert(message + '\nRefresh the page to play again.');
    }, 500);
}

// Get possible moves for a piece
function getPossibleMoves(piece, gameState) {
    if (!piece.canMove()) return [];
    
    const moves = [];
    const directions = [
        {dx: 0, dy: -1}, // up
        {dx: 0, dy: 1},  // down
        {dx: -1, dy: 0}, // left
        {dx: 1, dy: 0}   // right
    ];
    
    directions.forEach(dir => {
        const newX = piece.x + dir.dx;
        const newY = piece.y + dir.dy;
        
        // Check bounds
        if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
            // Check if cell is empty
            const occupied = gameState.pieces.some(p => p.x === newX && p.y === newY);
            if (!occupied) {
                moves.push({x: newX, y: newY});
            }
        }
    });
    
    return moves;
}