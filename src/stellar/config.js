import { StrKey } from "@stellar/stellar-sdk";

export function readConfig(env = process.env) {
  const recipient = env.STELLAR_RECIPIENT;

  if (!recipient || !StrKey.isValidEd25519PublicKey(recipient)) {
    throw new Error("STELLAR_RECIPIENT must be a valid Stellar public key");
  }

  const port = Number(env.STELLAR_PORT ?? "3001");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("STELLAR_PORT must be between 1 and 65535");
  }

  return Object.freeze({
    recipient,
    port,
    network: "stellar:testnet",
    price: "$0.01",
    facilitatorUrl: "https://www.x402.org/facilitator",
  });
}
