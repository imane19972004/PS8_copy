// services/game/index.js

const http = require('http');
const socketIO = require('socket.io');

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
// NAMESPACE: /api/game
// ========================================
const gameNamespace = io.of('/api/game');

gameNamespace.on('connection', (socket) => {
  console.log(`[GAME] Client connected: ${socket.id}`);

  // Test event
  socket.on('ping', () => {
    console.log(`[GAME] Ping from ${socket.id}`);
    socket.emit('pong', { 
      message: 'pong from /api/game',
      timestamp: Date.now() 
    });
  });

  // Future game events will go here
  socket.on('create-game', (data) => {
    console.log(`[GAME] Create game request from ${socket.id}:`, data);
    // TODO: Implement in next tasks
    socket.emit('game-created', { 
      status: 'pending',
      message: 'Game creation not yet implemented' 
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[GAME] Client disconnected: ${socket.id} - ${reason}`);
  });
});

// ========================================
// ROOT NAMESPACE (for health checks)
// ========================================
io.on('connection', (socket) => {
  console.log(`[ROOT] Client connected: ${socket.id}`);
  
  socket.on('health-check', () => {
    socket.emit('health-status', { status: 'ok', service: 'game' });
  });

  socket.on('disconnect', () => {
    console.log(`[ROOT] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.GAME_SERVICE_PORT || 8002;
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Game Service started successfully`);
  console.log(` Socket.io listening on port ${PORT}`);
  console.log(` Namespaces available:`);
  console.log(`   - / (root - health checks)`);
  console.log(`   - /api/game (game operations)`);
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log(`=============================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});