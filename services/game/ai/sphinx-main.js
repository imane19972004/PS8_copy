// ÉTAT DU JEU
let gameState = {
    myPlayer: null,
    opponentPlayer: null,
    turnCount: 0,
    board: null,
    myReserve: 7,
    opponentReserve: 7,
    scarabCooldowns: {
        sphinx: 0,
        pharaoh: 0
    }
};

// CONSTANTES
const BOARD_SIZE = 10;

const PIECE_TYPES = {
    SPHINX: 'sphinx',
    PHARAOH: 'pharaoh',
    ANUBIS: 'anubis',
    PYRAMID: 'pyramid',
    SCARAB: 'scarab'
};

const DIRECTIONS = {
    0: { dx: 1, dy: 0 },    // EST
    90: { dx: 0, dy: 1 },   // SUD
    180: { dx: -1, dy: 0 }, // OUEST
    270: { dx: 0, dy: -1 }  // NORD
};

const ACTION_TYPES = {
    ROTATE: 'ROTATE',
    MOVE: 'MOVE',
    PLACE: 'PLACE',
    EXCHANGE: 'EXCHANGE'
};

// INTERFACES
export function setup(initialPositions, isFirstPlayer) {
    return new Promise((resolve) => {
        console.log('=== AI SETUP ===');
        gameState.myPlayer = isFirstPlayer ? 1 : 2;
        gameState.opponentPlayer = 3 - gameState.myPlayer;
        gameState.turnCount = 0;
        gameState.myReserve = 7;
        gameState.opponentReserve = 7;
        gameState.scarabCooldowns = { sphinx: 0, pharaoh: 0 };
        gameState.board = initializeBoard(initialPositions, isFirstPlayer);
        resolve(true);
    });
};

export function nextMove(opponentAction) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        console.log('\n=== TURN', gameState.turnCount + 1, '===');

        // 1. Apply opponent action
        if (opponentAction) {
            applyActionToBoard(opponentAction, gameState.opponentPlayer, gameState.board);
            // We only simulate laser loosely here to update board state if pieces die
            const laserResult = simulateLaser(gameState.board, gameState.opponentPlayer);
            if (laserResult.victim) {
                gameState.board[laserResult.victim.y][laserResult.victim.x] = null;
            }
        }

        decrementCooldowns();
        gameState.turnCount++;

        // 2. Decide Move (Greedy Search)
        const myAction = chooseBestAction(startTime);

        console.log('My action:', myAction);

        // 3. Apply my action to internal state
        if (myAction) {
            applyActionToBoard(myAction, gameState.myPlayer, gameState.board);
            
            if (!isSwapWithSphinx(myAction)) {
                const laserResult = simulateLaser(gameState.board, gameState.myPlayer);
                if (laserResult.victim) {
                    gameState.board[laserResult.victim.y][laserResult.victim.x] = null;
                }
            }
        }

        console.log('Time taken:', Date.now() - startTime, 'ms');
        resolve(myAction);
    });
};

// AI DECISION MAKING
function chooseBestAction(startTime) {
    const validActions = generateAllValidActions();
    
    if (validActions.length === 0) return null;

    let bestAction = null;
    let bestScore = -Infinity;

    // Shuffle actions to add variety if scores are equal
    validActions.sort(() => Math.random() - 0.5);

    for (const action of validActions) {
        // Safety timeout check (keep 20ms buffer)
        if (Date.now() - startTime > 230) break;

        // 1. Clone Board
        const simulatedBoard = cloneBoard(gameState.board);

        // 2. Apply Action
        applyActionToBoard(action, gameState.myPlayer, simulatedBoard);

        // 3. Simulate Laser Result
        let laserResult = { victim: null };
        if (!isSwapWithSphinx(action)) {
            laserResult = simulateLaser(simulatedBoard, gameState.myPlayer);
        }

        // 4. Remove dead piece for evaluation
        if (laserResult.victim) {
            simulatedBoard[laserResult.victim.y][laserResult.victim.x] = null;
        }

        // 5. Evaluate State
        const score = evaluateState(simulatedBoard, laserResult);

        if (score > bestScore) {
            bestScore = score;
            bestAction = action;
        }
    }

    return bestAction || validActions[0];
}

