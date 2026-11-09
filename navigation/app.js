'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const files = {
  '/': {
    content: fs.readFileSync(path.join(__dirname, 'index.html')),
    type: 'text/html; charset=utf-8'
  },
  '/styles.css': {
    content: fs.readFileSync(path.join(__dirname, 'styles.css')),
    type: 'text/css; charset=utf-8'
  },
  '/navigation.js': {
    content: fs.readFileSync(path.join(__dirname, 'navigation.js')),
    type: 'text/javascript; charset=utf-8'
  }
};

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url, 'http://localhost').pathname;
  } catch (error) {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  const file = files[pathname] || files['/'];
  response.writeHead(200, {
    'Content-Type': file.type,
    'Content-Length': file.content.length,
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(request.method === 'HEAD' ? undefined : file.content);
});

const port = Number(process.env.PORT) || 4174;
server.listen(port, '127.0.0.1', () => {
  console.log(`ClubSphere navigation preview running at http://127.0.0.1:${port}`);
});