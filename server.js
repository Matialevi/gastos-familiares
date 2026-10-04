const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' };

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  let file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root)) return res.writeHead(403).end();
  fs.stat(file, (err, stat) => {
    if ((err || !stat.isFile()) && path.extname(pathname)) return res.writeHead(404).end('No encontrado');
    if (err || !stat.isFile()) file = path.join(root, 'index.html');
    fs.readFile(file, (readErr, data) => {
      if (readErr) return res.writeHead(404).end('No encontrado');
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(data);
    });
  });
}).listen(port, '0.0.0.0', () => console.log(`Gastos Familiares: http://localhost:${port}`));