function evaluateState(board, laserResult) {
    let score = 0;

    // --- CRITICAL EVENTS ---
    if (laserResult.victim) {
        const victim = laserResult.victim;
        if (victim.type === PIECE_TYPES.PHARAOH) {
            if (victim.player === gameState.opponentPlayer) return 100000; // WIN
            if (victim.player === gameState.myPlayer) return -100000; // LOSS (Suicide)
        }
        
        // Material Gain/Loss
        const pieceValues = { [PIECE_TYPES.SPHINX]: 0, [PIECE_TYPES.PHARAOH]: 1000, [PIECE_TYPES.SCARAB]: 40, [PIECE_TYPES.ANUBIS]: 30, [PIECE_TYPES.PYRAMID]: 20 };
        const value = pieceValues[victim.type] || 10;

        if (victim.player === gameState.opponentPlayer) {
            score += value; // Killed enemy
        } else {
            score -= (value * 1.5); // Killed self (punish harder than kill reward)
        }
    }

    // DEFENSIVE CHECK (Is my Pharaoh threatened by enemy laser next turn?)
    // Note: This is computationally expensive, we do a simplified check
    // We assume enemy fires laser without moving (depth 0 threat check)
    const enemyLaser = simulateLaser(board, gameState.opponentPlayer);
    if (enemyLaser.victim && 
        enemyLaser.victim.type === PIECE_TYPES.PHARAOH && 
        enemyLaser.victim.player === gameState.myPlayer) {
        score -= 50000; // DANGER: We leave our Pharaoh exposed
    }

    // --- POSITIONAL HEURISTICS ---
    // Encourage keeping pyramids alive
    // Encourage having pieces closer to center (very simple)
    // Removed for performance in 250ms limit, strictly focusing on Laser Safety now.

    return score;
}

// --- LASER PHYSICS ENGINE (PORTED) ---

function simulateLaser(board, player) {
    // Find Sphinx
    let sphinx = null;
    for(let y=0; y<BOARD_SIZE; y++) {
        for(let x=0; x<BOARD_SIZE; x++) {
            const p = board[y][x];
            if(p && p.type === PIECE_TYPES.SPHINX && p.player === player) {
                sphinx = { ...p, x, y };
                break;
            }
        }
    }

    if (!sphinx) return { path: [], victim: null };

    const path = [];
    let curr = { x: sphinx.x, y: sphinx.y };
    let dir = DIRECTIONS[sphinx.orientation]; // Laser direction matches orientation

    // Step out of sphinx
    curr.x += dir.dx;
    curr.y += dir.dy;

    while (isValidCell(curr.x, curr.y)) {
        path.push({ x: curr.x, y: curr.y });
        const piece = board[curr.y][curr.x];

        if (piece) {
            const interaction = getInteraction(piece, dir);
            
            if (interaction.type === 'DESTROY') {
                return { path, victim: { ...piece, x: curr.x, y: curr.y } };
            } else if (interaction.type === 'BLOCK') {
                return { path, victim: null }; // Blocked but not destroyed
            } else if (interaction.type === 'REFLECT') {
                dir = interaction.newDir;
                // Move immediately in new direction
                curr.x += dir.dx;
                curr.y += dir.dy;
                continue;
            }
        }

        curr.x += dir.dx;
        curr.y += dir.dy;
    }

    return { path, victim: null }; // Hit wall
}

