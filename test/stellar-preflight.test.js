import test from "node:test";
import assert from "node:assert/strict";
import { checkAccounts } from "../src/stellar/preflight.js";
import { USDC_ISSUER } from "../src/stellar/verify-settlement.js";

function account(balance = "20.0000000") {
  return {
    balances: [
      {
        asset_type: "native",
        balance: "10000.0000000",
      },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: USDC_ISSUER,
        balance,
        limit: "1000.0000000",
        selling_liabilities: "0.0000000",
        buying_liabilities: "0.0000000",
        is_authorized: true,
      },
    ],
  };
}

function check(buyer, recipient = account("0.0000000")) {
  return checkAccounts({
    buyer,
    recipient,
    amountAtomic: "100000",
  });
}

test("funded accounts with authorized trustlines pass", () => {
  assert.equal(
    check(account()).buyerAvailableAtomic,
    "200000000",
  );
});

test("missing USDC trustline is rejected", () => {
  const buyer = account();
  buyer.balances.pop();

  assert.throws(() => check(buyer), /trustline is missing/);
});

test("unauthorized USDC trustline is rejected", () => {
  const recipient = account();
  recipient.balances[1].is_authorized = false;

  assert.throws(
    () => check(account(), recipient),
    /not authorized/,
  );
});

test("selling liabilities reduce available buyer funds", () => {
  const buyer = account("0.0100000");
  buyer.balances[1].selling_liabilities = "0.0000001";

  assert.throws(() => check(buyer), /insufficient available USDC/);
});

test("buying liabilities reduce recipient capacity", () => {
  const recipient = account("999.9900000");
  recipient.balances[1].buying_liabilities = "0.0000001";

  assert.throws(
    () => check(account(), recipient),
    /trustline capacity/,
  );
});

test("an account without positive XLM is rejected", () => {
  const buyer = account();
  buyer.balances[0].balance = "0.0000000";

  assert.throws(() => check(buyer), /positive XLM balance/);
});
