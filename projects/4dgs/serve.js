import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
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

const certPath = process.env.HTTPS_CERT || path.join(root, 'certs', 'localhost.pem');
const keyPath = process.env.HTTPS_KEY || path.join(root, 'certs', 'localhost-key.pem');
const hasCertFiles = fsSync.existsSync(certPath) && fsSync.existsSync(keyPath);
const httpsEnv = String(process.env.HTTPS || '').toLowerCase();
const useHttps = httpsEnv
  ? ['1', 'true', 'yes'].includes(httpsEnv)
  : hasCertFiles;

let server;
let protocol = 'http';

if (useHttps) {
  if (!hasCertFiles) {
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
  if (!httpsEnv && !hasCertFiles) {
    console.warn('No HTTPS certs found, fallback to HTTP.');
    console.warn(`Place cert files at:`);
    console.warn(`- ${certPath}`);
    console.warn(`- ${keyPath}`);
  }
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
  console.log(`Serving ${root}`);
  console.log(`- Local:   ${protocol}://localhost:${port}`);

  if (host === '0.0.0.0' || host === '::') {
    const nets = os.networkInterfaces();
    const lanIps = new Set();

    for (const iface of Object.values(nets)) {
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === 'IPv4' && !addr.internal) {
          lanIps.add(addr.address);
        }
      }
    }

    for (const ip of lanIps) {
      console.log(`- Network: ${protocol}://${ip}:${port}`);
    }
  } else {
    console.log(`- Host:    ${protocol}://${host}:${port}`);
  }
});
