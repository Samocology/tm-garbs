import { createServer } from "node:http";

const serverModule = await import("./dist/server/server.js");
const handler = serverModule.default;

console.log('Default export type:', typeof handler);
console.log('Default export keys:', Object.keys(handler));

// Try these possibilities
const actualHandler = handler.default || handler.fetch || handler.handler || handler.handleRequest || handler;

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    if (typeof actualHandler === 'function') {
      await actualHandler(req, res);
    } else {
      console.log('Still not a function. Properties:', Object.getOwnPropertyNames(handler));
      res.statusCode = 500;
      res.end("Server misconfiguration");
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