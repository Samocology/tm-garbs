import { createServer } from "node:http";

const serverModule = await import("./dist/server/server.js");
const handler = serverModule.default;

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    // Build full URL from the request
    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const url = `${protocol}://${host}${req.url}`;
    
    // Create web Request object
    const webRequest = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    });
    
    // Use the fetch handler
    const webResponse = await handler.fetch(webRequest);
    
    // Convert web Response back to Node.js response
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