// AI MODULE LOADER
let aiModule = null;

try {
    const module = await import('../ai/sphinx.js');
    aiModule = module.default ?? module;
    console.log('[AI] Module loaded successfully');
} catch (error) {
    console.error('[AI] Failed to load AI module:', error.message);
}

// AI CONTROLLER

/**
 * GET NEXT AI MOVE
 * POST /api/ai/move
 * Body: { 
 *   gameState: {...},
 *   opponentAction: {...}
 * }
 */
export async function getNextMove(data, res) {
    try {
        if (!aiModule) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'AI module not loaded' 
            }));
            return;
        }

        const { gameState, opponentAction } = data;

        if (!gameState) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Missing gameState' 
            }));
            return;
        }

        console.log('[AI] Computing next move...');
        const startTime = Date.now();

        // Call AI module
        const nextMove = await aiModule.nextMove(opponentAction || null);

        const duration = Date.now() - startTime;
        console.log(`[AI] Move computed in ${duration}ms`);

        // Vérifier timeout (250ms max)
        if (duration > 250) {
            console.warn(`[AI] Warning: AI took ${duration}ms (max: 250ms)`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            action: nextMove,
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
 * Body: { 
 *   initialPositions: {...},
 *   isFirstPlayer: boolean
 * }
 */
export async function setupAI(data, res) {
    try {
        if (!aiModule) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'AI module not loaded' 
            }));
            return;
        }

        const { initialPositions, isFirstPlayer } = data;

        if (!initialPositions || isFirstPlayer === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Missing initialPositions or isFirstPlayer' 
            }));
            return;
        }

        console.log('[AI] Setting up...');
        const startTime = Date.now();

        // Call AI setup (max 1000ms)
        const result = await aiModule.setup(initialPositions, isFirstPlayer);

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
};