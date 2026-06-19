import { createServer } from "node:http";

// Try importing the module differently
const serverModule = await import("./dist/server/server.js");
const handler = serverModule.default || serverModule.handler || serverModule;

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    if (typeof handler === 'function') {
      await handler(req, res);
    } else {
      console.log('Handler type:', typeof handler);
      console.log('Available exports:', Object.keys(serverModule));
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