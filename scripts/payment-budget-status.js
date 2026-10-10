import { Keypair } from "@stellar/stellar-sdk";
import { fileURLToPath } from "node:url";
import { createBudget } from "../src/stellar/budget.js";

try {
  const buyer = Keypair.fromSecret(
    process.env.STELLAR_PRIVATE_KEY,
  ).publicKey();

  const budget = createBudget({
    path: fileURLToPath(new URL(
      `../.local/budget-${buyer}.json`,
      import.meta.url,
    )),
    limitAtomic: "10000000",
  });

  console.log(JSON.stringify(budget.snapshot(), null, 2));
} catch (error) {
  console.error("Budget status failed:", error.message);
  process.exitCode = 1;
}
