import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const PORT = process.env.PORT || 5173;
const DIST = path.join(process.cwd(), 'dist');

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://openrouter.ai https://*.supabase.co https://pofpmyiqjtwjesisytbd.supabase.co https://*.onrender.com https://chartai-wy7a.onrender.com https://*.netlify.app https://chartaanalyst.netlify.app https://generativelanguage.googleapis.com;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const YAHOO_HOST = 'query1.finance.yahoo.com';
const YAHOO_BASE = `https://${YAHOO_HOST}`;

function proxyYahoo(req, res) {  const target = `${YAHOO_BASE}${req.url.slice('/__yahoo'.length)}`;
  const headers = {};
  for (const h of ['accept', 'accept-encoding', 'cache-control', 'if-none-match', 'if-modified-since']) {
    if (req.headers[h]) headers[h] = req.headers[h];
  }
  headers['user-agent'] = 'Mozilla/5.0';
  headers['accept'] = headers['accept'] || 'application/json';

  const proxyReq = https.request(
    target,
    { method: 'GET', headers, hostname: YAHOO_HOST },
    (proxyRes) => {
      const respHeaders = {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        'Cache-Control': proxyRes.headers['cache-control'] || 'no-cache',
      };
      if (proxyRes.headers['content-encoding']) {
        respHeaders['Content-Encoding'] = proxyRes.headers['content-encoding'];
      }
      res.writeHead(proxyRes.statusCode, respHeaders);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (err) => {
    console.error('Yahoo proxy error:', err.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  });
  proxyReq.end();
}

function proxyNews(req, res) {
  const target = `https://news.google.com${req.url.slice('/__news'.length)}`;
  const proxyReq = https.request(
    target,
    { method: 'GET', headers: { 'user-agent': 'Mozilla/5.0', 'accept': 'application/rss+xml, text/xml, application/xml, */*' }, hostname: 'news.google.com' },
    (proxyRes) => {
      const respHeaders = {
        'Content-Type': proxyRes.headers['content-type'] || 'application/rss+xml; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      };
      res.writeHead(proxyRes.statusCode, respHeaders);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (err) => {
    console.error('News proxy error:', err.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('News proxy error');
  });
  proxyReq.end();
}

const server = http.createServer((req, res) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.url.startsWith('/__yahoo/')) {
    return proxyYahoo(req, res);
  }

  if (req.url.startsWith('/__news/')) {
    return proxyNews(req, res);
  }

  const urlPath = req.url.split('?')[0];
  const filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(DIST, 'index.html'), (e, d) => {
          if (e) { res.writeHead(404); res.end('Not Found'); }
          else { res.writeHead(200, { 'Content-Type': 'text/html', ...securityHeaders }); res.end(d); }
        });
      } else { res.writeHead(500); res.end('Server Error'); }
    } else {
      res.writeHead(200, { 'Content-Type': contentType, ...securityHeaders });
      res.end(data);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
