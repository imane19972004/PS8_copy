// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');

// We will need a proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();



// Proxy error handler
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + err.message);
  }
});


/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
 */


// Create HTTP server
const server = http.createServer(function (request, response) {
  // Remove "../" for security
  let filePath = request.url.split("/").filter(elem => elem !== "..");

  try {
    // API requests
    if (filePath[1] === "api") {
      console.log(`[GATEWAY] API request received: ${request.url}`);
      
      // TODO: Add more API routes here (user, social, etc.)
      // For now, all /api requests go to game service
      
      console.log(`[GATEWAY] Proxying to game service (8002)`);
      proxy.web(request, response, { 
        target: "http://127.0.0.1:8002"
      });
      
    // File requests
    } else {
      console.log(`[GATEWAY] File request: ${request.url}`);
      proxy.web(request, response, { 
        target: "http://127.0.0.1:8001" 
      });
    }
  } catch(error) {
    console.error(`[GATEWAY] Error processing ${request.url}:`, error);
    response.statusCode = 400;
    response.end(`Something went wrong: ${error.message}`);
  }
});

// WebSocket upgrade handling (for Socket.io)
server.on('upgrade', (request, socket, head) => {
  let filePath = request.url.split("/").filter(elem => elem !== "..");
  
  console.log(`[GATEWAY] WebSocket upgrade request: ${request.url}`);
  
  try {
    if (filePath[1] === "api") {
      console.log(`[GATEWAY] Proxying WebSocket to game service (8002)`);
      proxy.ws(request, socket, head, { 
        target: "ws://127.0.0.1:8002" 
      });
    } else {
      console.log(`[GATEWAY] Proxying WebSocket to file service (8001)`);
      proxy.ws(request, socket, head, { 
        target: "ws://127.0.0.1:8001" 
      });
    }
  } catch(error) {
    console.error(`[GATEWAY] WebSocket error:`, error);
    socket.destroy();
  }
});

// Start gateway
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` Gateway started successfully`);
  console.log(` Listening on port ${PORT}`);
  console.log(`Routing configuration:`);
  console.log(`   /api/*     → Game Service (8002)`);
  console.log(`   /*         → File Service (8001)`);
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log(`=============================================`);
});