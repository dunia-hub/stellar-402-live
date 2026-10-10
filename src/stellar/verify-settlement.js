const HORIZON = "https://horizon-testnet.stellar.org";
const NETWORK = "Test SDF Network ; September 2015";

export const USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export function toAtomicAmount(amount) {
  if (
    typeof amount !== "string" ||
    !/^(0|[1-9]\d*)\.\d{7}$/.test(amount)
  ) {
    throw new Error("Invalid ledger amount");
  }

  const [whole, fraction] = amount.split(".");
  return BigInt(whole) * 10000000n + BigInt(fraction);
}

export function assertTransferEffects(records, expected) {
  if (!Array.isArray(records) || records.length >= 200) {
    throw new Error("Missing or potentially incomplete ledger effects");
  }

  const transfers = records.filter(
    (effect) =>
      ["account_debited", "account_credited"].includes(effect.type) &&
      effect.asset_type === "credit_alphanum4" &&
      effect.asset_code === "USDC" &&
      effect.asset_issuer === USDC_ISSUER,
  );

  // This verifier deliberately accepts only one USDC debit/credit pair.
  if (transfers.length !== 2) {
    throw new Error("Expected exactly one USDC transfer");
  }

  const debit = transfers.find(
    (effect) => effect.type === "account_debited",
  );
  const credit = transfers.find(
    (effect) => effect.type === "account_credited",
  );

  if (
    debit?.account !== expected.buyer ||
    credit?.account !== expected.recipient
  ) {
    throw new Error("Payment accounts do not match");
  }

  const amount = BigInt(expected.amountAtomic);

  if (
    amount <= 0n ||
    toAtomicAmount(debit.amount) !== amount ||
    toAtomicAmount(credit.amount) !== amount
  ) {
    throw new Error("Payment amount does not match");
  }

  const operation = debit._links?.operation?.href;

  if (
    typeof operation !== "string" ||
    !/^https:\/\/horizon-testnet\.stellar\.org\/operations\/\d+$/.test(operation) ||
    operation !== credit._links?.operation?.href
  ) {
    throw new Error("Debit and credit must belong to the same operation");
  }

  return { operation, amountAtomic: amount.toString() };
}

export async function verifySettlement(
  hash,
  expected,
  { fetchImpl = fetch } = {},
) {
  if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error("Invalid settlement transaction hash");
  }

  async function get(path) {
    const response = await fetchImpl(`${HORIZON}${path}`, {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Ledger lookup failed: HTTP ${response.status}`);
    }

    return response.json();
  }

  const root = await get("/");

  if (root.network_passphrase !== NETWORK) {
    throw new Error("Unexpected ledger network");
  }

  const transaction = await get(`/transactions/${hash}`);

  if (transaction.hash !== hash || transaction.successful !== true) {
    throw new Error("Transaction is missing or unsuccessful");
  }

  const effects = await get(
    `/transactions/${hash}/effects?limit=200`,
  );

  const transfer = assertTransferEffects(
    effects._embedded?.records,
    expected,
  );

  return {
    hash,
    network: "stellar:testnet",
    ledger: transaction.ledger,
    ...transfer,
  };
}
