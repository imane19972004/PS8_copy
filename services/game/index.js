/**
 * Game Service - HTTP API Server
 */

const http = require('http');
const url = require('url');

const gameController = require('./api/gameController');
const aiController = require('./api/aiController');

const PORT = process.env.GAME_SERVICE_PORT || 8002;

// Helper to parse JSON body
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // GAME ROUTES
        // POST /api/game/create
        if (pathname === '/api/game/create' && method === 'POST') {
            const data = await parseBody(req);
            return gameController.createGame(data, res);
        }

        // GET /api/game/state
        if (pathname === '/api/game/state' && method === 'GET') {
            return gameController.getGameState(parsedUrl.query, res);
        }

        // POST /api/game/action
        if (pathname === '/api/game/action' && method === 'POST') {
            const data = await parseBody(req);
            return gameController.executeAction(data, res);
        }

        // GET /api/game/moves
        if (pathname === '/api/game/moves' && method === 'GET') {
            return gameController.getValidMoves(parsedUrl.query, res);
        }

        // GET /api/game/actions
        if (pathname === '/api/game/actions' && method === 'GET') {
            return gameController.getValidActions(parsedUrl.query, res);
        }

        // GET /api/game/placements
        if (pathname === '/api/game/placements' && method === 'GET') {
            return gameController.getValidPlacements(parsedUrl.query, res);
        }

        // AI ROUTES
        // POST /api/ai/move
        if (pathname === '/api/ai/move' && method === 'POST') {
            const data = await parseBody(req);
            return aiController.getNextMove(data, res);
        }

        // POST /api/ai/setup
        if (pathname === '/api/ai/setup' && method === 'POST') {
            const data = await parseBody(req);
            return aiController.setupAI(data, res);
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Not Found',
            path: pathname 
        }));

    } catch (error) {
        console.error('[ERROR]', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Internal Server Error',
            message: error.message 
        }));
    }
});

// Start Server
server.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   GAME SERVICE - HTTP API                 ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log(`║   Port: ${PORT}                              ║`);
    console.log(`║   Started: ${new Date().toISOString()}   ║`);
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║   Available Routes:                       ║');
    console.log('║   POST /api/game/create                   ║');
    console.log('║   GET  /api/game/state                    ║');
    console.log('║   POST /api/game/action                   ║');
    console.log('║   GET  /api/game/moves                    ║');
    console.log('║   GET  /api/game/actions                  ║');
    console.log('║   GET  /api/game/placements               ║');
    console.log('║   POST /api/ai/move                       ║');
    console.log('║   POST /api/ai/setup                      ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received - closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received - closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});