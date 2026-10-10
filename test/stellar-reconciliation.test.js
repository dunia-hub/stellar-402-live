import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBudget } from "../src/stellar/budget.js";
import { reconcileBudget } from "../src/stellar/reconcile-budget.js";

const hash = "a".repeat(64);

function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "stellar-reconcile-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const path = join(directory, "budget.json");
  const budget = createBudget({ path, limitAtomic: "200000" });

  return { path, budget };
}

function verified() {
  return {
    hash,
    network: "stellar:testnet",
    amountAtomic: "100000",
    ledger: 1234,
  };
}

test("a restarted client can settle a verified pending payment", async (t) => {
  const { path, budget } = setup(t);
  const id = budget.reserve("100000");
  budget.recordSettlement(id, hash);

  const restarted = createBudget({ path, limitAtomic: "200000" });

  const results = await reconcileBudget({
    budget: restarted,
    buyer: "buyer",
    recipient: "recipient",
    verify: async (receivedHash, expected) => {
      assert.equal(receivedHash, hash);
      assert.deepEqual(expected, {
        buyer: "buyer",
        recipient: "recipient",
        amountAtomic: "100000",
      });
      return verified();
    },
  });

  assert.equal(results[0].status, "settled");
  assert.equal(restarted.snapshot().payments[0].status, "settled");
  assert.equal(restarted.snapshot().remainingAtomic, "100000");
});

test("missing hashes stay reserved without a ledger lookup", async (t) => {
  const { budget } = setup(t);
  budget.reserve("100000");

  const results = await reconcileBudget({
    budget,
    buyer: "buyer",
    recipient: "recipient",
    verify: async () => assert.fail("Must not guess a transaction"),
  });

  assert.equal(results[0].status, "unresolved");
  assert.equal(budget.snapshot().remainingAtomic, "100000");
  assert.equal(budget.snapshot().payments[0].status, "pending");
});

test("failed verification keeps funds reserved", async (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000");
  budget.recordSettlement(id, hash);

  const results = await reconcileBudget({
    budget,
    buyer: "buyer",
    recipient: "recipient",
    verify: async () => {
      throw new Error("Ledger unavailable");
    },
  });

  assert.equal(results[0].status, "unresolved");
  assert.equal(budget.snapshot().payments[0].status, "pending");
  assert.equal(budget.snapshot().remainingAtomic, "100000");
});

test("mismatched verification evidence cannot settle a reservation", async (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000");
  budget.recordSettlement(id, hash);

  const results = await reconcileBudget({
    budget,
    buyer: "buyer",
    recipient: "recipient",
    verify: async () => ({
      ...verified(),
      amountAtomic: "200000",
    }),
  });

  assert.equal(results[0].status, "unresolved");
  assert.equal(budget.snapshot().payments[0].status, "pending");
});

test("reconciliation does not reprocess settled payments", async (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000");
  budget.recordSettlement(id, hash);
  budget.settle(id);

  const results = await reconcileBudget({
    budget,
    buyer: "buyer",
    recipient: "recipient",
    verify: async () => assert.fail("Already settled"),
  });

  assert.deepEqual(results, []);
});
