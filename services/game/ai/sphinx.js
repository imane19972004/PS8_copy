// Équipe : Sphinx
// Stratégie : Détection d'urgence + évaluation rapide

// ÉTAT GLOBAL
let gameState = {
    myPlayer: null,
    opponentPlayer: null,
    turnCount: 0,
    board: null,
    myReserve: 7,
    opponentReserve: 7,
    scarabCooldowns: { sphinx: 0, pharaoh: 0 }
};

// CONSTANTES
const BOARD_SIZE = 10;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const PIECE_TYPES = {
    SPHINX: 'sphinx',
    PHARAOH: 'pharaoh',
    ANUBIS: 'anubis',
    PYRAMID: 'pyramid',
    SCARAB: 'scarab'
};

const DIRECTIONS = {
    0: { dx: 1, dy: 0 },
    90: { dx: 0, dy: 1 },
    180: { dx: -1, dy: 0 },
    270: { dx: 0, dy: -1 }
};

const ACTION_TYPES = {
    ROTATE: 'ROTATE',
    MOVE: 'MOVE',
    PLACE: 'PLACE',
    EXCHANGE: 'EXCHANGE'
};

/**
 * Initialise l'IA au début de la partie
 * Budget : 1000 ms maximum
 * 
 * @param {Object} initialPositions - Positions initiales du premier joueur
 *   { sphinx: Cell, pharaoh: Cell, scarab: { position: Cell, orientation: 0|9 } }
 * @param {boolean} isFirstPlayer - true si on joue en premier
 * @returns {Promise<boolean>} - Promise résolue en true
 */
function setup(initialPositions, isFirstPlayer) {
    return Promise.resolve().then(() => {
        gameState.myPlayer = isFirstPlayer ? 1 : 2;
        gameState.opponentPlayer = 3 - gameState.myPlayer;
        gameState.turnCount = 0;
        gameState.myReserve = 7;
        gameState.opponentReserve = 7;
        gameState.scarabCooldowns = { sphinx: 0, pharaoh: 0 };
        gameState.board = initializeBoard(initialPositions, isFirstPlayer);
        return true;
    });
}

/**
 * Calcule le prochain coup de l'IA
 * Budget : 250 ms maximum
 * 
 * @param {Object} opponentAction - Action précédente de l'adversaire (ou null)
 *   { action: "ROTATE"|"MOVE"|"PLACE"|"EXCHANGE", cell: Cell, result: ... }
 * @returns {Promise<Object>} - Promise résolue en Action
 */
function nextMove(opponentAction) {
    const startTime = Date.now();
    
    return Promise.resolve().then(() => {
        // Appliquer l'action adverse
        if (opponentAction) {
            applyActionToBoard(opponentAction, gameState.opponentPlayer, gameState.board);
            const victims = simulateLaser(gameState.board, gameState.opponentPlayer);
            for (const victim of victims) {
                gameState.board[victim.y][victim.x] = null;
            }
        }
        
        decrementCooldowns();
        gameState.turnCount++;
        
        // Choisir la meilleure action
        const action = chooseBestAction(startTime);
        
        // Appliquer l'action et simuler le laser
        if (action) {
            applyActionToBoard(action, gameState.myPlayer, gameState.board);
            
            if (!isSwapWithSphinx(action)) {
                const victims = simulateLaser(gameState.board, gameState.myPlayer);
                for (const victim of victims) {
                    gameState.board[victim.y][victim.x] = null;
                }
            }
        }
        
        return action;
    });
}

// EXPORTS REQUIS
exports.setup = setup;
exports.nextMove = nextMove;

// DECISION LOGIC
/**
 * Choisit la meilleure action selon une stratégie rapide
 * Détection menace & évaluation rapide
 */
function chooseBestAction(startTime) {
    const actions = generateAllValidActions();
    
    if (actions.length === 0) return null;
    
    let best = actions[0];
    let bestScore = -Infinity;
    
    for (let i = 0; i < actions.length; i++) {
        if (Date.now() - startTime > 230) break;
        
        const action = actions[i];
        const boardCopy = cloneBoard(gameState.board);
        applyActionToBoard(action, gameState.myPlayer, boardCopy);
        
        let victims = [];
        if (!isSwapWithSphinx(action)) {
            victims = simulateLaser(boardCopy, gameState.myPlayer);
        }
        
        for (const victim of victims) {
            boardCopy[victim.y][victim.x] = null;
        }
        
        const score = evaluate(boardCopy, victims);
        
        if (score > bestScore) {
            bestScore = score;
            best = action;
        }
        
        if (score >= 100000) break;
    }
    
    return best;
}

