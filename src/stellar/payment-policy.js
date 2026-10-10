import { Asset, Networks } from "@stellar/stellar-sdk";

const issuer =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const TESTNET_USDC = new Asset(
  "USDC",
  issuer,
).contractId(Networks.TESTNET);

export function approvePayment(required, recipient) {
  if (
    required?.x402Version !== 2 ||
    !Array.isArray(required.accepts)
  ) {
    throw new Error("Unsupported payment requirements");
  }

  const approved = required.accepts.find((terms) => {
    if (
      terms.scheme !== "exact" ||
      terms.network !== "stellar:testnet" ||
      terms.asset !== TESTNET_USDC ||
      terms.payTo !== recipient ||
      typeof terms.amount !== "string" ||
      !/^[1-9]\d*$/.test(terms.amount)
    ) {
      return false;
    }

    // Stellar USDC uses seven decimal places.
    return BigInt(terms.amount) <= 100000n;
  });

  if (!approved) {
    throw new Error("No payment option satisfies the spending policy");
  }

  // Give the SDK only the option that passed policy validation.
  return {
    ...required,
    accepts: [{ ...approved }],
  };
}
