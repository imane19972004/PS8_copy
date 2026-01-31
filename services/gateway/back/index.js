const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');

// PROXY CONFIGURATION
const proxy = httpProxy.createProxyServer();

// Services ports
const SERVICES = {
    files: 'http://127.0.0.1:8001',
    game: 'http://127.0.0.1:8002'
};

// ERROR HANDLING
proxy.on('error', (err, req, res) => {
    console.error(`Proxy error: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway - Service unavailable' }));
});

// MAIN SERVER
http.createServer(function (request, response) {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    const method = request.method;

    console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

    try {
        // API ROUTES

        // GAME SERVICE ROUTES
        if (pathname.startsWith('/api/game') || pathname.startsWith('/api/ai')) {
            console.log('-> Routing to GAME service');
            return proxy.web(request, response, { target: SERVICES.game });
        }

        // STATIC FILES (DEFAULT)
        else {
            console.log('-> Routing to FILE service');
            return proxy.web(request, response, { target: SERVICES.files });
        }

    } catch (error) {
        console.error(`Error processing ${request.url}: ${error.message}`);
        response.statusCode = 400;
        response.end(JSON.stringify({ error: 'Bad Request' }));
    }

}).listen(8000, () => {
    console.log('');
    console.log('┌────────────────────────────────────────────────┐');
    console.log('│       GATEWAY SERVER RUNNING                   │');
    console.log('├────────────────────────────────────────────────┤');
    console.log('│   Port: 8000                                   │');
    console.log('│   http://localhost:8000                        │');
    console.log('├────────────────────────────────────────────────┤');
    console.log('│   Services:                                    │');
    console.log('│   - Files:  localhost:8001                     │');
    console.log('│   - Game:   localhost:8002                     │');
    console.log('├────────────────────────────────────────────────┤');
    console.log('│   Routes:                                      │');
    console.log('│   - /api/game/*  → Game Service                │');
    console.log('│   - /api/ai/*    → Game Service (AI)           │');
    console.log('│   - /*           → File Service                │');
    console.log('└────────────────────────────────────────────────┘');
    console.log('');
});