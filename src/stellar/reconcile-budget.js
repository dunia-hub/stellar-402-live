import { verifySettlement } from "./verify-settlement.js";
import { validatePaymentContext } from "./payment-context.js";

export async function reconcileBudget({
  budget,
  buyer,
  verify = verifySettlement,
}) {
  const payments = budget.snapshot().payments;
  const results = [];

  for (const payment of payments) {
    if (payment.status !== "pending") continue;

    if (payment.context === null) {
      results.push({
        id: payment.id,
        status: "unresolved",
        reason: "Legacy reservation lacks payment context; funds remain reserved",
      });
      continue;
    }

    try {
      const context = validatePaymentContext(payment.context);

      if (context.buyer !== buyer) {
        throw new Error("Reservation belongs to a different buyer");
      }

      if (payment.hash === null) {
        results.push({
          id: payment.id,
          status: "unresolved",
          reason: "No settlement hash recorded; funds remain reserved",
        });
        continue;
      }

      const verified = await verify(payment.hash, {
        buyer: context.buyer,
        recipient: context.recipient,
        amountAtomic: payment.amountAtomic,
      });

      if (
        verified.hash !== payment.hash ||
        verified.network !== context.network ||
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