/**
 * Évalue une position de plateau
 * Focus : kill pharaon puis défense puis contrôle
 */
function evaluate(board, victims) {
    // Victoire immédiate
    for (const victim of victims) {
        if (victim.type === PIECE_TYPES.PHARAOH && 
            victim.player === gameState.opponentPlayer) {
            return 100000;
        }
    }
    
    // Défaite immédiate
    const enemyVictims = simulateLaser(board, gameState.opponentPlayer);
    for (const victim of enemyVictims) {
        if (victim.type === PIECE_TYPES.PHARAOH && 
            victim.player === gameState.myPlayer) {
            return -50000;
        }
    }
    
    let score = 0;
    
    // 1. Compter les pièces tuées ce tour
    for (const victim of victims) {
        if (victim.player === gameState.opponentPlayer) {
            score += getPieceValue(victim.type);
        }
    }
    
    // 2. Compter mes pertes potentielles au prochain tour adverse
    for (const victim of enemyVictims) {
        if (victim.player === gameState.myPlayer) {
            score -= getPieceValue(victim.type) * 1.2; // Légère pénalité défensive
        }
    }
    
    // 3. Sécurité du Pharaon
    const myPharaoh = findPiece(board, gameState.myPlayer, PIECE_TYPES.PHARAOH);
    if (myPharaoh) {
        const dangerLevel = evaluatePharaohDanger(board, myPharaoh);
        score -= dangerLevel * 100; // Forte pénalité si Pharaon exposé
    }

    return score;
}

function getPieceValue(type) {
    switch (type) {
        case PIECE_TYPES.PYRAMID: return 10;
        case PIECE_TYPES.ANUBIS: return 30;
        case PIECE_TYPES.SCARAB: return 50;
        case PIECE_TYPES.SPHINX: return 0; // Indestructible
        case PIECE_TYPES.PHARAOH: return 0; // Géré séparément
        default: return 0;
    }
}

/**
 * Trouve une pièce sur le plateau
 */
function findPiece(board, player, type) {
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = board[y][x];
            if (piece && piece.player === player && piece.type === type) {
                return { x, y, piece };
            }
        }
    }
    return null;
}

/**
 * Évalue le danger autour du Pharaon
 * Retourne un score de danger (0 = sûr, 5+ = très exposé)
 */
function evaluatePharaohDanger(board, pharaohPos) {
    let danger = 0;
    const { x, y } = pharaohPos;
    
    // 1. Compter les protections adjacentes (Anubis, Pyramides)
    const protections = getAdjacentPieces(x, y).filter(p => 
        p.player === gameState.myPlayer && 
        [PIECE_TYPES.ANUBIS, PIECE_TYPES.PYRAMID].includes(p.type)
    );
    
    if (protections.length === 0) danger += 3; // Pharaon isolé
    else if (protections.length === 1) danger += 1;
    
    // 2. Proximité du Sphinx adverse
    const enemySphinx = findPiece(board, gameState.opponentPlayer, PIECE_TYPES.SPHINX);
    if (enemySphinx) {
        const dist = Math.abs(x - enemySphinx.x) + Math.abs(y - enemySphinx.y);
        if (dist <= 3) danger += 2; // Sphinx trop proche
    }
    
    // 3. Lignes de tir adverses (simulation rapide des 4 directions)
    const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];
    
    for (const dir of directions) {
        if (hasDirectLineToEnemy(board, x, y, dir)) {
            danger += 1;
        }
    }
    
    return danger;
}

/**
 * Vérifie s'il y a une ligne de tir directe vers une pièce ennemie
 */
function hasDirectLineToEnemy(board, startX, startY, direction) {
    let x = startX + direction.dx;
    let y = startY + direction.dy;
    
    while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        const piece = board[y][x];
        if (piece) {
            return piece.player === gameState.opponentPlayer;
        }
        x += direction.dx;
        y += direction.dy;
    }
    return false;
}

// ACTION GENERATION
/**
 * Génère toutes les actions valides pour le joueur actuel
 */
function generateAllValidActions() {
    const actions = [];
    
    actions.push(...generateRotateActions());
    actions.push(...generateMoveActions());
    
    if (gameState.myReserve > 0) {
        actions.push(...generatePlaceActions());
    }
    
    actions.push(...generateExchangeActions());
    
    return actions;
}

