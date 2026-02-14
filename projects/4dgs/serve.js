import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const requestHandler = async (req, res) => {
  try {
    const requestedPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const fullPath = path.join(root, requestedPath);
    const safePath = path.normalize(fullPath);

    if (!safePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Access denied');
      return;
    }

    const stats = await fs.stat(safePath);
    if (stats.isDirectory()) {
      const indexPath = path.join(safePath, 'index.html');
      const content = await fs.readFile(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = await fs.readFile(safePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
    res.writeHead(code === 'ENOENT' ? 404 : 500);
    res.end(code === 'ENOENT' ? 'Not Found' : 'Server Error');
  }
};

const useHttps = ['1', 'true', 'yes'].includes(String(process.env.HTTPS || '').toLowerCase());
const certPath = process.env.HTTPS_CERT || path.join(root, 'certs', 'localhost.pem');
const keyPath = process.env.HTTPS_KEY || path.join(root, 'certs', 'localhost-key.pem');

let server;
let protocol = 'http';

if (useHttps) {
  if (!fsSync.existsSync(certPath) || !fsSync.existsSync(keyPath)) {
    console.error('HTTPS certificate files not found.');
    console.error(`Expected cert: ${certPath}`);
    console.error(`Expected key : ${keyPath}`);
    process.exit(1);
  }

  server = https.createServer(
    {
      cert: fsSync.readFileSync(certPath),
      key: fsSync.readFileSync(keyPath),
    },
    requestHandler,
  );
  protocol = 'https';
} else {
  server = http.createServer(requestHandler);
}

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Serving ${root} at ${protocol}://localhost:${port}`);
});