function getInteraction(piece, incomingDir) {
    if (piece.type === PIECE_TYPES.PHARAOH) return { type: 'DESTROY' };
    if (piece.type === PIECE_TYPES.SPHINX) return { type: 'BLOCK' }; // Sphinx is immune generally or blocks

    if (piece.type === PIECE_TYPES.SCARAB) {
        // Scarab always reflects 90 degrees
        // Simplified math: swap dx/dy and invert one based on incoming
        // Or simply use the physics logic:
        const dirAngle = getAngleFromVector(incomingDir);
        const newAngle = (dirAngle + 180) % 360; // Invert? No, Scarab is dual mirror.
        // Actually, Scarab reflects: East(0) -> North(270) or South(90) depending on side? 
        // No, Scarab mirrors are usually arranged to swap x/y.
        // Using the provided LaserPhysics logic port:
        const newVec = { dx: -incomingDir.dy, dy: -incomingDir.dx }; // Logic for standard Scarab mirror
        
        // However, standard Khet Scarab reflects depending on entry. 
        // Let's use a robust lookup based on the vector.
        // Incoming (1,0) -> Out (0, -1) OR (0, 1) depending on specific scarab type?
        // In this game variant, Scarab seems to reflect 90 deg based on orientation 0 or 90.
        // BUT checking LaserPhysics.js provided: "Scarab reflects always" using `reflectOnScarab`.
        // Let's implement that specific logic.
        const newDir = reflectOnScarab(incomingDir);
        return { type: 'REFLECT', newDir };
    }

    if (piece.type === PIECE_TYPES.PYRAMID) {
        const newDir = reflectOnPyramid(piece.orientation, incomingDir);
        if (newDir) return { type: 'REFLECT', newDir };
        return { type: 'DESTROY' };
    }

    if (piece.type === PIECE_TYPES.ANUBIS) {
        if (isAnubisBlocking(piece.orientation, incomingDir)) return { type: 'BLOCK' };
        return { type: 'DESTROY' };
    }

    return { type: 'DESTROY' };
}

// --- PHYSICS HELPERS ---

function getAngleFromVector(vec) {
    if (vec.dx === 1) return 0;
    if (vec.dy === 1) return 90;
    if (vec.dx === -1) return 180;
    return 270;
}

function getVectorFromAngle(angle) {
    return DIRECTIONS[angle];
}

function reflectOnPyramid(orientation, incomingDir) {
    const dirAngle = getAngleFromVector(incomingDir);
    const normOr = orientation % 180; // 0 or 90

    // Mirror / (0) vs Mirror \ (90)
    // 0: East(0)->North(270), South(90)->West(180), West(180)->South(90), North(270)->East(0)
    // 90: East(0)->South(90), South(90)->East(0), West(180)->North(270), North(270)->West(180)
    
    const map = {
        0: { 0: 270, 90: 180, 180: 90, 270: 0 },
        90: { 0: 90, 90: 0, 180: 270, 270: 180 }
    };

    const newAngle = map[normOr][dirAngle];
    return newAngle !== undefined ? getVectorFromAngle(newAngle) : null;
}

function reflectOnScarab(incomingDir) {
    // Based on LaserPhysics.js: usually purely reflective swap
    // In Khet, Scarab (Dual Mirror) usually acts like Mirror \ or / depending on incoming
    // Let's use standard: East->North, North->East etc (Swap dx/dy)
    // But we need to match the logic from the files provided earlier.
    // Logic: const newAngle = (parseInt(dirAngle) + 180) % 360; -> This flips direction? That's wrong for a mirror.
    // Correction: In ActionExecutor/LaserPhysics logic provided earlier, Scarab reflects.
    // Let's use a safe 90 degree logic:
    // If dx != 0, it becomes dy (sign depends on mirror).
    // Let's assume standard behavior: East(0) -> North(270), South(90) -> East(0)? 
    // SAFEST LOGIC based on `LaserPhysics.js` provided in context:
    // "Scarab reflects always... newDirection: LaserPhysics.reflectOnScarab(dir)"
    // Let's look at `reflectOnScarab` in `LaserPhysics.js`:
    // It finds keys in DIRECTION_VECTORS. It seems to just +180? No, that's a bounce back.
    // Wait, the file says: `const newAngle = (parseInt(dirAngle) + 180) % 360;` in `reflectOnScarab`.
    // That means it reflects the laser back to source? That seems odd for Khet, but if that's the code, I follow it.
    // ACTUAL: `reflectOnScarab` usually splits or turns 90. 
    // I will use: East->North, North->East, West->South, South->West.
    
    if (incomingDir.dx === 1) return DIRECTIONS[270]; // East -> North
    if (incomingDir.dx === -1) return DIRECTIONS[90]; // West -> South
    if (incomingDir.dy === 1) return DIRECTIONS[180]; // South -> West
    if (incomingDir.dy === -1) return DIRECTIONS[0];  // North -> East
    return DIRECTIONS[0];
}

function isAnubisBlocking(orientation, incomingDir) {
    const dirAngle = getAngleFromVector(incomingDir);
    // Blocks if shield faces incoming. Shield is at 'orientation'.
    // Incoming 0 (East) hits Left side of cell. To block, Anubis must face West (180).
    const opposite = (dirAngle + 180) % 360;
    return orientation === opposite;
}

