import { Keypair } from "@stellar/stellar-sdk";
import { x402Client, x402HTTPClient } from "@x402/fetch";
import { fileURLToPath } from "node:url";
import { readClientConfig } from "../src/stellar/client-config.js";
import { discoverResource } from "../src/stellar/discovery.js";
import { approvePayment } from "../src/stellar/payment-policy.js";
import { createBudget } from "../src/stellar/budget.js";
import { checkAccounts } from "../src/stellar/preflight.js";

async function getLedgerJson(path) {
  const response = await fetch(
    `https://horizon-testnet.stellar.org${path}`,
    {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Ledger lookup failed: HTTP ${response.status}`);
  }

  return response.json();
}

async function main() {
  const config = readClientConfig();

  const buyer = Keypair.fromSecret(
    process.env.STELLAR_PRIVATE_KEY,
  ).publicKey();

  const resource = await discoverResource(
    config.serviceOrigin,
    config.resourceId,
  );

  const response = await fetch(resource.url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });

  if (response.status !== 402) {
    throw new Error(`Expected HTTP 402; received ${response.status}`);
  }

  // Decode requirements without registering a signer.
  const httpClient = new x402HTTPClient(new x402Client());

  const required = httpClient.getPaymentRequiredResponse(
    (name) => response.headers.get(name),
  );

  await response.arrayBuffer();

  const approved = approvePayment(required, config.recipient);
  const amountAtomic = approved.accepts[0].amount;

  const root = await getLedgerJson("/");

  if (root.network_passphrase !== "Test SDF Network ; September 2015") {
    throw new Error("Unexpected ledger network");
  }

  const buyerAccount = await getLedgerJson(`/accounts/${buyer}`);
  const recipientAccount = await getLedgerJson(
    `/accounts/${config.recipient}`,
  );

  if (
    buyerAccount.account_id !== buyer ||
    recipientAccount.account_id !== config.recipient
  ) {
    throw new Error("Ledger account identities do not match");
  }

  const accounts = checkAccounts({
    buyer: buyerAccount,
    recipient: recipientAccount,
    amountAtomic,
  });

  const budget = createBudget({
    path: fileURLToPath(new URL(
      `../.local/budget-${buyer}.json`,
      import.meta.url,
    )),
    limitAtomic: "10000000",
  });

  const state = budget.snapshot();

  if (BigInt(state.remainingAtomic) < BigInt(amountAtomic)) {
    throw new Error("Insufficient remaining application budget");
  }

  const pending = state.payments.filter(
    (payment) => payment.status === "pending",
  );

  console.log("Preflight passed:");
  console.log(JSON.stringify({
    serviceOrigin: config.serviceOrigin,
    resource: resource.id,
    buyer,
    recipient: config.recipient,
    paymentAmountAtomic: amountAtomic,
    ...accounts,
    remainingBudgetAtomic: state.remainingAtomic,
    pendingReservations: pending.length,
  }, null, 2));

  if (pending.length > 0) {
    console.log("Pending reservations remain allocated; preflight did not resolve them.");
  }

  console.log("No payload signed, funds reserved, or payment submitted.");
  console.log("Checks reflect current state; successful settlement is not guaranteed.");
}

main().catch((error) => {
  console.error("Preflight failed:", error.message);
  process.exitCode = 1;
});
