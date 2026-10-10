import { createService } from "./service.js";

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer from 1 to 65535");
}

const { server } = createService();

server.listen(port, "127.0.0.1", () => {
  console.log(`Local service: http://127.0.0.1:${port}`);
  console.log("Simulation mode. Run npm run demo for the complete flow.");
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
