# Session 2: Pay and Verify on Stellar Testnet

## Goal

Complete a real payment-enabled request on Stellar testnet and independently verify the settlement.

This session moves from simulated receipts to the repository’s x402 service and payment client.

## What You Will Build

A working flow that:

1. Requests a protected resource.
2. Receives HTTP 402 payment requirements.
3. Approves the payment terms.
4. Authorizes a testnet USDC payment.
5. Receives the resource after settlement.
6. Independently verifies the transfer through testnet Horizon.

## Requirements

- Node.js 24 or later
- npm
- Internet access
- The repository installed locally
- Two testnet accounts, created during this session
- Testnet USDC from Circle’s faucet

Run commands from the repository root.

Use newly created testnet accounts for the exercise. Never use accounts holding real funds.

## 1. Validate the Project

```sh
npm ci
npm run check
npm test
```

Expected result: syntax checks complete successfully and the tests pass.

## 2. Create the Buyer and Recipient Accounts

Confirm that Git ignores the local credentials file:

```sh
git check-ignore .env
```

Expected output:

```text
.env
```

Create the accounts:

```sh
npm run wallets:create
```

The script:

- Creates a buyer keypair and a recipient keypair.
- Saves credentials in `.env` with restricted file permissions.
- Prints public keys only.
- Refuses to overwrite an existing `.env`.

If you completed account setup previously, preserve your existing accounts and continue to the next step.

### Account Roles

| Account | Role |
| --- | --- |
| Buyer | Signs payment authorizations and purchases access |
| Recipient | Receives the service’s USDC payments |

The recipient secret key is needed for initial trustline setup. The running service needs only the recipient public key.

## 3. Fund Accounts and Create USDC Trustlines

```sh
npm run wallets:setup
```

The script funds missing accounts with testnet XLM through Stellar Friendbot and creates USDC trustlines.

A trustline allows an account to hold the issued USDC asset.

Expected output includes:

```text
Buyer: G...
Account funded with testnet XLM.
USDC trustline created: ...

Recipient: G...
Account funded with testnet XLM.
USDC trustline created: ...

Account setup complete.
```

Previously funded accounts and existing trustlines are skipped.

### Why Two Faucets?

| Faucet | Asset | Purpose |
| --- | --- | --- |
| Stellar Friendbot | Testnet XLM | Account reserves and applicable network fees |
| Circle faucet | Testnet USDC | Purchasing the protected resource |

Friendbot does not fund the buyer with USDC.

## 4. Fund the Buyer with Testnet USDC

