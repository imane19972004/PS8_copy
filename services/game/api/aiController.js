const { aiActionToGameAction, isValidAIAction } = require('../utils/ActionAdapter.js');
const { cellToCoords, coordsToCell, flipCell } = require('../utils/CellConverter.js');
const BOARD_SIZE = 10;

// AI MODULE LOADER
let aiModule = null;

try {
    aiModule = require('../ai/sphinx.js');
    console.log('[AI] Module loaded successfully');
} catch (error) {
    console.error('[AI] Failed to load AI module:', error.message);
}

// ======= AI CONTROLLER =======

/**
 * GET NEXT AI MOVE
 * POST /api/ai/move
 * Body: { gameState: {...}, opponentAction: {...} }
 */
async function getNextMove(data, res) {
    try {
        if (!aiModule) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'AI module not loaded' }));
            return;
        }

        const { gameState, opponentAction } = data;

        if (!gameState) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing gameState' }));
            return;
        }

        console.log('[AI] Computing next move...');
        const startTime = Date.now();

        let convertedOpponentAction = null;
        if (opponentAction) {
            if (opponentAction.type && opponentAction.params) {
                const { gameActionToAIAction } = require('../utils/ActionAdapter.js');

                // Convertir puis flipper coords
                const aiAction = gameActionToAIAction(opponentAction);

                if (aiAction.cell) aiAction.cell = adjustForAI(aiAction.cell);
                if (aiAction.result && typeof aiAction.result === 'number') {
                    aiAction.result = adjustForAI(aiAction.result);
                } else if (aiAction.result && typeof aiAction.result === 'object') {
                    aiAction.result = {
                        ...aiAction.result,
                        destination: adjustForAI(aiAction.result.destination)
                    };
                }

                convertedOpponentAction = aiAction;
            } else {
                convertedOpponentAction = opponentAction;
            }
        }

        // Call AI module
        const nextMove = await aiModule.nextMove(convertedOpponentAction);

        const duration = Date.now() - startTime;
        console.log(`[AI] Move computed in ${duration}ms`);

        if (duration > 250) {
            console.warn(`[AI] Warning: AI took ${duration}ms (max: 250ms)`);
        }
        if (!isValidAIAction(nextMove)) {
            throw new Error(`AI returned invalid action: ${JSON.stringify(nextMove)}`);
        }

        // Adapter le move de l'IA pour le Game Engine
        const adaptedMove = aiActionToGameAction({
            ...nextMove,
            cell: adjustForAI(nextMove.cell),
            result: adjustForAI(nextMove.result)
        }, gameState);
        console.log('[AI] Adapted move for Game Engine:', adaptedMove);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            action: adaptedMove,
            computationTime: duration
        }));

    } catch (error) {
        console.error('[AI] Error computing move:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'AI computation failed',
            details: error.message
        }));
    }
};

/**
 * SETUP AI
 * POST /api/ai/setup
 * Body: { initialPositions: {...}, isFirstPlayer: boolean }
 */
async function setupAI(data, res) {
    try {
        if (!aiModule) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'AI module not loaded' }));
            return;
        }

        const { initialPositions, isFirstPlayer } = data;
        console.log('Initial Positions from the front-end:', initialPositions);

        if (!initialPositions || isFirstPlayer === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing initialPositions or isFirstPlayer' }));
            return;
        }

        console.log('[AI] Setting up...');
        const startTime = Date.now();

        const flippedPositions = {};
        for (const [piece, value] of Object.entries(initialPositions)) {
            if (typeof value === 'number') {
                flippedPositions[piece] = flipCell(value);
            } else if (typeof value === 'object' && value.position !== undefined) {
                flippedPositions[piece] = {
                    ...value,
                    position: flipCell(value.position)
                };
            }
        }

        console.log('[AI] Flipped initial positions for board:', flippedPositions);

        // Call AI setup (max 1000ms)
        const result = await aiModule.setup(flippedPositions, isFirstPlayer);

        const duration = Date.now() - startTime;
        console.log(`[AI] Setup completed in ${duration}ms`);

        if (duration > 1000) {
            console.warn(`[AI] Warning: Setup took ${duration}ms (max: 1000ms)`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: result,
            setupTime: duration
        }));

    } catch (error) {
        console.error('[AI] Error during setup:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'AI setup failed',
            details: error.message
        }));
    }
}

/**
 * Flip vertical pour l'IA
 * - input: cell number ou {x, y}
 */
function adjustForAI(cellOrCoords) {
    if (typeof cellOrCoords === 'number') {
        // Convert Cell -> coords
        const coords = cellToCoords(cellOrCoords);
        if (!coords) return cellOrCoords;
        const flippedY = BOARD_SIZE - 1 - coords.y;
        return coordsToCell(coords.x, flippedY);
    } else if (cellOrCoords && cellOrCoords.x !== undefined && cellOrCoords.y !== undefined) {
        // coords -> coords inversées
        return {
            x: cellOrCoords.x,
            y: BOARD_SIZE - 1 - cellOrCoords.y
        };
    }
    return cellOrCoords;
}

module.exports = {
    getNextMove,
    setupAI
};