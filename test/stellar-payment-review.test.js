import test from "node:test";
import assert from "node:assert/strict";
import {
  canAutoPay,
  createPaymentProposal,
  formatPaymentReview,
  formatUsdcAmount,
  readAutoPayPolicy,
  reviewPayment,
} from "../src/stellar/payment-review.js";

const proposal = createPaymentProposal({
  serviceOrigin: "http://127.0.0.1:3001",
  resource: {
    id: "business-checklist",
    name: "Small-business planning checklist",
    url: "http://127.0.0.1:3001/resource",
  },
  recipient: "GRECIPIENT",
  network: "stellar:testnet",
  asset: "CUSDC",
  amountAtomic: "100000",
  remainingBudgetAtomic: "9900000",
});

test("formatUsdcAmount renders atomic units as USDC", () => {
  assert.equal(formatUsdcAmount("100000"), "0.01");
  assert.equal(formatUsdcAmount("10000000"), "1");
  assert.equal(formatUsdcAmount("1"), "0.0000001");
});

test("payment review shows service, resource, recipient, asset, amount, and budget", () => {
  const text = formatPaymentReview(proposal);

  assert.match(text, /Service: http:\/\/127\.0\.0\.1:3001/);
  assert.match(text, /Resource: Small-business planning checklist \(business-checklist\)/);
  assert.match(text, /Recipient: GRECIPIENT/);
  assert.match(text, /Asset: CUSDC/);
  assert.match(text, /Amount: 0\.01 USDC \(100000 atomic units\)/);
  assert.match(text, /Remaining budget: 0\.99 USDC \(9900000 atomic units\)/);
});

test("automatic payments are disabled unless explicitly configured", () => {
  assert.deepEqual(readAutoPayPolicy({}), { enabled: false });
  assert.equal(canAutoPay(proposal, { enabled: false }), false);
});

test("automatic payments require an explicit policy and remain within it", () => {
  const policy = readAutoPayPolicy({
    STELLAR_AUTO_PAY: "true",
    STELLAR_AUTO_PAY_MAX_AMOUNT_ATOMIC: "100000",
  });

  assert.equal(canAutoPay(proposal, policy), true);
  assert.equal(
    canAutoPay(
      { ...proposal, amountAtomic: "100001" },
      policy,
    ),
    false,
  );
  assert.equal(
    canAutoPay(
      { ...proposal, remainingBudgetAtomic: "50000" },
      policy,
    ),
    false,
  );
});

test("rejection stops before signing or submission", async () => {
  const result = await reviewPayment(proposal, {
    autoPayPolicy: { enabled: false },
    promptImpl: async () => "reject",
  });

  assert.deepEqual(result, { decision: "rejected", automatic: false });
});

test("manual approval allows the reviewed payment", async () => {
  const result = await reviewPayment(proposal, {
    autoPayPolicy: { enabled: false },
    promptImpl: async () => "approve",
  });

  assert.deepEqual(result, { decision: "approved", automatic: false });
});

test("invalid auto-pay configuration is rejected", () => {
  assert.throws(
    () => readAutoPayPolicy({
      STELLAR_AUTO_PAY: "true",
      STELLAR_AUTO_PAY_MAX_AMOUNT_ATOMIC: "0.01",
    }),
    /positive integer string/,
  );
});
