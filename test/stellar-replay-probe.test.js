import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBudget } from "../src/stellar/budget.js";
import { probeReplay } from "../src/stellar/replay-probe.js";
import { context } from "../fixtures/payment-context.js";

const originalHash = "a".repeat(64);

function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "stellar-replay-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  return createBudget({
    path: join(directory, "budget.json"),
    limitAtomic: "200000",
  });
}

function options(budget, hash = originalHash) {
  return {
    budget,
    context,
    amountAtomic: "100000",
    originalHash,
    url: "http://127.0.0.1:3001/resource",
    headers: { "PAYMENT-SIGNATURE": "synthetic-test-payload" },
    httpClient: {
      getPaymentSettleResponse: () => ({
        success: true,
        network: "stellar:testnet",
        transaction: hash,
      }),
    },
    verify: async (receivedHash) => ({
      hash: receivedHash,
      network: context.network,
      amountAtomic: "100000",
      ledger: 123,
    }),
  };
}

test("probe resends the same headers once and preserves refused outcomes", async (t) => {
  const budget = setup(t);
  const input = options(budget);
  let calls = 0;

  const result = await probeReplay({
    ...input,
    fetchImpl: async (url, request) => {
      calls++;
      assert.equal(url, input.url);
      assert.strictEqual(request.headers, input.headers);
      assert.equal(request.redirect, "error");

      return { status: 402, text: async () => "" };
    },
  });

  assert.equal(calls, 1);
  assert.equal(result.budgetStatus, "pending");
  assert.equal(budget.snapshot().remainingAtomic, "100000");
});

test("a repeated original hash does not settle a second reservation", async (t) => {
  const budget = setup(t);

  const result = await probeReplay({
    ...options(budget),
    fetchImpl: async () => ({
      status: 200,
      headers: new Headers(),
      text: async () => "{}",
    }),
  });

  assert.equal(result.transaction, originalHash);
  assert.equal(result.budgetStatus, "pending");
});

test("a different verified settlement is recorded against the contingency", async (t) => {
  const budget = setup(t);
  const newHash = "b".repeat(64);

  const result = await probeReplay({
    ...options(budget, newHash),
    fetchImpl: async () => ({
      status: 200,
      headers: new Headers(),
      text: async () => "{}",
    }),
  });

  assert.equal(result.budgetStatus, "settled");
  assert.equal(budget.snapshot().payments[0].hash, newHash);
});

test("transport failure leaves contingency funds reserved", async (t) => {
  const budget = setup(t);

  await assert.rejects(
    probeReplay({
      ...options(budget),
      fetchImpl: async () => {
        throw new Error("Connection interrupted");
      },
    }),
    /Connection interrupted/,
  );

  assert.equal(budget.snapshot().payments[0].status, "pending");
});
