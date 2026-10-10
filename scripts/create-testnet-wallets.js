import { writeFileSync } from "node:fs";
import { Keypair } from "@stellar/stellar-sdk";

const buyer = Keypair.random();
const recipient = Keypair.random();

const contents = [
  "# Generated testnet accounts. Never commit this file.",
  `STELLAR_PRIVATE_KEY=${buyer.secret()}`,
  `STELLAR_RECIPIENT=${recipient.publicKey()}`,
  `STELLAR_RECIPIENT_SECRET=${recipient.secret()}`,
  "STELLAR_PORT=3001",
  "",
].join("\n");

try {
  writeFileSync(".env", contents, {
    flag: "wx",
    mode: 0o600,
  });
} catch (error) {
  if (error.code === "EEXIST") {
    console.error(".env already exists. Existing wallets were not changed.");
  } else {
    console.error("Could not create the wallet configuration.");
  }
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log("Created testnet wallets in .env.");
  console.log(`Buyer public key: ${buyer.publicKey()}`);
  console.log(`Recipient public key: ${recipient.publicKey()}`);
  console.log("Secret keys were saved locally and were not printed.");
}
