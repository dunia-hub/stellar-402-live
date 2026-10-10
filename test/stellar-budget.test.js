import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBudget } from "../src/stellar/budget.js";

function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "stellar-budget-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const path = join(directory, "budget.json");

  return {
    path,
    budget: createBudget({ path, limitAtomic: "200000" }),
  };
}

test("pending payments reduce available budget", (t) => {
  const { budget } = setup(t);
  budget.reserve("100000");

  assert.equal(budget.snapshot().remainingAtomic, "100000");
  assert.equal(budget.snapshot().payments[0].status, "pending");
});

test("budget state survives a new client instance", (t) => {
  const { path, budget } = setup(t);
  budget.reserve("100000");

  const restarted = createBudget({ path, limitAtomic: "200000" });
  assert.equal(restarted.snapshot().remainingAtomic, "100000");
});

test("payment above remaining budget is refused", (t) => {
  const { budget } = setup(t);
  budget.reserve("100000");

  assert.throws(
    () => budget.reserve("100001"),
    /remaining total budget/,
  );

  assert.equal(budget.snapshot().payments.length, 1);
});

test("settled payments remain charged to the budget", (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000");

  budget.recordSettlement(id, "a".repeat(64));
  budget.settle(id);

  const state = budget.snapshot();
  assert.equal(state.remainingAtomic, "100000");
  assert.equal(state.payments[0].status, "settled");
});

test("settlement requires a recorded transaction hash", (t) => {
  const { budget } = setup(t);
  const id = budget.reserve("100000");

  assert.throws(() => budget.settle(id), /Recorded settlement/);
  assert.equal(budget.snapshot().payments[0].status, "pending");
});

test("different instances share the same remaining budget", (t) => {
  const { path, budget } = setup(t);
  const other = createBudget({ path, limitAtomic: "200000" });

  budget.reserve("100000");
  other.reserve("100000");

  assert.throws(() => budget.reserve("1"), /remaining total budget/);
});

test("an existing lock blocks authorization", (t) => {
  const { path, budget } = setup(t);
  writeFileSync(`${path}.lock`, "");

  assert.throws(() => budget.reserve("100000"), /locked/);
});

test("corrupt budget state does not reset spending", (t) => {
  const { path, budget } = setup(t);
  writeFileSync(path, "invalid-json");

  assert.throws(() => budget.reserve("100000"));
});

test("changing the limit does not reset an existing budget", (t) => {
  const { path, budget } = setup(t);
  budget.reserve("100000");

  const changed = createBudget({ path, limitAtomic: "300000" });

  assert.throws(() => changed.reserve("100000"), /changed budget limit/);
});

test("a transaction cannot settle two reservations", (t) => {
  const { budget } = setup(t);
  const first = budget.reserve("100000");
  const second = budget.reserve("100000");
  const hash = "a".repeat(64);

  budget.recordSettlement(first, hash);

  assert.throws(
    () => budget.recordSettlement(second, hash),
    /conflicts/,
  );
});

test("invalid reservation amounts are rejected", (t) => {
  const { budget } = setup(t);

  for (const value of ["0", "-1", "0.01", "1e5", 100000]) {
    assert.throws(() => budget.reserve(value));
  }
});
