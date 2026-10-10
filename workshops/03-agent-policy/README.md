# Session 3: Give an Agent a Spending Policy

## Goal

Control what an agent client may pay for, how much it may spend, and how it handles uncertain payment outcomes.

This session uses the deterministic client. A model provider is not required.

## What You Will Learn

- Service discovery does not grant spending permission.
- Payment terms must be checked before signing.
- A per-payment ceiling and a total budget serve different purposes.
- Pending payments must count against available funds.
- A timeout does not establish that payment failed.
- Restarting a client must not reset its recorded spending.

## Requirements

- The repository installed locally
- Session 2 account setup completed
- A funded testnet buyer
- The Stellar service running for the optional live exercise

Run commands from the repository root.

## 1. Inspect the Payment Policy

Open:

```sh
code src/stellar/payment-policy.js
```

The policy accepts a payment option only when it satisfies every requirement:

| Term | Required Value |
| --- | --- |
| Scheme | `exact` |
| Network | `stellar:testnet` |
| Asset | Approved testnet USDC asset contract |
| Recipient | Public key configured in `STELLAR_RECIPIENT` |
| Amount | Positive integer string, at most `100000` atomic units |

The ceiling is **0.01 USDC per payment**.

The policy passes only the approved option to the signing library.

## 2. Run the Policy Tests

```sh
node --test test/stellar-payment-policy.test.js
```

Inspect the tests:

```sh
code test/stellar-payment-policy.test.js
```

Identify the cases that reject:

- An amount above the ceiling.
- An unapproved recipient.
- An unsupported network.
- An unapproved asset.
- A malformed amount.
- An unsupported payment envelope.

These tests exercise authorization without signing or spending funds.

## 3. Demonstrate a Refusal

Run this local policy check:

```sh
node --input-type=module <<'EOF'
import {
  approvePayment,
  TESTNET_USDC,
} from "./src/stellar/payment-policy.js";

const recipient = "approved-recipient";

const required = {
  x402Version: 2,
  accepts: [{
    scheme: "exact",
    network: "stellar:testnet",
    asset: TESTNET_USDC,
    payTo: recipient,
    amount: "100001",
  }],
};

try {
  approvePayment(required, recipient);
  throw new Error("Expected the policy to refuse this payment");
} catch (error) {
  if (!error.message.includes("spending policy")) throw error;
  console.log("Payment refused before signing:", error.message);
}
EOF
```

Expected output:

```text
Payment refused before signing: No payment option satisfies the spending policy
```

No network request or payment is made.

Change the amount to `"100000"` and inspect the approved result. Then change the recipient or network and confirm that the policy refuses it.

## 4. Inspect the Persistent Budget

Open:

```sh
code src/stellar/budget.js
```

The client uses a total budget of **1 USDC per buyer**.

Budget records live in an ignored local file:

```text
.local/budget-BUYER_PUBLIC_KEY.json
```

The same buyer shares this budget across configured service targets.

| Record Status | Budget Treatment |
| --- | --- |
| `pending` | Funds remain allocated |
| `settled` | Funds remain allocated as completed spending |

A successful payment changes its status. It does not restore the spent amount to the available budget.

## 5. Run the Budget Tests

```sh
node --test test/stellar-budget.test.js
```

The tests cover:

- Reserving funds.
- Preserving records across client instances.
- Refusing payments above the remaining budget.
- Keeping settled payments charged to the budget.
- Blocking updates when a lock exists.
- Rejecting corrupt state.
- Rejecting a changed limit for an existing budget.
- Preventing one transaction hash from settling two reservations.

The module uses an exclusive file lock around each update.

The current tests check shared state and lock refusal. They do not constitute a full multiprocess concurrency stress test.

## 6. Demonstrate Budget Exhaustion Without Paying

This exercise uses a temporary directory and makes no network requests.