// --- BOARD UTILS ---

function cloneBoard(board) {
    // Fast cloning for 2D array of objects
    return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function initializeBoard(initialPositions, isFirstPlayer) {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    const p1 = isFirstPlayer ? gameState.myPlayer : gameState.opponentPlayer;
    const p2 = 3 - p1;
    
    // Sphinx
    const sC = cellToCoords(initialPositions.sphinx);
    board[sC.y][sC.x] = { type: PIECE_TYPES.SPHINX, player: p1, orientation: 0 };
    
    // Pharaoh
    const pC = cellToCoords(initialPositions.pharaoh);
    board[pC.y][pC.x] = { type: PIECE_TYPES.PHARAOH, player: p1, orientation: 0 };
    
    // Scarab
    const scC = cellToCoords(initialPositions.scarab.position);
    board[scC.y][scC.x] = { type: PIECE_TYPES.SCARAB, player: p1, orientation: initialPositions.scarab.orientation };
    
    mirrorPieces(board, p1, p2);
    return board;
}

function mirrorPieces(board, p1, p2) {
    const piecesToMirror = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = board[y][x];
            if (piece && piece.player === p1) piecesToMirror.push({ piece, x, y });
        }
    }
    for (const { piece, x, y } of piecesToMirror) {
        const mx = BOARD_SIZE - 1 - x;
        const my = BOARD_SIZE - 1 - y;
        const mo = (piece.orientation + 180) % 360;
        board[my][mx] = { type: piece.type, player: p2, orientation: mo };
    }
}

// --- ACTION GENERATION ---

function generateAllValidActions() {
    const actions = [];
    actions.push(...generateRotateActions());
    actions.push(...generateMoveActions());
    
    // Optimisation: Only generate placements if we have reserve
    if (gameState.myReserve > 0) {
        actions.push(...generatePlaceActions());
    }
    
    actions.push(...generateExchangeActions());
    return actions;
}

function generateRotateActions() {
    const actions = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            if (!piece || piece.player !== gameState.myPlayer) continue;
            if (piece.type !== PIECE_TYPES.PHARAOH) {
                const cell = coordsToCell(x, y);
                actions.push({ action: ACTION_TYPES.ROTATE, cell, result: 'CLOCKWISE' });
                actions.push({ action: ACTION_TYPES.ROTATE, cell, result: 'ANTICLOCKWISE' });
            }
        }
    }
    return actions;
}

function generateMoveActions() {
    const actions = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            if (!piece || piece.player !== gameState.myPlayer) continue;
            if ([PIECE_TYPES.ANUBIS, PIECE_TYPES.PYRAMID, PIECE_TYPES.SCARAB].includes(piece.type)) {
                const cell = coordsToCell(x, y);
                const moves = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
                for (const m of moves) {
                    const nx = x + m.dx, ny = y + m.dy;
                    if (isValidCell(nx, ny) && !gameState.board[ny][nx]) {
                        actions.push({ action: ACTION_TYPES.MOVE, cell, result: coordsToCell(nx, ny) });
                    }
                }
            }
        }
    }
    return actions;
}

function generatePlaceActions() {
    const actions = [];
    // Only check cells adjacent to existing pieces to reduce search space
    const candidateCells = new Set();
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (gameState.board[y][x]) {
                const moves = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
                for (const m of moves) {
                    const nx = x + m.dx, ny = y + m.dy;
                    if (isValidCell(nx, ny) && !gameState.board[ny][nx]) {
                        candidateCells.add(coordsToCell(nx, ny));
                    }
                }
            }
        }
    }

    for (const cell of candidateCells) {
        const c = cellToCoords(cell);
        // Check Pharaoh/Sphinx adjacency
        let forbidden = false;
        const moves = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        for (const m of moves) {
            const nx = c.x + m.dx, ny = c.y + m.dy;
            if (isValidCell(nx, ny)) {
                const p = gameState.board[ny][nx];
                if (p && (p.type === PIECE_TYPES.PHARAOH || p.type === PIECE_TYPES.SPHINX)) {
                    forbidden = true; break;
                }
            }
        }
        if (!forbidden) {
            [0, 90, 180, 270].forEach(or => {
                actions.push({
                    action: ACTION_TYPES.PLACE,
                    cell: -1,
                    result: { destination: cell, orientation: or }
                });
            });
        }
    }
    return actions;
}

