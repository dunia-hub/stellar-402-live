import {
  Transaction,
  TransactionBuilder,
  Networks,
} from "@stellar/stellar-sdk";
import { x402Client, x402HTTPClient } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { readConfig } from "./config.js";
import { approvePayment } from "./payment-policy.js";

async function main() {
  const config = readConfig();
  const url = `http://127.0.0.1:${config.port}/resource`;

  if (!process.env.STELLAR_PRIVATE_KEY) {
    throw new Error("STELLAR_PRIVATE_KEY is required");
  }

  const first = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });

  console.log(`Unpaid request: HTTP ${first.status}`);

  if (first.status !== 402) {
    throw new Error("Expected a payment challenge");
  }

  const signer = createEd25519Signer(
    process.env.STELLAR_PRIVATE_KEY,
    "stellar:testnet",
  );

  const client = new x402Client().register(
    "stellar:testnet",
    new ExactStellarScheme(signer, {
      url: "https://soroban-testnet.stellar.org",
    }),
  );

  const httpClient = new x402HTTPClient(client);

  const required = httpClient.getPaymentRequiredResponse(
    (name) => first.headers.get(name),
  );

  const approved = approvePayment(required, config.recipient);

  console.log("Policy approved:");
  console.log(`  Buyer: ${signer.address}`);
  console.log(`  Recipient: ${config.recipient}`);
  console.log(`  USDC atomic units: ${approved.accepts[0].amount}`);

  let payload = await client.createPaymentPayload(approved);

  // Testnet facilitator fee compatibility, following Stellar's quickstart.
  const transaction = new Transaction(
    payload.payload.transaction,
    Networks.TESTNET,
  );

  const sorobanData = transaction.sorobanData;

  if (sorobanData) {
    payload = {
      ...payload,
      payload: {
        ...payload.payload,
        transaction: TransactionBuilder.cloneFrom(transaction, {
          fee: "1",
          sorobanData,
          networkPassphrase: Networks.TESTNET,
        })
          .build()
          .toXDR(),
      },
    };
  }

  const headers = httpClient.encodePaymentSignatureHeader(payload);

  console.log("Submitting one signed payment request.");

  const paid = await fetch(url, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });

  const body = await paid.text();
  console.log(`Paid request: HTTP ${paid.status}`);

  if (paid.status !== 200) {
    throw new Error(
      "Resource access failed. Check server output before retrying payment.",
    );
  }

  const settlement = httpClient.getPaymentSettleResponse(
    (name) => paid.headers.get(name),
  );

  if (
    settlement?.success !== true ||
    settlement.network !== "stellar:testnet" ||
    !settlement.transaction
  ) {
    throw new Error("Response lacks successful testnet settlement evidence");
  }

  console.log(`Settlement transaction: ${settlement.transaction}`);
  console.log("Unlocked resource:");
  console.log(body);
}

main().catch((error) => {
  console.error("Payment client failed:", error.message);
  console.error(
    "No automatic retry was attempted. A timeout does not prove payment failed.",
  );
  process.exitCode = 1;
});