/**
 * Génère les actions de rotation possibles
 */
function generateRotateActions() {
    const actions = [];
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            if (piece && 
                piece.player === gameState.myPlayer && 
                piece.type !== PIECE_TYPES.PHARAOH) {
                
                const cell = coordsToCell(x, y);
                
                if (cell >= 0) {
                    actions.push({
                        action: ACTION_TYPES.ROTATE,
                        cell: cell,
                        result: 'CLOCKWISE'
                    });
                    actions.push({
                        action: ACTION_TYPES.ROTATE,
                        cell: cell,
                        result: 'ANTICLOCKWISE'
                    });
                }
            }
        }
    }
    
    return actions;
}

/**
 * Génère les actions de déplacement possibles
 */
function generateMoveActions() {
    const actions = [];
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            
            if (piece && 
                piece.player === gameState.myPlayer &&
                [PIECE_TYPES.ANUBIS, PIECE_TYPES.PYRAMID, PIECE_TYPES.SCARAB].includes(piece.type)) {
                
                const fromCell = coordsToCell(x, y);
                if (fromCell < 0) continue; // Skip si invalide
                
                for (const [dx, dy] of deltas) {
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    if (isValidCell(newX, newY) && !gameState.board[newY][newX]) {
                        const toCell = coordsToCell(newX, newY);
                        if (toCell >= 0) {
                            actions.push({
                                action: ACTION_TYPES.MOVE,
                                cell: fromCell,
                                result: toCell
                            });
                        }
                    }
                }
            }
        }
    }
    
    return actions;
}

/**
 * Génère les actions de placement de pyramide possibles
 * Pas de pyramide adjacente au Pharaon ou aux Sphinx
 */
function generatePlaceActions() {
    const actions = [];
    const orientations = [0, 9, 90, 99];
    
    // 1. Trouver les positions interdites
    const forbiddenCells = new Set();
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            
            // Si c'est un Pharaon ou un Sphinx (peu importe le joueur)
            if (piece && (piece.type === PIECE_TYPES.PHARAOH || piece.type === PIECE_TYPES.SPHINX)) {
                // Marquer les 4 cellules adjacentes comme interdites
                const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                
                for (const [dx, dy] of deltas) {
                    const adjX = x + dx;
                    const adjY = y + dy;
                    
                    if (isValidCell(adjX, adjY)) {
                        const adjCell = coordsToCell(adjX, adjY);
                        if (adjCell >= 0) {
                            forbiddenCells.add(adjCell);
                        }
                    }
                }
            }
        }
    }
    
    // 2. Générer les placements valides sur toutes les cellules vides NON interdites
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = coordsToCell(x, y);
            
            const currentPiece = gameState.board[y][x];
            
            if (cell >= 0 && 
                currentPiece === null && // Vérification stricte
                !forbiddenCells.has(cell)) {
                
                // Ajouter une action pour chaque orientation possible
                for (const orientation of orientations) {
                    actions.push({
                        action: ACTION_TYPES.PLACE,
                        cell: -1, // La pyramide vient de la réserve
                        result: {
                            destination: cell,
                            orientation: orientation
                        }
                    });
                }
            }
        }
    }
    
    return actions;
}

/**
 * Génère les actions d'échange Scarab possibles
 */
function generateExchangeActions() {
    const actions = [];
    
    let scarabCell = null;
    let scarabCoords = null;
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            if (piece && 
                piece.type === PIECE_TYPES.SCARAB && 
                piece.player === gameState.myPlayer) {
                scarabCell = coordsToCell(x, y);
                scarabCoords = { x, y };
                break;
            }
        }
        if (scarabCell !== null) break;
    }
    
    if (scarabCell === null || scarabCell < 0) return actions;
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = gameState.board[y][x];
            if (piece && piece.player === gameState.myPlayer) {
                const targetCell = coordsToCell(x, y);
                
                if (targetCell >= 0) {
                    if (piece.type === PIECE_TYPES.SPHINX && 
                        gameState.scarabCooldowns.sphinx === 0) {
                        actions.push({
                            action: ACTION_TYPES.EXCHANGE,
                            cell: scarabCell,
                            result: targetCell
                        });
                    }
                    if (piece.type === PIECE_TYPES.PHARAOH && 
                        gameState.scarabCooldowns.pharaoh === 0) {
                        actions.push({
                            action: ACTION_TYPES.EXCHANGE,
                            cell: scarabCell,
                            result: targetCell
                        });
                    }
                }
            }
        }
    }
    
    return actions;
}

