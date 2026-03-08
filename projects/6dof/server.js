const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HTTPS_PORT = 8443;
const HTTP_PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.ply': 'application/octet-stream',
  '.splat': 'application/octet-stream',
  '.spz': 'application/octet-stream',
  '.sog': 'application/octet-stream',
  '.ksplat': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

function handleRequest(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  // API: client logging
  if (urlPath === '/api/client-log' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 64 * 1024) req.destroy(); });
    req.on('end', () => {
      try { console.log('[CLIENT]', JSON.parse(body)); } catch { console.log('[CLIENT]', body); }
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      res.end();
    });
    return;
  }

  const filePath = path.join(PUBLIC_DIR, urlPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=3600',
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

// HTTPS server (required for WebXR)
try {
  const certDir = path.join(__dirname, '.cert');
  const httpsOptions = {
    key: fs.readFileSync(path.join(certDir, 'key.pem')),
    cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
  };

  const httpsServer = https.createServer(httpsOptions, handleRequest);
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`\n  HTTPS server running (WebXR enabled):`);
    console.log(`    Local:   https://localhost:${HTTPS_PORT}`);
    console.log(`    Network: https://${getLocalIP()}:${HTTPS_PORT}`);
  });
} catch (e) {
  console.warn('HTTPS server failed to start:', e.message);
  console.warn('WebXR (VR/AR) requires HTTPS. Generate certs in .cert/ to enable.');
}

// HTTP server (fallback for basic viewing)
const httpServer = http.createServer(handleRequest);
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`\n  HTTP server running (no WebXR):`);
  console.log(`    Local:   http://localhost:${HTTP_PORT}`);
  console.log(`    Network: http://${getLocalIP()}:${HTTP_PORT}\n`);
});

function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}
