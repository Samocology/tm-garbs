// start.js
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { createServer } from "node:http";

const handler = createStartHandler(defaultStreamHandler);

const server = createServer((req, res) => {
  handler(req, res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});