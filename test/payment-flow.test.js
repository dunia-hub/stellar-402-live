import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createService } from "../src/service.js";
import { validateChallenge } from "../src/policy.js";

async function setup(t, options = {}) {
  const service = createService(options);
  service.server.listen(0, "127.0.0.1");
  await once(service.server, "listening");

  t.after(async () => {
    await new Promise((resolve, reject) => {
      service.server.close((error) => error ? reject(error) : resolve());
      service.server.closeIdleConnections();
    });
  });

  const { port } = service.server.address();
  return { ...service, url: `http://127.0.0.1:${port}/resource` };
}

const policy = {
  network: "stellar:testnet",
  asset: "native:XLM",
  recipient: "local-demo-recipient",
  maxPaymentStroops: "1000000",
};

function validChallenge() {
  return {
    version: 1,
    id: "challenge-1",
    resource: "/resource",
    network: policy.network,
    asset: policy.asset,
    recipient: policy.recipient,
    amountStroops: "1000000",
    expiresAt: 2000,
  };
}

test("unpaid request receives terms without protected content", async (t) => {
  const { url } = await setup(t);
  const response = await fetch(url);
  const body = await response.json();

  assert.equal(response.status, 402);
  assert.equal(body.mode, "simulation");
  assert.equal(body.challenge.resource, "/resource");
  assert.equal(body.content, undefined);
});

test("valid simulated receipt unlocks the resource once", async (t) => {
  const { url, simulatePayment } = await setup(t);
  const { challenge } = await (await fetch(url)).json();
  const receipt = simulatePayment(challenge.id);
  const headers = { "Payment-Receipt": receipt };

  const paid = await fetch(url, { headers });
  assert.equal(paid.status, 200);
  assert.equal((await paid.json()).content.items.length, 3);

  const replay = await fetch(url, { headers });
  assert.equal(replay.status, 403);
});

test("fabricated receipt cannot unlock content", async (t) => {
  const { url } = await setup(t);
  const response = await fetch(url, {
    headers: { "Payment-Receipt": "fabricated" },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).content, undefined);
});

test("receipt expires at the challenge deadline", async (t) => {
  let clock = 1000;
  const { url, simulatePayment } = await setup(t, {
    now: () => clock,
    ttlMs: 100,
  });

  const { challenge } = await (await fetch(url)).json();
  const receipt = simulatePayment(challenge.id);
  clock = 1100;

  const response = await fetch(url, {
    headers: { "Payment-Receipt": receipt },
  });

  assert.equal(response.status, 403);
});

test("multiple receipts for one challenge cannot unlock twice", async (t) => {
  const { url, simulatePayment } = await setup(t);
  const { challenge } = await (await fetch(url)).json();
  const first = simulatePayment(challenge.id);
  const second = simulatePayment(challenge.id);

  const responses = await Promise.all([
    fetch(url, { headers: { "Payment-Receipt": first } }),
    fetch(url, { headers: { "Payment-Receipt": second } }),
  ]);

  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 403],
  );
});

test("policy accepts an amount at its spending ceiling", () => {
  assert.equal(validateChallenge(validChallenge(), policy, 1000), 1000000n);
});

test("policy refuses amounts above its spending ceiling", () => {
  const challenge = { ...validChallenge(), amountStroops: "1000001" };

  assert.throws(
    () => validateChallenge(challenge, policy, 1000),
    /spending limit/,
  );
});

test("policy refuses unapproved network, asset, and recipient", () => {
  for (const field of ["network", "asset", "recipient"]) {
    assert.throws(
      () => validateChallenge(
        { ...validChallenge(), [field]: "unapproved" },
        policy,
        1000,
      ),
      /not approved/,
    );
  }
});

test("policy refuses malformed and nonpositive amounts", () => {
  for (const amountStroops of ["0", "-1", "1.5", "1e6", "", 1000000]) {
    assert.throws(
      () => validateChallenge(
        { ...validChallenge(), amountStroops },
        policy,
        1000,
      ),
      /positive integer string/,
    );
  }
});

test("policy refuses expired challenges", () => {
  assert.throws(
    () => validateChallenge(validChallenge(), policy, 2000),
    /expired/,
  );
});
