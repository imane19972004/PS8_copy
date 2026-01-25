const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer();

proxy.on('error', (err, req, res) => {
  console.error('[GATEWAY] ❌ Proxy error:', err.message);
  if (res && res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  }
});

const server = http.createServer(function (request, response) {
  let filePath = request.url.split("/").filter(elem => elem !== "..");

  try {
    if (filePath[1] === "api") {
      console.log(`[GATEWAY] 🎮 API → Game (8002): ${request.url}`);
      proxy.web(request, response, { target: "http://127.0.0.1:8002" });
    } else {
      console.log(`[GATEWAY] 📁 File → Files (8001): ${request.url}`);
      proxy.web(request, response, { target: "http://127.0.0.1:8001" });
    }
  } catch(error) {
    console.error(`[GATEWAY] ❌ Error:`, error.message);
    response.statusCode = 500;
    response.end('Error');
  }
});

// ========================================
// ✅ WEBSOCKET ROUTING - VERSION FINALE CORRIGÉE
// ========================================
server.on('upgrade', (request, socket, head) => {
  const url = request.url;
  console.log(`[GATEWAY] 🔌 WebSocket upgrade: ${url}`);
  
  try {
    // Socket.io pour /api/game envoie : /socket.io/?EIO=4&transport=websocket&ns=%2Fapi%2Fgame
    // On vérifie si le namespace /api/game est présent
    const hasApiGameNamespace = url.includes('ns=%2Fapi%2Fgame') || 
                                url.includes('ns=/api/game') ||
                                url.includes('/api/game');
    
    if (hasApiGameNamespace) {
      console.log(`[GATEWAY] ✅ Routing WebSocket → Game Service (8002)`);
      proxy.ws(request, socket, head, { target: "ws://127.0.0.1:8002" });
    } else {
      console.log(`[GATEWAY] ✅ Routing WebSocket → File Service (8001)`);
      proxy.ws(request, socket, head, { target: "ws://127.0.0.1:8001" });
    }
  } catch(error) {
    console.error(`[GATEWAY] ❌ WebSocket error:`, error.message);
    socket.destroy();
  }
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Gateway STARTED on port ${PORT}`);
  console.log(`   HTTP /api/*    → Game Service (8002)`);
  console.log(`   HTTP /*        → File Service (8001)`);
  console.log(`   WebSocket      → Auto-routed by namespace`);
  console.log(`${'='.repeat(50)}\n`);
});
