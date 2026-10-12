import test from "node:test";
import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBudget } from "../src/stellar/budget.js";
import { context } from "../fixtures/payment-context.js";

const workerPath = fileURLToPath(
  new URL("../fixtures/budget-worker.js", import.meta.url),
);

function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), "stellar-concurrency-"));
  const children = [];

  t.after(() => {
    for (const child of children) {
      if (child.exitCode === null) child.kill();
    }
    rmSync(directory, { recursive: true, force: true });
  });

  return {
    path: join(directory, "budget.json"),
    children,
  };
}

function launch(children) {
  const child = fork(workerPath, [], {
    stdio: ["ignore", "ignore", "inherit", "ipc"],
  });

  children.push(child);

  let readyResolve;
  let readyReject;
  let resultResolve;
  let resultReject;
  let result;

  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });

  const completed = new Promise((resolve, reject) => {
    resultResolve = resolve;
    resultReject = reject;
  });

  child.on("message", (message) => {
    if (message.status === "ready") {
      readyResolve();
    } else {
      result = message;
    }
  });

  child.on("error", (error) => {
    readyReject(error);
    resultReject(error);
  });

  child.on("exit", (code, signal) => {
    if (code !== 0 || !result) {
      const error = new Error(
        `Budget worker failed: code=${code}, signal=${signal}`,
      );
      readyReject(error);
      resultReject(error);
      return;
    }

    resultResolve(result);
  });

  return { child, ready, completed };
}

test("simultaneous processes cannot overallocate the budget", {
  timeout: 20_000,
}, async (t) => {
  const { path, children } = setup(t);
  const workers = Array.from({ length: 8 }, () => launch(children));

  const ready = Promise.all(workers.map((worker) => worker.ready));
  const completed = Promise.all(
    workers.map((worker) => worker.completed),
  );

  await ready;

  for (const worker of workers) {
    worker.child.send({ path, context });
  }

  const results = await completed;
  const successes = results.filter(
    (result) => result.status === "reserved",
  );

  assert.ok(successes.length >= 1);
  assert.ok(successes.length <= 2);

  for (const refusal of results.filter(
    (result) => result.status === "refused",
  )) {
    assert.match(
      refusal.reason,
      /locked|remaining total budget/,
    );
  }

  const budget = createBudget({ path, limitAtomic: "200000" });
  const state = budget.snapshot();

  assert.equal(state.payments.length, successes.length);
  assert.equal(
    new Set(state.payments.map((payment) => payment.id)).size,
    successes.length,
  );
  assert.equal(
    state.remainingAtomic,
    (200000n - BigInt(successes.length) * 100000n).toString(),
  );

  for (const payment of state.payments) {
    assert.equal(payment.status, "pending");
    assert.deepEqual(payment.context, context);
  }
});

test("later processes observe spending reserved by earlier processes", {
  timeout: 20_000,
}, async (t) => {
  const { path, children } = setup(t);
  const results = [];

  for (let index = 0; index < 3; index++) {
    const worker = launch(children);
    const completed = worker.completed;

    await worker.ready;
    worker.child.send({ path, context });
    results.push(await completed);
  }

  assert.deepEqual(
    results.map((result) => result.status),
    ["reserved", "reserved", "refused"],
  );
  assert.match(results[2].reason, /remaining total budget/);

  const state = createBudget({
    path,
    limitAtomic: "200000",
  }).snapshot();

  assert.equal(state.payments.length, 2);
  assert.equal(state.remainingAtomic, "0");
});