Open [Circle’s faucet](https://faucet.circle.com).

Select **Stellar Testnet** and enter the buyer public key printed by the setup script.

The USDC issuer used by this project is:

```text
GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Do not enter a secret key into the faucet.

## 5. Start the Stellar Service

In the first terminal:

```sh
npm run start:stellar
```

The default service origin is:

```text
http://127.0.0.1:3001
```

Keep the service running.

## 6. Inspect the Public Manifest

In a second terminal:

```sh
curl -i http://127.0.0.1:3001/.well-known/stellar-402.json
```

Expected result: HTTP 200 with the service description and advertised resource.

The manifest identifies the checklist through:

```json
{
  "id": "business-checklist",
  "path": "/resource"
}
```

Discovery describes the resource. It does not authorize payment.

## 7. Inspect the Unpaid Request

```sh
curl -i http://127.0.0.1:3001/resource
```

Expected result: HTTP `402 Payment Required`.

The live x402 response carries payment requirements in the `PAYMENT-REQUIRED` header. The payment client uses the x402 library to decode those requirements.

Unlike Session 1, this flow uses the x402 protocol and real testnet USDC.

## 8. Complete a Payment

```sh
npm run pay:stellar
```

This command authorizes a new payment of **0.01 testnet USDC**.

The client:

1. Discovers the configured resource.
2. Requests it without payment.
3. Validates the x402 payment terms.
4. Reserves funds in its persistent budget.
5. Creates a signed payment payload.
6. Submits one paid request.
7. Checks successful settlement evidence.
8. Independently verifies the transaction through Horizon.
9. Marks the budget reservation settled.
10. Prints the unlocked resource.

Expected output includes:

```text
Discovered resource: Small-business planning checklist
Unpaid request: HTTP 402
Policy approved:
...
Budget reservation: ...
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: ...
Ledger verification passed: ledger ...
Budget reservation settled.
Unlocked resource:
...
```

Public keys, reservation IDs, transaction hashes, and ledger numbers vary between runs.

## 9. Inspect the Persistent Budget

```sh
npm run budget:status
```

After the first budgeted payment, a fresh budget should show:

```text
"limitAtomic": "10000000"
"amountAtomic": "100000"
"status": "settled"
"remainingAtomic": "9900000"
```

These values represent:

| Value | Meaning |
| --- | --- |
| `10000000` | 1 USDC total budget |
| `100000` | 0.01 USDC payment |
| `9900000` | 0.99 USDC remaining |

Previous budgeted payments reduce the remaining amount further.

Do not delete the budget file to recover funds or bypass the limit.

## 10. Independently Check the Existing Payment

Copy the settlement transaction hash printed by the client.

Run the following command, replacing `TRANSACTION_HASH` with that hash:

```sh
npm run verify:stellar -- TRANSACTION_HASH
```

This command does not submit another payment.

It checks:

- The expected testnet network.
- Transaction success.
- The USDC issuer.
- The buyer and recipient accounts.
- The exact payment amount.
- A debit and credit belonging to the same operation.

Expected output includes:

```text
Payment independently verified through testnet Horizon:
```

The verifier currently accepts one matching USDC transfer per transaction. It rejects multiple USDC transfers and potentially incomplete effect pages.

The standalone command expects the exercise’s fixed payment amount of 0.01 USDC. The paying client verifies the amount approved from its payment challenge.

## 11. Check Pending Reservations

```sh
npm run budget:reconcile
```

For a completed payment, expected output is:

```text
No pending payments to reconcile.
```

When a pending reservation has a recorded settlement hash, reconciliation verifies that transaction before marking it settled.

A reservation without a hash remains pending. The command does not guess a transaction, send another payment, or release funds automatically.

## Deliverable

Submit:

- The buyer and recipient public keys.
- A successful payment transaction hash.
- The HTTP 402 and HTTP 200 results.
- Independent ledger verification output.
- Budget status showing the settled reservation.

Keep secret keys and the contents of `.env` private.

## Completion Checklist

- [ ] Both accounts have testnet XLM.
- [ ] Both accounts have USDC trustlines.
- [ ] The buyer has testnet USDC.
- [ ] The resource is advertised in the public manifest.
- [ ] An unpaid request receives HTTP 402.
- [ ] The client validates terms before signing.
- [ ] The paid request returns HTTP 200.
- [ ] Independent ledger verification succeeds.
- [ ] The payment is recorded in the persistent budget.

## Troubleshooting

### A network request times out

The network commands include a longer connection-attempt window that resolved the timeout encountered during initial development.

If requests continue to fail, inspect the underlying connection error before changing payment logic.

### The recipient does not have a USDC trustline

Rerun:

```sh
npm run wallets:setup
```

The script preserves existing accounts and trustlines.

### The budget refuses the payment

Inspect:

```sh
npm run budget:status
```

Pending and settled payments both count against the total limit.

### A payment request fails or times out

Do not assume the payment failed.

Inspect the service output and available transaction evidence before rerunning the paying client. Another invocation may authorize another payment.

### Ledger verification fails after HTTP 200

Settlement may have completed even if independent verification failed.

The reservation remains pending. If a settlement hash was recorded, retry verification through:

```sh
npm run budget:reconcile
```

## Current Boundaries

This exercise demonstrates verified payment and resource access.

It does not establish live signed-payload replay protection or binding a previously settled transaction to a new resource request. Independent transfer verification alone does not authorize another resource purchase.

## What Comes Next

Session 3 examines payment permissions, spending ceilings, persistent budgets, and safe handling of uncertain outcomes.