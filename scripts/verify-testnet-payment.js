import { Keypair } from "@stellar/stellar-sdk";
import { readConfig } from "../src/stellar/config.js";
import { verifySettlement } from "../src/stellar/verify-settlement.js";

try {
  const config = readConfig();
  const buyer = Keypair.fromSecret(
    process.env.STELLAR_PRIVATE_KEY,
  ).publicKey();

  const result = await verifySettlement(process.argv[2], {
    buyer,
    recipient: config.recipient,
    amountAtomic: "100000",
  });

  console.log("Payment independently verified through testnet Horizon:");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Verification failed:", error.message);
  process.exitCode = 1;
}
