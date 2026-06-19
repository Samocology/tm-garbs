import { createServer } from "node:http";

// Dynamic import to load the built handler
const { default: handler } = await import("./dist/server/server.js");

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});