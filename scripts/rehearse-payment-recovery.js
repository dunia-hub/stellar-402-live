import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@stellar/stellar-sdk";
import { createBudget } from "../src/stellar/budget.js";
import { reconcileBudget } from "../src/stellar/reconcile-budget.js";
import { validatePaymentContext } from "../src/stellar/payment-context.js";

let directory;

try {
  const buyer = Keypair.fromSecret(
    process.env.STELLAR_PRIVATE_KEY,
  ).publicKey();

  const realPath = fileURLToPath(new URL(
    `../.local/budget-${buyer}.json`,
    import.meta.url,
  ));

  const originalBytes = readFileSync(realPath);
  const realState = JSON.parse(originalBytes.toString("utf8"));

  if (realState.version !== 2 || !Array.isArray(realState.payments)) {
    throw new Error("Expected a version 2 budget");
  }

  const payment = [...realState.payments].reverse().find(
    (entry) =>
      entry.status === "settled" &&
      entry.hash &&
      entry.context?.buyer === buyer,
  );

  if (!payment) {
    throw new Error("No settled context-bearing payment available");
  }

  const context = validatePaymentContext(payment.context);

  directory = mkdtempSync(join(tmpdir(), "stellar-recovery-"));
  const temporaryPath = join(directory, "budget.json");

  const beforeRestart = createBudget({
    path: temporaryPath,
    limitAtomic: realState.limitAtomic,
  });

  const id = beforeRestart.reserve(payment.amountAtomic, context);
  beforeRestart.recordSettlement(id, payment.hash);

  console.log("Temporary rehearsal budget created.");
  console.log("Simulated interruption: hash saved, reservation still pending.");

  assert.equal(
    beforeRestart.snapshot().payments[0].status,
    "pending",
  );

  const restarted = createBudget({
    path: temporaryPath,
    limitAtomic: realState.limitAtomic,
  });

  const results = await reconcileBudget({
    budget: restarted,
    buyer,
  });

  assert.equal(results.length, 1);
  assert.equal(
    results[0].status,
    "settled",
    results[0].reason ?? "Recovery did not settle the reservation",
  );

  const recovered = restarted.snapshot();

  assert.equal(recovered.payments[0].status, "settled");
  assert.equal(recovered.payments[0].hash, payment.hash);
  assert.deepEqual(recovered.payments[0].context, context);

  assert.equal(
    recovered.remainingAtomic,
    (
      BigInt(realState.limitAtomic) -
      BigInt(payment.amountAtomic)
    ).toString(),
  );

  assert.deepEqual(readFileSync(realPath), originalBytes);

  console.log(`Ledger verification passed: ledger ${results[0].ledger}`);
  console.log("Temporary pending reservation recovered as settled.");
  console.log("Real budget unchanged. No payment submitted.");
} catch (error) {
  console.error("Recovery rehearsal failed:", error.message);
  process.exitCode = 1;
} finally {
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}
