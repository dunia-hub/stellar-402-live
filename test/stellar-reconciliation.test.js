import { context } from "./helpers/payment-context.js";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
  const id = budget.reserve("100000", context);
  budget.recordSettlement(id, hash);

  const restarted = createBudget({ path, limitAtomic: "200000" });

  const results = await reconcileBudget({
    budget: restarted,
    buyer: context.buyer,
    recipient: context.recipient,
    verify: async (receivedHash, expected) => {
      assert.equal(receivedHash, hash);
      assert.deepEqual(expected, {
        buyer: context.buyer,
        recipient: context.recipient,
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
  budget.reserve("100000", context);

  const results = await reconcileBudget({
    budget,
    buyer: context.buyer,
    recipient: context.recipient,
    verify: async () => assert.fail("Must not guess a transaction"),
  });

  assert.equal(results[0].status, "unresolved");
  assert.equal(budget.snapshot().remainingAtomic, "100000");
  assert.equal(budget.snapshot().payments[0].status, "pending");
});

test("failed verification keeps funds reserved", async (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000", context);
  budget.recordSettlement(id, hash);

  const results = await reconcileBudget({
    budget,
    buyer: context.buyer,
    recipient: context.recipient,
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
  const id = budget.reserve("100000", context);
  budget.recordSettlement(id, hash);

  const results = await reconcileBudget({
    budget,
    buyer: context.buyer,
    recipient: context.recipient,
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
  const id = budget.reserve("100000", context);
  budget.recordSettlement(id, hash);
  budget.settle(id);

  const results = await reconcileBudget({
    budget,
    buyer: context.buyer,
    recipient: context.recipient,
    verify: async () => assert.fail("Already settled"),
  });

  assert.deepEqual(results, []);
});

test("changed recipient configuration cannot reinterpret a reservation", async (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000", context);
  budget.recordSettlement(id, hash);

  const results = await reconcileBudget({
    budget,
    buyer: context.buyer,
    recipient: context.buyer,
    verify: async (_hash, expected) => {
      assert.equal(expected.recipient, context.recipient);
      return verified();
    },
  });

  assert.equal(results[0].status, "settled");
});

test("a different buyer cannot reconcile the reservation", async (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000", context);
  budget.recordSettlement(id, hash);

  const results = await reconcileBudget({
    budget,
    buyer: context.recipient,
    verify: async () => assert.fail("Must reject before ledger lookup"),
  });

  assert.equal(results[0].status, "unresolved");
  assert.match(results[0].reason, /different buyer/);
  assert.equal(budget.snapshot().payments[0].status, "pending");
});

test("legacy pending records stay unresolved even with a hash", async (t) => {
  const { path, budget } = setup(t);

  writeFileSync(path, JSON.stringify({
    version: 1,
    limitAtomic: "200000",
    payments: [{
      id: "legacy-payment",
      amountAtomic: "100000",
      status: "pending",
      hash,
    }],
  }));

  const results = await reconcileBudget({
    budget,
    buyer: context.buyer,
    verify: async () => assert.fail("Must not invent original context"),
  });

  assert.equal(results[0].status, "unresolved");
  assert.match(results[0].reason, /lacks payment context/);
  assert.equal(budget.snapshot().remainingAtomic, "100000");
});
