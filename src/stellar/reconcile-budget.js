import { verifySettlement } from "./verify-settlement.js";

export async function reconcileBudget({
  budget,
  buyer,
  recipient,
  verify = verifySettlement,
}) {
  const payments = budget.snapshot().payments;
  const results = [];

  for (const payment of payments) {
    if (payment.status !== "pending") continue;

    if (payment.hash === null) {
      results.push({
        id: payment.id,
        status: "unresolved",
        reason: "No settlement hash recorded; funds remain reserved",
      });
      continue;
    }

    try {
      const verified = await verify(payment.hash, {
        buyer,
        recipient,
        amountAtomic: payment.amountAtomic,
      });

      if (
        verified.hash !== payment.hash ||
        verified.network !== "stellar:testnet" ||
        verified.amountAtomic !== payment.amountAtomic
      ) {
        throw new Error("Verification result does not match reservation");
      }

      budget.settle(payment.id);

      results.push({
        id: payment.id,
        status: "settled",
        hash: payment.hash,
        ledger: verified.ledger,
      });
    } catch (error) {
      results.push({
        id: payment.id,
        status: "unresolved",
        hash: payment.hash,
        reason: error.message,
      });
    }
  }

  return results;
}