```sh
node --input-type=module <<'EOF'
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBudget } from "./src/stellar/budget.js";

const directory = mkdtempSync(join(tmpdir(), "stellar-policy-exercise-"));

try {
  const budget = createBudget({
    path: join(directory, "budget.json"),
    limitAtomic: "100000",
  });

  budget.reserve("100000");
  console.log("First reservation accepted.");

  try {
    budget.reserve("1");
    throw new Error("Expected the budget to refuse this reservation");
  } catch (error) {
    if (!error.message.includes("remaining total budget")) throw error;
    console.log("Second reservation refused:", error.message);
  }

  console.log("Remaining atomic units:", budget.snapshot().remainingAtomic);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
EOF
```

Expected output includes:

```text
First reservation accepted.
Second reservation refused: Payment exceeds remaining total budget
Remaining atomic units: 0
```

This temporary exercise does not alter the real client budget.

## 7. Follow the Client’s Payment Sequence

Open:

```sh
code src/stellar/client.js
```

Find these steps in order:

1. Discover the resource.
2. Receive and validate payment requirements.
3. Reserve budget.
4. Create the signed payload.
5. Submit one payment request.
6. Record the settlement hash.
7. Verify ledger evidence.
8. Mark the reservation settled.

The reservation happens before signing.

If signing, submission, or verification fails after reservation, the funds remain allocated. This conservative behavior avoids treating an uncertain outcome as available spending capacity.

## 8. Inspect Your Current Budget

```sh
npm run budget:status
```

Review:

- The total limit.
- Each payment amount.
- Pending and settled records.
- Recorded settlement hashes.
- The remaining amount.

Do not delete or edit the real budget file to bypass the limit.

## 9. Understand Reconciliation

Run the reconciliation tests:

```sh
node --test test/stellar-reconciliation.test.js
```

Then inspect:

```sh
code src/stellar/reconcile-budget.js
```

Reconciliation handles two cases:

| Pending Record | Behavior |
| --- | --- |
| Has a settlement hash | Independently verify the transaction before marking it settled |
| Has no settlement hash | Leave funds reserved and report the unresolved outcome |

Run the read-only payment recovery command:

```sh
npm run budget:reconcile
```

It may update local reservation status, but it does not submit payments.

A pending reservation becoming settled does not increase the remaining budget.

## 10. Optional Live Exercise

With the service running:

```sh
npm run pay:stellar
npm run budget:status
```

This authorizes another payment of **0.01 testnet USDC**.

Confirm that:

- The policy approves the terms.
- A reservation is created before submission.
- Ledger verification succeeds.
- The reservation becomes settled.
- The remaining budget decreases by `100000` atomic units.

The local exercises above are sufficient to demonstrate policy refusal and budget exhaustion without additional payments.

## Where a Model Fits

A model may help select a useful service or explain a result.

Payment authority belongs to the policy and budget layers. Model output must not:

- Change the approved recipient.
- Change the permitted network or asset.
- Increase spending limits.
- Remove pending reservations.
- Override a refusal.

The repository’s current paying client is deterministic. Model integration remains a separate development stage.

## Deliverable

Submit:

- An explanation of the per-payment ceiling and total budget.
- One policy refusal demonstrated without signing.
- One temporary budget exhaustion demonstration.
- A description of how pending payments affect available funds.
- A description of what reconciliation can and cannot recover.

## Completion Checklist

- [ ] Payment terms are validated before signing.
- [ ] Unapproved terms are refused.
- [ ] The total budget persists across client runs.
- [ ] Pending payments count against the budget.
- [ ] Completed spending is not returned to the budget.
- [ ] Uncertain outcomes do not trigger automatic payment retries.
- [ ] Reconciliation preserves unresolved reservations.
- [ ] Model suggestions cannot override payment permissions.

## Current Boundaries

The budget is a local spending control for this client. It does not prevent another program or wallet from spending the buyer’s funds.

It depends on preserving the local budget records and operating within the application’s intended environment.

Recovery currently requires a recorded settlement hash. Reservations without one remain unresolved.

## What Comes Next

Session 4 uses a configurable service origin and resource identifier to discover another service while preserving recipient approval and the buyer’s shared budget.