import test from "node:test";
import assert from "node:assert/strict";
import {
  approvePayment,
  TESTNET_USDC,
} from "../src/stellar/payment-policy.js";

const recipient = "approved-recipient";

function requirements(changes = {}) {
  return {
    x402Version: 2,
    accepts: [{
      scheme: "exact",
      network: "stellar:testnet",
      asset: TESTNET_USDC,
      payTo: recipient,
      amount: "100000",
      ...changes,
    }],
  };
}

test("payment policy accepts 0.01 USDC", () => {
  const approved = approvePayment(requirements(), recipient);
  assert.equal(approved.accepts[0].amount, "100000");
});

test("payment policy rejects amounts over 0.01 USDC", () => {
  assert.throws(
    () => approvePayment(requirements({ amount: "100001" }), recipient),
    /spending policy/,
  );
});

test("payment policy rejects unapproved terms", () => {
  for (const field of ["scheme", "network", "asset", "payTo"]) {
    assert.throws(
      () => approvePayment(
        requirements({ [field]: "unapproved" }),
        recipient,
      ),
      /spending policy/,
    );
  }
});

test("payment policy rejects malformed amounts", () => {
  for (const amount of ["0", "-1", "0.01", "1e5", "", 100000]) {
    assert.throws(
      () => approvePayment(requirements({ amount }), recipient),
      /spending policy/,
    );
  }
});

test("SDK receives only the approved payment option", () => {
  const required = requirements();
  required.accepts.unshift({
    ...required.accepts[0],
    payTo: "unapproved-recipient",
  });

  const approved = approvePayment(required, recipient);

  assert.equal(approved.accepts.length, 1);
  assert.equal(approved.accepts[0].payTo, recipient);
  assert.equal(required.accepts.length, 2);
});

test("payment policy rejects unsupported payment envelopes", () => {
  for (const required of [null, {}, { x402Version: 1, accepts: [] }]) {
    assert.throws(
      () => approvePayment(required, recipient),
      /Unsupported/,
    );
  }
});
