import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTransferEffects,
  toAtomicAmount,
  USDC_ISSUER,
  verifySettlement,
} from "../src/stellar/verify-settlement.js";

const hash = "a".repeat(64);

const expected = {
  buyer: "buyer",
  recipient: "recipient",
  amountAtomic: "100000",
};

function effects() {
  return [
    {
      type: "account_debited",
      account: "buyer",
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: USDC_ISSUER,
      amount: "0.0100000",
      _links: {
        operation: {
          href: "https://horizon-testnet.stellar.org/operations/123",
        },
      },
    },
    {
      type: "account_credited",
      account: "recipient",
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: USDC_ISSUER,
      amount: "0.0100000",
      _links: {
        operation: {
          href: "https://horizon-testnet.stellar.org/operations/123",
        },
      },
    },
  ];
}

function mockFetch({
  successful = true,
  network = "Test SDF Network ; September 2015",
  records = effects(),
  status = 200,
} = {}) {
  return async (url) => ({
    ok: status === 200,
    status,
    async json() {
      if (url.endsWith("/")) {
        return { network_passphrase: network };
      }
      if (url.includes("/effects?")) {
        return { _embedded: { records } };
      }
      return { hash, successful, ledger: 1234 };
    },
  });
}

test("ledger amounts are converted without floating point", () => {
  assert.equal(toAtomicAmount("0.0100000"), 100000n);
  assert.equal(
    toAtomicAmount("9007199254740993.0000001"),
    90071992547409930000001n,
  );
});

test("malformed ledger amounts are rejected", () => {
  for (const value of ["0.01", "-0.0100000", "1e7", 0.01]) {
    assert.throws(() => toAtomicAmount(value), /Invalid ledger amount/);
  }
});

test("matching debit and credit verify a successful settlement", async () => {
  const result = await verifySettlement(hash, expected, {
    fetchImpl: mockFetch(),
  });

  assert.equal(result.hash, hash);
  assert.equal(result.ledger, 1234);
  assert.equal(result.amountAtomic, "100000");
});

test("wrong buyer and recipient are rejected", () => {
  for (const index of [0, 1]) {
    const records = effects();
    records[index].account = "wrong-account";

    assert.throws(
      () => assertTransferEffects(records, expected),
      /accounts do not match/,
    );
  }
});

test("wrong issuer is rejected", () => {
  const records = effects();
  records[1].asset_issuer = "wrong-issuer";

  assert.throws(
    () => assertTransferEffects(records, expected),
    /exactly one USDC transfer/,
  );
});

test("incorrect debit or credit amounts are rejected", () => {
  for (const index of [0, 1]) {
    const records = effects();
    records[index].amount = "0.0200000";

    assert.throws(
      () => assertTransferEffects(records, expected),
      /amount does not match/,
    );
  }
});

test("effects from different operations are rejected", () => {
  const records = effects();
  records[1]._links.operation.href =
    "https://horizon-testnet.stellar.org/operations/456";

  assert.throws(
    () => assertTransferEffects(records, expected),
    /same operation/,
  );
});

test("multiple USDC transfers are rejected", () => {
  assert.throws(
    () => assertTransferEffects([...effects(), ...effects()], expected),
    /exactly one USDC transfer/,
  );
});

test("potentially truncated effect pages are rejected", () => {
  const records = Array.from({ length: 200 }, () => ({}));

  assert.throws(
    () => assertTransferEffects(records, expected),
    /incomplete ledger effects/,
  );
});

test("failed transactions are rejected", async () => {
  await assert.rejects(
    verifySettlement(hash, expected, {
      fetchImpl: mockFetch({ successful: false }),
    }),
    /unsuccessful/,
  );
});

test("wrong ledger network is rejected", async () => {
  await assert.rejects(
    verifySettlement(hash, expected, {
      fetchImpl: mockFetch({ network: "wrong-network" }),
    }),
    /Unexpected ledger network/,
  );
});

test("ledger lookup errors are not treated as payment success", async () => {
  await assert.rejects(
    verifySettlement(hash, expected, {
      fetchImpl: mockFetch({ status: 503 }),
    }),
    /HTTP 503/,
  );
});

test("invalid hashes are rejected before network access", async () => {
  await assert.rejects(
    verifySettlement("invalid", expected, {
      fetchImpl: async () => {
        assert.fail("Network must not be called");
      },
    }),
    /Invalid settlement transaction hash/,
  );
});
