import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const server = new Horizon.Server(
  "https://horizon-testnet.stellar.org",
);

const issuer =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const usdc = new Asset("USDC", issuer);

async function fundAccount(publicKey) {
  try {
    await server.loadAccount(publicKey);
    console.log("Account is already funded.");
    return;
  } catch (error) {
    if (error.response?.status !== 404) throw error;
  }

  const url = new URL("https://friendbot.stellar.org");
  url.searchParams.set("addr", publicKey);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Friendbot returned HTTP ${response.status}`);
  }

  console.log("Account funded with testnet XLM.");
}

async function configureAccount(label, keypair) {
  const publicKey = keypair.publicKey();
  console.log(`\n${label}: ${publicKey}`);

  await fundAccount(publicKey);

  const account = await server.loadAccount(publicKey);

  const hasTrustline = account.balances.some(
    (balance) =>
      balance.asset_code === "USDC" &&
      balance.asset_issuer === issuer,
  );

  if (hasTrustline) {
    console.log("USDC trustline already exists.");
    return;
  }

  const fee = await server.fetchBaseFee();

  const transaction = new TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: usdc }))
    .setTimeout(30)
    .build();

  transaction.sign(keypair);

  const result = await server.submitTransaction(transaction);
  console.log(`USDC trustline created: ${result.hash}`);
}

async function main() {
  const buyer = Keypair.fromSecret(
    process.env.STELLAR_PRIVATE_KEY,
  );

  const recipient = Keypair.fromSecret(
    process.env.STELLAR_RECIPIENT_SECRET,
  );

  if (recipient.publicKey() !== process.env.STELLAR_RECIPIENT) {
    throw new Error("Recipient public key does not match its secret key");
  }

  if (buyer.publicKey() === recipient.publicKey()) {
    throw new Error("Buyer and recipient must be different accounts");
  }

  await configureAccount("Buyer", buyer);
  await configureAccount("Recipient", recipient);

  console.log("\nAccount setup complete.");
  console.log("Next: fund the buyer with Stellar testnet USDC.");
  console.log(`Buyer public key: ${buyer.publicKey()}`);
}

main().catch((error) => {
  const codes = error.response?.data?.extras?.result_codes;

  console.error(
    "Testnet setup failed:",
    codes ? JSON.stringify(codes) : error.message,
  );

  process.exitCode = 1;
});
