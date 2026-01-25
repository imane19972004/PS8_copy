// services/game/index.js

const http = require('http');
const socketIO = require('socket.io');
const GameManager = require('./GameManager');

// Create HTTP server
const server = http.createServer();

// Initialize Socket.io with CORS
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ========================================
// GAME MANAGER INSTANCE
// ========================================
const gameManager = new GameManager();

// Nettoyage périodique des vieilles parties
setInterval(() => {
  gameManager.cleanupOldGames();
}, 1000 * 60 * 10); // Toutes les 10 minutes

// ========================================
// NAMESPACE: /api/game
// ========================================
const gameNamespace = io.of('/api/game');

gameNamespace.on('connection', (socket) => {
  console.log(`[GAME] Client connected: ${socket.id}`);

  // Test ping/pong
  socket.on('ping', () => {
    console.log(`[GAME] Ping from ${socket.id}`);
    socket.emit('pong', { 
      message: 'pong from /api/game',
      timestamp: Date.now() 
    });
  });

  // ========================================
  // TASK-009: Créer une partie
  // ========================================
  socket.on('create-game', (data) => {
    try {
      console.log(`[GAME] Create game request from ${socket.id}:`, data);
      
      const gameInfo = gameManager.createGame({
        vsAI: data.vsAI || false,
        player1Name: data.playerName || 'Player 1'
      });

      // Associe le socket au joueur 1
      const game = gameManager.getGame(gameInfo.gameId);
      game.players.player1.socketId = socket.id;
      game.players.player1.isConnected = true;

      // Change phase en 'playing'
      game.gameState.phase = 'playing';

      // Envoie la confirmation au client
      socket.emit('game-created', {
        success: true,
        gameId: gameInfo.gameId,
        gameState: gameInfo.gameState,
        players: gameInfo.players,
        yourPlayer: 1
      });

      console.log(`[GAME] ✅ Game created: ${gameInfo.gameId}`);
      
    } catch(error) {
      console.error(`[GAME] ❌ Error creating game:`, error.message);
      socket.emit('game-error', { 
        error: 'Failed to create game',
        details: error.message 
      });
    }
  });

  // ========================================
  // Action du joueur
  // ========================================
  socket.on('player-action', (data) => {
    try {
      const { gameId, action } = data;
      console.log(`[GAME] Player action in ${gameId}:`, action);

      // Applique l'action
      const newState = gameManager.applyAction(gameId, action);

      // Broadcast le nouvel état à tous les joueurs de cette partie
      socket.emit('game-updated', {
        gameState: newState,
        lastAction: action
      });

      // ========================================
      // ✨ TASK-018: Si c'est une partie vs AI, déclenche l'IA
      // ========================================
      const game = gameManager.getGame(gameId);
      if (game.vsAI && newState.currentPlayer === 2 && game.ai) {
        // L'IA réfléchit
        socket.emit('ai-thinking', { gameId });
        
        setTimeout(() => {
          try {
            // L'IA calcule son coup
            const aiAction = game.ai.nextMove(action);
            
            console.log(`[GAME] 🤖 AI plays:`, aiAction);
            
            // Applique l'action de l'IA
            const aiState = gameManager.applyAction(gameId, aiAction);
            
            // Envoie l'action de l'IA au client
            socket.emit('ai-action', aiAction);
            socket.emit('game-updated', {
              gameState: aiState,
              lastAction: aiAction
            });
            
          } catch(error) {
            console.error(`[GAME] ❌ AI error:`, error);
            socket.emit('game-error', { 
              error: 'AI failed to play',
              details: error.message 
            });
          }
        }, 500); // Délai pour que ça soit visible
      }

    } catch(error) {
      console.error(`[GAME] ❌ Error processing action:`, error.message);
      socket.emit('game-error', { 
        error: 'Invalid action',
        details: error.message 
      });
    }
  });

  // ========================================
  // TASK-012: Déconnexion
  // ========================================
  socket.on('disconnect', (reason) => {
    console.log(`[GAME] Client disconnected: ${socket.id} - ${reason}`);
    gameManager.handleDisconnect(socket.id);
  });

  // Stats pour debug
  socket.on('get-stats', () => {
    socket.emit('stats', gameManager.getStats());
  });
});

// ========================================
// ROOT NAMESPACE (for health checks)
// ========================================
io.on('connection', (socket) => {
  console.log(`[ROOT] Client connected: ${socket.id}`);

  socket.on('health-check', () => {
    const stats = gameManager.getStats();
    socket.emit('health-status', { 
      status: 'ok', 
      service: 'game',
      stats 
    });
  });

  socket.on('disconnect', () => {
    console.log(`[ROOT] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.GAME_SERVICE_PORT || 8002;
server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` 🎮 Game Service with GameManager + AI`);
  console.log(` Socket.io listening on port ${PORT}`);
  console.log(` Namespaces available:`);
  console.log(`   - / (root - health checks)`);
  console.log(`   - /api/game (game operations)`);
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});