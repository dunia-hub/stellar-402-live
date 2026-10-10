import { StrKey } from "@stellar/stellar-sdk";
import { TESTNET_USDC } from "./payment-policy.js";

export function validatePaymentContext(context) {
  if (
    !context ||
    context.network !== "stellar:testnet" ||
    context.asset !== TESTNET_USDC ||
    !StrKey.isValidEd25519PublicKey(context.buyer) ||
    !StrKey.isValidEd25519PublicKey(context.recipient)
  ) {
    throw new Error("Invalid reservation payment context");
  }

  return {
    network: context.network,
    asset: context.asset,
    buyer: context.buyer,
    recipient: context.recipient,
  };
}
