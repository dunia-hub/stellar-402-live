import express from "express";
import { paymentMiddlewareFromConfig } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { readConfig } from "./config.js";
import { createManifest } from "./discovery.js";

const config = readConfig();
const app = express();

app.disable("x-powered-by");

app.get("/.well-known/stellar-402.json", (_request, response) => {
  response.set("Cache-Control", "no-store");
  response.json(createManifest());
});

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    network: config.network,
    mode: "stellar-x402",
  });
});

app.use(
  paymentMiddlewareFromConfig(
    {
      "GET /resource": {
        accepts: {
          scheme: "exact",
          price: config.price,
          network: config.network,
          payTo: config.recipient,
        },
      },
    },
    new HTTPFacilitatorClient({
      url: config.facilitatorUrl,
    }),
    [
      {
        network: config.network,
        server: new ExactStellarScheme(),
      },
    ],
  ),
);

app.get("/resource", (_request, response) => {
  response.set("Cache-Control", "no-store");
  response.json({
    resource: "/resource",
    content: {
      title: "Small-business planning checklist",
      items: [
        "Identify the customer need",
        "Estimate delivery costs",
        "Set a spending budget",
      ],
    },
  });
});

const server = app.listen(config.port, "127.0.0.1", () => {
  console.log(`Stellar x402 service: http://127.0.0.1:${config.port}`);
  console.log(`Network: ${config.network}`);
  console.log(`Recipient: ${config.recipient}`);
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
