export function validateChallenge(challenge, policy, now = Date.now()) {
  if (!challenge || challenge.version !== 1) {
    throw new Error("Unsupported payment challenge");
  }

  if (
    typeof challenge.id !== "string" ||
    typeof challenge.resource !== "string" ||
    !Number.isSafeInteger(challenge.expiresAt) ||
    challenge.expiresAt <= now
  ) {
    throw new Error("Invalid or expired payment challenge");
  }

  if (
    challenge.network !== policy.network ||
    challenge.asset !== policy.asset ||
    challenge.recipient !== policy.recipient
  ) {
    throw new Error("Payment terms are not approved");
  }

  if (
    typeof challenge.amountStroops !== "string" ||
    !/^[1-9]\d*$/.test(challenge.amountStroops)
  ) {
    throw new Error("Amount must be a positive integer string");
  }

  const amount = BigInt(challenge.amountStroops);

  if (amount > BigInt(policy.maxPaymentStroops)) {
    throw new Error("Payment exceeds spending limit");
  }

  return amount;
}