// LASER SIMULATION
/**
 * Simule le trajet du laser d'un joueur
 * Retourne un tableau de victimes [{type, player, x, y}, ...]
 */
function simulateLaser(board, player) {
    const victims = [];
    
    // Trouver le Sphinx
    let sphinx = null;
    let found = false;
    
    // Chercher d'abord sur les bords
    for (let x = 0; x < BOARD_SIZE && !found; x++) {
        // Ligne 0 (haut)
        let piece = board[0][x];
        if (piece && piece.type === PIECE_TYPES.SPHINX && piece.player === player) {
            sphinx = { ...piece, x, y: 0 };
            found = true;
            break;
        }
        
        // Ligne 9 (bas)
        piece = board[9][x];
        if (piece && piece.type === PIECE_TYPES.SPHINX && piece.player === player) {
            sphinx = { ...piece, x, y: 9 };
            found = true;
            break;
        }
    }
    
    // Si pas trouvé, chercher sur les colonnes
    if (!found) {
        for (let y = 1; y < BOARD_SIZE - 1 && !found; y++) {
            // Colonne 0 (gauche)
            let piece = board[y][0];
            if (piece && piece.type === PIECE_TYPES.SPHINX && piece.player === player) {
                sphinx = { ...piece, x: 0, y };
                found = true;
                break;
            }
            
            // Colonne 9 (droite)
            piece = board[y][9];
            if (piece && piece.type === PIECE_TYPES.SPHINX && piece.player === player) {
                sphinx = { ...piece, x: 9, y };
                found = true;
                break;
            }
        }
    }
    
    if (!sphinx) return victims;
    
    let dir = DIRECTIONS[sphinx.orientation];
    let x = sphinx.x + dir.dx;
    let y = sphinx.y + dir.dy;
    
    const maxIterations = 200;
    let iterations = 0;
    
    while (iterations++ < maxIterations) {
        if (!isValidCell(x, y)) {
            return victims;
        }
        
        const piece = board[y][x];
        
        if (!piece) {
            x += dir.dx;
            y += dir.dy;
            continue;
        }
        
        const interaction = resolveLaserHit(piece, dir);
        
        if (interaction.type === 'DESTROY') {
            victims.push({ ...piece, x, y });
            // Le laser continue après destruction
            x += dir.dx;
            y += dir.dy;
            continue;
        }
        
        if (interaction.type === 'BLOCK') {
            return victims;
        }
        
        if (interaction.type === 'REFLECT' && interaction.newDirection) {
            dir = interaction.newDirection;
            x += dir.dx;
            y += dir.dy;
            continue;
        }
        
        return victims;
    }
    
    return victims;
}

/**
 * Résout l'impact du laser sur une pièce
 */
function resolveLaserHit(piece, dir) {
    if (piece.type === PIECE_TYPES.SPHINX) {
        return { type: 'BLOCK' };
    }
    
    if (piece.type === PIECE_TYPES.PHARAOH) {
        return { type: 'DESTROY' };
    }
    
    if (piece.type === PIECE_TYPES.SCARAB) {
        const newDir = reflectOnScarab(dir);
        return { type: 'REFLECT', newDirection: newDir };
    }
    
    if (piece.type === PIECE_TYPES.PYRAMID) {
        const newDir = reflectOnPyramid(piece.orientation, dir);
        if (newDir) {
            return { type: 'REFLECT', newDirection: newDir };
        }
        return { type: 'DESTROY' };
    }
    
    if (piece.type === PIECE_TYPES.ANUBIS) {
        if (isAnubisBlocking(piece.orientation, dir)) {
            return { type: 'BLOCK' };
        }
        return { type: 'DESTROY' };
    }
    
    return { type: 'DESTROY' };
}

/**
 * Calcule la réflexion sur une pyramide
 * Retourne la nouvelle direction ou null si face vulnérable
 */
function reflectOnPyramid(orientation, dir) {
    const dirAngle = getAngle(dir);
    const normalizedOr = orientation % 180;
    
    const reflectionTables = {
        0: {
            0: 270,
            270: 0,
            180: 90,
            90: 180
        },
        90: {
            0: 90,
            90: 0,
            180: 270,
            270: 180
        }
    };
    
    const newAngle = reflectionTables[normalizedOr]?.[dirAngle];
    return newAngle !== undefined ? DIRECTIONS[newAngle] : null;
}

