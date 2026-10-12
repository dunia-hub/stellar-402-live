import { verifySettlement } from "./verify-settlement.js";

export async function probeReplay({
  url,
  headers,
  httpClient,
  budget,
  context,
  amountAtomic,
  originalHash,
  fetchImpl = fetch,
  verify = verifySettlement,
}) {
  const reservation = budget.reserve(amountAtomic, context);

  console.log(`Replay contingency reservation: ${reservation}`);

  // Reuse the existing signed headers. Do not create another payload.
  const response = await fetchImpl(url, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });

  // Consume the response without printing payment payloads or resource data.
  await response.text();

  if (response.status !== 200) {
    return {
      reservation,
      httpStatus: response.status,
      outcome: "Resource access refused; settlement outcome not established",
      budgetStatus: "pending",
    };
  }

  const settlement = httpClient.getPaymentSettleResponse(
    (name) => response.headers.get(name),
  );

  if (
    settlement?.success !== true ||
    settlement.network !== "stellar:testnet" ||
    !settlement.transaction
  ) {
    throw new Error("Replay response lacks successful settlement evidence");
  }

  const verified = await verify(settlement.transaction, {
    buyer: context.buyer,
    recipient: context.recipient,
    amountAtomic,
  });

  if (
    verified.hash !== settlement.transaction ||
    verified.network !== context.network ||
    verified.amountAtomic !== amountAtomic
  ) {
    throw new Error("Replay verification evidence does not match");
  }

  if (settlement.transaction === originalHash) {
    return {
      reservation,
      httpStatus: response.status,
      transaction: settlement.transaction,
      outcome: "Resource returned with the original settlement hash",
      budgetStatus: "pending",
    };
  }

  budget.recordSettlement(reservation, settlement.transaction);
  budget.settle(reservation);

  return {
    reservation,
    httpStatus: response.status,
    transaction: settlement.transaction,
    ledger: verified.ledger,
    outcome: "A different verified settlement was reported",
    budgetStatus: "settled",
  };
}
