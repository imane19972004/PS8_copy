/**
 * Game Controller avec toutes les routes
 */

import GameEngine from '../core/GameEngine.js';
import Logger from '../utils/ServerLogger.js';

// IN-MEMORY GAME STORAGE
const games = new Map();

class GameSession {
    constructor(gameId, mode, players = []) {
        this.gameId = gameId;
        this.mode = mode;
        this.players = players;
        this.logger = new Logger();
        this.engine = new GameEngine(this.logger);
        this.engine.init();
        this.createdAt = new Date();
        this.lastAction = null;
    }

    getState() {
        return {
            gameId: this.gameId,
            mode: this.mode,
            players: this.players,
            gameState: this.engine.getGameState(),
            logs: this.logger.getLogs()
        };
    }

    executeAction(action) {
        const result = this.engine.executeAction(action);
        this.lastAction = action;
        return {
            ...result,
            lastLaserEvents: this.engine.lastLaserEvents
        };
    }
}

// CONTROLLERS

/**
 * CREATE GAME
 * POST /api/game/create
 * Body: { mode: 'local'|'ai'|'online', players: [...] }
 */
export async function createGame(data, res) {
    try {
        const { mode, players } = data;

        if (!mode || !['local', 'ai', 'online'].includes(mode)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Invalid mode. Must be: local, ai, or online' 
            }));
            return;
        }

        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const game = new GameSession(gameId, mode, players || []);
        games.set(gameId, game);

        console.log(`[GAME] Created game ${gameId} (mode: ${mode})`);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            gameId,
            state: game.getState()
        }));

    } catch (error) {
        console.error('[GAME] Error creating game:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * GET GAME STATE
 * GET /api/game/state?gameId=xxx
 */
export async function getGameState(query, res) {
    try {
        const { gameId } = query;

        if (!gameId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing gameId parameter' }));
            return;
        }

        const game = games.get(gameId);

        if (!game) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Game not found' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            state: game.getState()
        }));

    } catch (error) {
        console.error('[GAME] Error getting game state:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * EXECUTE ACTION
 * POST /api/game/action
 * Body: { gameId, action }
 */
export async function executeAction(data, res) {
    try {
        const { gameId, action } = data;

        if (!gameId || !action) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing gameId or action' }));
            return;
        }

        const game = games.get(gameId);

        if (!game) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Game not found' }));
            return;
        }

        if (game.engine.gameOver) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: 'Game is over',
                winner: game.engine.winner 
            }));
            return;
        }

        const result = game.executeAction(action);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: result.success,
            result,
            lastLaserEvents: result.lastLaserEvents,
            state: game.getState()
        }));

    } catch (error) {
        console.error('[GAME] Error executing action:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }));
    }
}

/**
 * GET VALID MOVES
 * GET /api/game/moves?gameId=xxx&x=5&y=3
 */
export async function getValidMoves(query, res) {
    try {
        const { gameId, x, y } = query;

        const game = games.get(gameId);
        if (!game) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Game not found' }));
            return;
        }

        const piece = game.engine.board.getPieceAt(parseInt(x), parseInt(y));
        if (!piece) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No piece at this position' }));
            return;
        }

        const moves = game.engine.getValidMovesForPiece(piece);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            moves
        }));

    } catch (error) {
        console.error('[GAME] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * GET VALID ACTIONS
 * GET /api/game/actions?gameId=xxx&x=5&y=3
 */
export async function getValidActions(query, res) {
    try {
        const { gameId, x, y } = query;

        const game = games.get(gameId);
        if (!game) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Game not found' }));
            return;
        }

        const piece = game.engine.board.getPieceAt(parseInt(x), parseInt(y));
        if (!piece) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No piece at this position' }));
            return;
        }

        const actions = game.engine.getValidActionsForPiece(piece);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            actions
        }));

    } catch (error) {
        console.error('[GAME] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * GET VALID PLACEMENTS
 * GET /api/game/placements?gameId=xxx
 */
export async function getValidPlacements(query, res) {
    try {
        const { gameId } = query;

        const game = games.get(gameId);
        if (!game) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Game not found' }));
            return;
        }

        const placements = game.engine.getValidPyramidPlacements();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            placements
        }));

    } catch (error) {
        console.error('[GAME] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// CLEANUP OLD GAMES
setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000 * 5;

    games.forEach((game, gameId) => {
        if (now - game.createdAt.getTime() > maxAge) {
            console.log(`[GAME] Removing old game: ${gameId}`);
            games.delete(gameId);
        }
    });
}, 30 * 60 * 1000);