/**
 * Calcule la réflexion sur un Scarab (miroir double face)
 */
function reflectOnScarab(dir) {
    const dirAngle = getAngle(dir);
    const oppositeAngle = (dirAngle + 180) % 360;
    return DIRECTIONS[oppositeAngle];
}

/**
 * Vérifie si l'Anubis bloque le laser avec son bouclier
 */
function isAnubisBlocking(anubisOrientation, laserDir) {
    const dirAngle = getAngle(laserDir);
    const oppositeDir = (dirAngle + 180) % 360;
    return anubisOrientation === oppositeDir;
}

/**
 * Convertit une direction en angle
 */
function getAngle(dir) {
    if (dir.dx === 1 && dir.dy === 0) return 0;
    if (dir.dx === 0 && dir.dy === 1) return 90;
    if (dir.dx === -1 && dir.dy === 0) return 180;
    if (dir.dx === 0 && dir.dy === -1) return 270;
    return 0;
}

// BOARD MANAGEMENT

/**
 * Initialise le plateau à partir des positions initiales
 */
function initializeBoard(initialPositions, isFirstPlayer) {
    console.log('Initializing board with positions:', initialPositions, 'Is first player:', isFirstPlayer);
    const board = Array.from({ length: BOARD_SIZE }, () => 
        Array(BOARD_SIZE).fill(null)
    );
    
    const p1 = isFirstPlayer ? gameState.myPlayer : gameState.opponentPlayer;
    const p2 = 3 - p1;
    
    const sphinxPos = cellToCoords(initialPositions.sphinx);
    board[sphinxPos.y][sphinxPos.x] = {
        type: PIECE_TYPES.SPHINX,
        player: p1,
        orientation: 0
    };
    
    const pharaohPos = cellToCoords(initialPositions.pharaoh);
    board[pharaohPos.y][pharaohPos.x] = {
        type: PIECE_TYPES.PHARAOH,
        player: p1,
        orientation: 0
    };
    
    const scarabPos = cellToCoords(initialPositions.scarab.position);
    board[scarabPos.y][scarabPos.x] = {
        type: PIECE_TYPES.SCARAB,
        player: p1,
        orientation: initialPositions.scarab.orientation === 0 ? 0 : 90
    };
    
    mirrorPieces(board, p1, p2);
    
    return board;
}

/**
 * Applique une symétrie centrale pour les pièces du joueur 2
 */
function mirrorPieces(board, p1, p2) {
    const pieces = [];
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = board[y][x];
            if (piece && piece.player === p1) {
                pieces.push({ piece, x, y });
            }
        }
    }
    
    for (const { piece, x, y } of pieces) {
        const mirrorX = BOARD_SIZE - 1 - x;
        const mirrorY = BOARD_SIZE - 1 - y;
        const mirrorOrientation = (piece.orientation + 180) % 360;
        
        board[mirrorY][mirrorX] = {
            type: piece.type,
            player: p2,
            orientation: mirrorOrientation
        };
    }
}

/**
 * Clone un plateau
 */
function cloneBoard(board) {
    return board.map(row => 
        row.map(cell => cell ? { ...cell } : null)
    );
}

/**
 * Applique une action sur le plateau
 */
