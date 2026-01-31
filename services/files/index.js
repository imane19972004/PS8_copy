const http = require('http');
const fileQuery = require('./logic.js');

const PORT = 8001;

const server = http.createServer(function (request, response) {
  console.log(`Received query for a file: ${request.url}`);
  fileQuery.manage(request, response);
});

server.listen(PORT, () => {
  console.log(`\n📁 File Service started on port ${PORT}`);
  console.log(`   Open: http://localhost:8000/index.html\n`);
});