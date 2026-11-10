import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export function formatUsdcAmount(amountAtomic) {
  if (
    typeof amountAtomic !== "string" ||
    !/^(0|[1-9]\d*)$/.test(amountAtomic)
  ) {
    throw new Error("Invalid payment amount");
  }

  const padded = amountAtomic.padStart(8, "0");
  const whole = padded.slice(0, -7) || "0";
  const fraction = padded.slice(-7).replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole;
}

export function createPaymentProposal({
  serviceOrigin,
  resource,
  recipient,
  network,
  asset,
  amountAtomic,
  remainingBudgetAtomic,
}) {
  return {
    service: serviceOrigin,
    resourceId: resource.id,
    resourceName: resource.name,
    resourceUrl: resource.url,
    recipient,
    network,
    asset,
    amountAtomic,
    amountUsdc: formatUsdcAmount(amountAtomic),
    remainingBudgetAtomic,
    remainingBudgetUsdc: formatUsdcAmount(remainingBudgetAtomic),
  };
}

export function readAutoPayPolicy(env = process.env) {
  const enabled = env.STELLAR_AUTO_PAY === "true";

  if (!enabled) {
    return Object.freeze({ enabled: false });
  }

  const maxAmountAtomic =
    env.STELLAR_AUTO_PAY_MAX_AMOUNT_ATOMIC ?? "100000";

  if (
    typeof maxAmountAtomic !== "string" ||
    !/^[1-9]\d*$/.test(maxAmountAtomic)
  ) {
    throw new Error(
      "STELLAR_AUTO_PAY_MAX_AMOUNT_ATOMIC must be a positive integer string",
    );
  }

  return Object.freeze({
    enabled: true,
    maxAmountAtomic,
  });
}

export function canAutoPay(proposal, autoPayPolicy) {
  if (!autoPayPolicy?.enabled) return false;

  return (
    BigInt(proposal.amountAtomic) <=
      BigInt(autoPayPolicy.maxAmountAtomic) &&
    BigInt(proposal.amountAtomic) <=
      BigInt(proposal.remainingBudgetAtomic)
  );
}

export function formatPaymentReview(proposal) {
  return [
    "Proposed payment:",
    `  Service: ${proposal.service}`,
    `  Resource: ${proposal.resourceName} (${proposal.resourceId})`,
    `  Recipient: ${proposal.recipient}`,
    `  Asset: ${proposal.asset}`,
    `  Network: ${proposal.network}`,
    `  Amount: ${proposal.amountUsdc} USDC (${proposal.amountAtomic} atomic units)`,
    `  Remaining budget: ${proposal.remainingBudgetUsdc} USDC (${proposal.remainingBudgetAtomic} atomic units)`,
  ].join("\n");
}

export async function promptForApproval(proposal, {
  promptImpl = async (question) => {
    const rl = createInterface({ input, output });

    try {
      return await rl.question(question);
    } finally {
      rl.close();
    }
  },
} = {}) {
  const answer = await promptImpl(
    "Approve this payment? [a]pprove / [r]eject: ",
  );

  const normalized = String(answer).trim().toLowerCase();

  if (["a", "approve", "y", "yes"].includes(normalized)) {
    return "approved";
  }

  if (["r", "reject", "n", "no"].includes(normalized)) {
    return "rejected";
  }

  throw new Error("Payment review requires approve or reject");
}

export async function reviewPayment(proposal, {
  autoPayPolicy = { enabled: false },
  promptImpl,
} = {}) {
  if (canAutoPay(proposal, autoPayPolicy)) {
    return { decision: "approved", automatic: true };
  }

  const decision = await promptForApproval(proposal, { promptImpl });
  return { decision, automatic: false };
}
