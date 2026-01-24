const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8001;

const server = http.createServer((req, res) => {
    // Si l’URL est '/', on sert index.html
    let filePath = path.join(__dirname, 'front', req.url === '/' ? 'index.html' : req.url);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found!');
            console.error(`File not found: ${filePath}`);
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
            console.log(`Served file: ${filePath}`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`📁 File Service started on port ${PORT}`);
});
