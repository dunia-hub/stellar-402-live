import {
  toAtomicAmount,
  USDC_ISSUER,
} from "./verify-settlement.js";

function usdcBalance(account) {
  const balance = account.balances?.find(
    (entry) =>
      entry.asset_type === "credit_alphanum4" &&
      entry.asset_code === "USDC" &&
      entry.asset_issuer === USDC_ISSUER,
  );

  if (!balance) {
    throw new Error("Required USDC trustline is missing");
  }

  if (balance.is_authorized !== true) {
    throw new Error("USDC trustline is not authorized");
  }

  return balance;
}

export function checkAccounts({
  buyer,
  recipient,
  amountAtomic,
}) {
  const amount = BigInt(amountAtomic);

  if (amount <= 0n) {
    throw new Error("Payment amount must be positive");
  }

  for (const account of [buyer, recipient]) {
    const native = account.balances?.find(
      (entry) => entry.asset_type === "native",
    );

    if (!native || toAtomicAmount(native.balance) <= 0n) {
      throw new Error("Account has no positive XLM balance");
    }
  }

  const buyerUsdc = usdcBalance(buyer);
  const recipientUsdc = usdcBalance(recipient);

  const available =
    toAtomicAmount(buyerUsdc.balance) -
    toAtomicAmount(buyerUsdc.selling_liabilities ?? "0.0000000");

  const capacity =
    toAtomicAmount(recipientUsdc.limit) -
    toAtomicAmount(recipientUsdc.balance) -
    toAtomicAmount(recipientUsdc.buying_liabilities ?? "0.0000000");

  if (available < amount) {
    throw new Error("Buyer has insufficient available USDC");
  }

  if (capacity < amount) {
    throw new Error("Recipient has insufficient USDC trustline capacity");
  }

  return {
    buyerAvailableAtomic: available.toString(),
    recipientCapacityAtomic: capacity.toString(),
  };
}