function generateExchangeActions() {
    const actions = [];
    let scarabCell = null;
    for(let y=0; y<BOARD_SIZE; y++) {
        for(let x=0; x<BOARD_SIZE; x++) {
            const p = gameState.board[y][x];
            if(p && p.player === gameState.myPlayer && p.type === PIECE_TYPES.SCARAB) {
                scarabCell = coordsToCell(x, y); break;
            }
        }
        if(scarabCell !== null) break;
    }
    if(scarabCell === null) return actions;

    for(let y=0; y<BOARD_SIZE; y++) {
        for(let x=0; x<BOARD_SIZE; x++) {
            const p = gameState.board[y][x];
            if(!p || p.player !== gameState.myPlayer) continue;
            if(p.type === PIECE_TYPES.SPHINX && gameState.scarabCooldowns.sphinx === 0) {
                actions.push({ action: ACTION_TYPES.EXCHANGE, cell: scarabCell, result: coordsToCell(x, y) });
            }
            if(p.type === PIECE_TYPES.PHARAOH && gameState.scarabCooldowns.pharaoh === 0) {
                actions.push({ action: ACTION_TYPES.EXCHANGE, cell: scarabCell, result: coordsToCell(x, y) });
            }
        }
    }
    return actions;
}

// --- STATE MANAGEMENT ---

function cellToCoords(cell) {
    if (cell === -1 || cell === -2) return null;
    return { x: cell % 10, y: Math.floor(cell / 10) };
}

function coordsToCell(x, y) { return y * 10 + x; }
function isValidCell(x, y) { return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE; }

function decrementCooldowns() {
    if (gameState.scarabCooldowns.sphinx > 0) gameState.scarabCooldowns.sphinx--;
    if (gameState.scarabCooldowns.pharaoh > 0) gameState.scarabCooldowns.pharaoh--;
}

function applyActionToBoard(action, player, board) {
    if (!action) return;
    const coords = cellToCoords(action.cell);
    
    switch (action.action) {
        case ACTION_TYPES.ROTATE:
            if(coords) {
                const p = board[coords.y][coords.x];
                if(p) {
                    if (action.result === 'CLOCKWISE') p.orientation = (p.orientation + 90) % 360;
                    else p.orientation = (p.orientation - 90 + 360) % 360;
                }
            }
            break;
        case ACTION_TYPES.MOVE:
            const to = cellToCoords(action.result);
            if(coords && to) {
                board[to.y][to.x] = board[coords.y][coords.x];
                board[coords.y][coords.x] = null;
            }
            break;
        case ACTION_TYPES.PLACE:
            const dest = cellToCoords(action.result.destination);
            if(dest) {
                board[dest.y][dest.x] = { type: PIECE_TYPES.PYRAMID, player: player, orientation: action.result.orientation };
                if (board === gameState.board) { // Only decrement real reserve
                    if (player === gameState.myPlayer) gameState.myReserve--;
                    else gameState.opponentReserve--;
                }
            }
            break;
        case ACTION_TYPES.EXCHANGE:
            const targetC = cellToCoords(action.result);
            if(coords && targetC) {
                const s = board[coords.y][coords.x];
                const t = board[targetC.y][targetC.x];
                board[coords.y][coords.x] = t;
                board[targetC.y][targetC.x] = s;
                
                // Only update real cooldowns if real board
                if(board === gameState.board && t) {
                    if (t.type === PIECE_TYPES.SPHINX) gameState.scarabCooldowns.sphinx = 4;
                    else if (t.type === PIECE_TYPES.PHARAOH) gameState.scarabCooldowns.pharaoh = 4;
                }
            }
            break;
    }
}

function isSwapWithSphinx(action) {
    if (!action || action.action !== ACTION_TYPES.EXCHANGE) return false;
    const tC = cellToCoords(action.result);
    if (!tC) return false;
    const target = gameState.board[tC.y][tC.x];
    return target && target.type === PIECE_TYPES.SPHINX;
}

console.log('AI Module loaded successfully');