function applyActionToBoard(action, player, board) {
    console.log(`[DEBUG] Applying action:`, action, `for player ${player}`);
    
    const fromCoords = cellToCoords(action.cell);
    
    switch (action.action) {
        case ACTION_TYPES.ROTATE:
            if (fromCoords) {
                const piece = board[fromCoords.y][fromCoords.x];
                if (piece) {
                    const delta = action.result === 'CLOCKWISE' ? 90 : -90;
                    piece.orientation = (piece.orientation + delta + 360) % 360;
                    console.log(`[DEBUG] Rotated piece at (${fromCoords.x}, ${fromCoords.y})`);
                }
            }
            break;
            
        case ACTION_TYPES.MOVE:
            const toCoords = cellToCoords(action.result);
            if (fromCoords && toCoords) {
                console.log(`[DEBUG] Moving from (${fromCoords.x}, ${fromCoords.y}) to (${toCoords.x}, ${toCoords.y})`);
                
                // Vérifier si destination est vide
                if (board[toCoords.y][toCoords.x] !== null) {
                    console.error(`[ERROR] Trying to move to occupied cell (${toCoords.x}, ${toCoords.y})`);
                    return;
                }
                
                board[toCoords.y][toCoords.x] = board[fromCoords.y][fromCoords.x];
                board[fromCoords.y][fromCoords.x] = null;
            }
            break;
            
        case ACTION_TYPES.PLACE:
            const destCoords = cellToCoords(action.result.destination);
            if (destCoords) {
                console.log(`[DEBUG] Placing pyramid at (${destCoords.x}, ${destCoords.y}), orientation: ${action.result.orientation}`);
                
                if (board[destCoords.y][destCoords.x] !== null) {
                    console.error(`[ERROR] Trying to place on occupied cell (${destCoords.x}, ${destCoords.y}):`, 
                                  board[destCoords.y][destCoords.x]);
                    return;
                }
                
                board[destCoords.y][destCoords.x] = {
                    type: PIECE_TYPES.PYRAMID,
                    player: player,
                    orientation: action.result.orientation % 180 === 9 ? 90 : 0
                };
                
                if (board === gameState.board) {
                    if (player === gameState.myPlayer) {
                        gameState.myReserve--;
                        console.log(`[DEBUG] My reserve: ${gameState.myReserve}`);
                    } else {
                        gameState.opponentReserve--;
                        console.log(`[DEBUG] Opponent reserve: ${gameState.opponentReserve}`);
                    }
                }
            }
            break;
            
        case ACTION_TYPES.EXCHANGE:
            const toExchangeCoords = cellToCoords(action.result);
            if (fromCoords && toExchangeCoords) {
                console.log(`[DEBUG] Exchanging (${fromCoords.x}, ${fromCoords.y}) with (${toExchangeCoords.x}, ${toExchangeCoords.y})`);
                
                const temp = board[fromCoords.y][fromCoords.x];
                board[fromCoords.y][fromCoords.x] = board[toExchangeCoords.y][toExchangeCoords.x];
                board[toExchangeCoords.y][toExchangeCoords.x] = temp;
                
                if (board === gameState.board) {
                    const targetPiece = board[fromCoords.y][fromCoords.x];
                    if (targetPiece) {
                        if (targetPiece.type === PIECE_TYPES.SPHINX) {
                            gameState.scarabCooldowns.sphinx = 4;
                        }
                        if (targetPiece.type === PIECE_TYPES.PHARAOH) {
                            gameState.scarabCooldowns.pharaoh = 4;
                        }
                    }
                }
            }
            break;
    }
}

/**
 * Vérifie si une action est un swap avec le Sphinx
 */
function isSwapWithSphinx(action) {
    if (action.action !== ACTION_TYPES.EXCHANGE) return false;
    
    const coords = cellToCoords(action.result);
    if (!coords) return false;
    
    const piece = gameState.board[coords.y][coords.x];
    return piece && piece.type === PIECE_TYPES.SPHINX;
}

/**
 * Décrément les cooldowns du Scarab
 */
function decrementCooldowns() {
    if (gameState.scarabCooldowns.sphinx > 0) {
        gameState.scarabCooldowns.sphinx--;
    }
    if (gameState.scarabCooldowns.pharaoh > 0) {
        gameState.scarabCooldowns.pharaoh--;
    }
}

// UTILITY FUNCTIONS
const SPECIAL_CELLS = {
  RESERVE_P1: -1,    // Réserve joueur 1
  RESERVE_P2: -2     // Réserve joueur 2
};

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
 * Convertit des coordonnées (x, y) en Cell
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
 * Vérifie si une Cell est valide
 */
function isValidCell(x, y = null) {
  // Si appelé avec un seul argument (cell number)
  if (y === null) {
    const cell = x;
    return (
      cell === SPECIAL_CELLS.RESERVE_P1 ||
      cell === SPECIAL_CELLS.RESERVE_P2 ||
      (typeof cell === 'number' && cell >= 0 && cell < TOTAL_CELLS)
    );
  }
  
  // Si appelé avec deux arguments (x, y coordinates)
  return (
    typeof x === 'number' && 
    typeof y === 'number' &&
    x >= 0 && x < BOARD_SIZE && 
    y >= 0 && y < BOARD_SIZE
  );
}


/**
 * Récupère les pièces adjacentes à une position (x, y)
 */
function getAdjacentPieces(x, y) {
    const pieces = [];
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    
    for (const [dx, dy] of deltas) {
        const nx = x + dx;
        const ny = y + dy;
        
        // Vérifier que les coordonnées sont valides
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            const piece = gameState.board[ny][nx];
            if (piece) {
                pieces.push(piece);
            }
        }
    }
    
    return pieces;
}