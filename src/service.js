import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

export function createService({
  now = Date.now,
  ttlMs = 60_000,
} = {}) {
  const challenges = new Map();
  const receipts = new Map();

  const terms = {
    network: "stellar:testnet",
    asset: "native:XLM",
    recipient: "local-demo-recipient",
    amountStroops: "1000000",
  };

  function respond(response, status, body) {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(body));
  }

  // In-process simulation only. No HTTP endpoint can mint receipts.
  function simulatePayment(challengeId) {
    const challenge = challenges.get(challengeId);

    if (!challenge || challenge.expiresAt <= now()) {
      throw new Error("Unknown or expired challenge");
    }

    const receiptId = `simulated:${randomUUID()}`;
    receipts.set(receiptId, challengeId);
    return receiptId;
  }

  const server = createServer((request, response) => {
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      respond(response, 405, { error: "Method not allowed" });
      return;
    }

    if (request.url === "/health") {
      respond(response, 200, { status: "ok", mode: "simulation" });
      return;
    }

    if (request.url !== "/resource") {
      respond(response, 404, { error: "Resource not found" });
      return;
    }

    const receiptId = request.headers["payment-receipt"];

    if (receiptId !== undefined) {
      const challengeId = receipts.get(receiptId);
      const challenge = challenges.get(challengeId);

      if (
        !challenge ||
        challenge.resource !== request.url ||
        challenge.expiresAt <= now()
      ) {
        respond(response, 403, {
          error: "Invalid, expired, or consumed receipt",
        });
        return;
      }

      // No await between validation and consumption.
      receipts.delete(receiptId);
      challenges.delete(challengeId);

      respond(response, 200, {
        resource: "/resource",
        content: {
          title: "Small-business planning checklist",
          items: [
            "Identify the customer need",
            "Estimate delivery costs",
            "Set a spending budget",
          ],
        },
        payment: { mode: "simulation", challengeId },
      });
      return;
    }

    // Remove expired entries before creating another challenge.
    for (const [id, challenge] of challenges) {
      if (challenge.expiresAt <= now()) challenges.delete(id);
    }

    for (const [id, challengeId] of receipts) {
      if (!challenges.has(challengeId)) receipts.delete(id);
    }

    const challenge = {
      version: 1,
      id: randomUUID(),
      resource: "/resource",
      ...terms,
      expiresAt: now() + ttlMs,
    };

    challenges.set(challenge.id, challenge);
    respond(response, 402, { mode: "simulation", challenge });
  });

  return { server, simulatePayment, terms };
}
