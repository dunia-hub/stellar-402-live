# Payment Preflight

Check the configured service, payment terms, account balances, trustlines, and application budget before running the paying client.

Preflight does not sign a payment payload, reserve additional funds, or submit a payment.

## Requirements

- Testnet accounts configured in `.env`.
- Buyer funded with testnet USDC.
- Buyer and recipient USDC trustlines established.
- The target service running and reachable.

## Run Preflight

For the default configured service:

```sh
npm run preflight
```

For a local service on port 3002:

```sh
STELLAR_SERVICE_ORIGIN=http://127.0.0.1:3002 npm run preflight
```

The command uses the same service origin, resource identifier, and approved recipient configuration as the paying client.

## Checks

| Area | Check |
| --- | --- |
| Discovery | The manifest is valid and advertises the selected resource |
| Resource | The unpaid request returns HTTP 402 |
| Payment policy | Scheme, network, asset, recipient, and amount are approved |
| Ledger | The endpoint identifies the expected Stellar testnet |
| Accounts | Returned account identities match the configured accounts |
| XLM | Both accounts have a positive native balance |
| Trustlines | Both accounts have authorized trustlines for the approved USDC |
| Buyer funds | USDC balance minus selling liabilities covers the payment |
| Recipient capacity | Trustline capacity after buying liabilities covers the payment |
| Budget | Available application budget covers the payment |

Pending reservations are reported and remain allocated.

## Expected Output

Values depend on the accounts and existing budget.

```text
Preflight passed:
{
  "serviceOrigin": "http://127.0.0.1:3002",
  "resource": "business-checklist",
  "buyer": "G...",
  "recipient": "G...",
  "paymentAmountAtomic": "100000",
  "buyerAvailableAtomic": "...",
  "recipientCapacityAtomic": "...",
  "remainingBudgetAtomic": "...",
  "pendingReservations": 1
}
Pending reservations remain allocated; preflight did not resolve them.
No payload signed, funds reserved, or payment submitted.
Checks reflect current state; successful settlement is not guaranteed.
```

USDC amounts use seven decimal places. A payment amount of `100000` atomic units represents 0.01 USDC.

## Verified Run

On 12 October 2026, preflight succeeded against the local service on port 3002.

| Field | Observed Value |
| --- | --- |
| Resource | `business-checklist` |
| Payment amount | 0.01 testnet USDC |
| Available buyer USDC | 19.93 USDC |
| Available application budget | 0.94 USDC |
| Pending reservations | 1 |
| Automated tests | 86 passed |

No payment was submitted during the check.

The pending reservation was the replay contingency documented in [Live Replay Observation](replay-observation.md).

## Use During Workshops

Run preflight after account setup and before the live payment exercise:

```sh
npm run preflight
```

If it passes and you intend to purchase the resource:

```sh
npm run pay:stellar
```

The paying client repeats its payment-policy and budget checks. Preflight does not authorize a later payment.

For the second-service exercise:

```sh
STELLAR_SERVICE_ORIGIN=http://127.0.0.1:3002 npm run preflight
```

Use the same origin when subsequently running the paying client.

## Failure Handling

A failed preflight exits with an error.

Resolve the reported issue before attempting payment:

- Missing trustline: rerun wallet setup.
- Insufficient buyer USDC: fund the buyer through the testnet faucet.
- Invalid manifest or missing resource: inspect the service configuration.
- Unapproved payment terms: confirm the terms without removing policy checks.
- Insufficient budget: inspect existing reservations.
- Ledger connection failure: diagnose connectivity and retry preflight.

Retrying preflight does not submit a payment.

## Boundaries

Preflight checks current state. It does not guarantee that settlement will succeed.

It does not:

- Establish sufficient XLM reserves or transaction fees.
- Resolve pending reservations.
- Prove facilitator availability throughout settlement.
- Guarantee that prices or balances remain unchanged.
- Verify live replay protection.

The budget snapshot may initialize or migrate the local budget file. It does not create additional payment reservations.

## Related Guides

- [Testnet Payment Setup](testnet-payments.md)
- [Payment Evidence](testnet-evidence.md)
- [Delivery Roadmap](roadmap.md)