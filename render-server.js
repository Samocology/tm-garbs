import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const serverModule = await import("./dist/server/server.js");
const handler = serverModule.default;

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    const url = req.url;
    
    // Serve static assets from dist/client
    if (url.startsWith('/assets/') || url.startsWith('/favicon.ico')) {
      const filePath = join(process.cwd(), 'dist/client', url);
      try {
        const data = await readFile(filePath);
        const ext = extname(filePath);
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        res.end(data);
        return;
      } catch (e) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
    }
    
    // For all other requests, use the SSR handler
    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const fullUrl = `${protocol}://${host}${req.url}`;
    
    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    });
    
    const webResponse = await handler.fetch(webRequest);
    
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      const stream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          res.write(value);
        }
      };
      stream();
    } else {
      res.end();
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});