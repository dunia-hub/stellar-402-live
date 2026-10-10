# Run the Stellar Testnet Payment Flow

Run a service that accepts a **0.01 testnet USDC payment through x402**, then verify settlement and inspect the client’s persistent budget.

The client discovers the resource, validates payment terms, reserves funds, and signs a payment payload. The service uses a facilitator for verification and settlement. The client independently checks the resulting transfer through testnet Horizon.

## Requirements

- Node.js 24 or later
- npm
- Internet access
- Testnet USDC from Circle’s faucet

Run commands from the repository root.

## 1. Install and Validate

```sh
npm ci
npm run check
npm test
```

## 2. Create Testnet Accounts

Confirm that credentials are ignored:

```sh
git check-ignore .env
```

Expected output:

```text
.env
```

Create buyer and recipient accounts:

```sh
npm run wallets:create
```

The script saves credentials in `.env` with restricted permissions and prints public keys only. It refuses to overwrite an existing file.

If accounts already exist, preserve the current configuration.

### Configuration

| Variable | Purpose |
| --- | --- |
| `STELLAR_PRIVATE_KEY` | Buyer secret key used by the client |
| `STELLAR_RECIPIENT` | Approved recipient public key |
| `STELLAR_RECIPIENT_SECRET` | Recipient secret key used during account setup |
| `STELLAR_PORT` | Local service port; defaults to `3001` |
| `STELLAR_SERVICE_ORIGIN` | Optional client target; defaults to the local service |
| `STELLAR_RESOURCE_ID` | Optional resource identifier; defaults to `business-checklist` |

The running service needs only the recipient public key. Do not share secret keys or commit `.env`.

## 3. Fund Accounts and Create Trustlines

```sh
npm run wallets:setup
```

The script:

1. Checks whether each account exists.
2. Funds missing accounts with testnet XLM through Stellar Friendbot.
3. Creates missing USDC trustlines.
4. Prints public keys and transaction hashes.

Existing accounts and trustlines are preserved on subsequent runs.

Friendbot supplies XLM for account reserves and applicable network fees. It does not supply USDC.

## 4. Fund the Buyer with Testnet USDC

Open [Circle’s faucet](https://faucet.circle.com), select **Stellar Testnet**, and enter the buyer public key.

The project uses USDC issued by:

```text
GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Both accounts need USDC trustlines. Only the buyer needs faucet USDC to purchase the resource.

## 5. Start the Service

In the first terminal:

```sh
npm run start:stellar
```

The default origin is:

```text
http://127.0.0.1:3001
```

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | HTTP service health |
| `GET /.well-known/stellar-402.json` | Public service manifest |
| `GET /resource` | Payment-protected resource |

The health response does not establish facilitator availability or successful settlement.

## 6. Inspect Discovery

In a second terminal:

```sh
curl -fsS http://127.0.0.1:3001/.well-known/stellar-402.json
```

The manifest advertises the `business-checklist` resource at `/resource`.

Discovery cannot approve a recipient, change payment limits, or expand the client’s budget.

## 7. Complete the Payment

```sh
npm run pay:stellar
```

Each successful invocation purchases access again.

The client:

1. Fetches and validates the service manifest.
2. Selects the configured resource.
3. Requests it without payment.
4. Receives HTTP 402 payment requirements.
5. Checks the scheme, network, asset, recipient, and amount.
6. Reserves funds in the persistent budget.
7. Creates a signed payment payload.
8. Submits one paid request.
9. Checks successful settlement evidence.
10. Records the settlement hash.
11. Independently verifies the transfer through Horizon.
12. Marks the reservation settled.
13. Displays the resource.

Expected output includes:

```text
Discovered resource: Small-business planning checklist
Unpaid request: HTTP 402
Policy approved:
...
Budget reservation: ...
Remaining budget atomic units: ...
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: ...
Ledger verification passed: ledger ...
Budget reservation settled.
Unlocked resource:
...
```

Identifiers and ledger numbers vary between runs.

## Payment Permissions

| Term | Allowed Value |
| --- | --- |
| Scheme | `exact` |
| Network | `stellar:testnet` |
| Asset | Approved testnet USDC asset contract |
| Recipient | Configured `STELLAR_RECIPIENT` |
| Per-payment ceiling | 0.01 USDC |
| Persistent total budget | 1 USDC per buyer |

Stellar USDC uses seven decimal places:

- `100000` atomic units = 0.01 USDC.
- `10000000` atomic units = 1 USDC.

## 8. Inspect the Budget

```sh
npm run budget:status
```

The budget records pending and settled payments under:

```text
.local/budget-BUYER_PUBLIC_KEY.json
```

The file is ignored by Git.

Both statuses count against the limit. Settling a reservation does not restore spent funds.

The budget persists across runs and is shared across service targets for the same buyer. It starts tracking when the budgeted client is first used; it does not import earlier wallet activity.

Do not delete or edit the budget file to bypass the limit.

## 9. Verify an Existing Payment

Replace `TRANSACTION_HASH` with the hash printed by the client:

```sh
npm run verify:stellar -- TRANSACTION_HASH
```

This command does not spend funds.

It independently checks:

- The expected network.
- Transaction success.
- The USDC issuer.
- Buyer and recipient accounts.
- The exact amount.
- Matching debit and credit under the same operation.

The standalone command expects 0.01 USDC. The paying client verifies the amount approved from its payment challenge.

The verifier accepts one matching USDC transfer per transaction and rejects potentially incomplete effect pages.

## 10. Reconcile Pending Payments

```sh
npm run budget:reconcile
```

The command sends no payments.

| Pending Record | Result |
| --- | --- |
| Recorded hash verifies successfully | Reservation becomes settled |
| Recorded hash cannot be verified | Reservation remains pending |
| No recorded hash | Reservation remains unresolved |

Funds remain allocated in every case. Reconciliation does not automatically refund reservations.

The current reservation records do not store the original recipient. Reconciliation uses the currently configured buyer and recipient, so preserve the original payment configuration when recovering pending payments.

## Target Another Service

Configure an approved service and resource in `.env`:

```dotenv
STELLAR_SERVICE_ORIGIN=https://builder.example
STELLAR_RESOURCE_ID=market-report
STELLAR_RECIPIENT=THE_BUILDERS_VALID_STELLAR_PUBLIC_KEY
```

These are illustrative placeholders.

Remote origins require HTTPS. Local loopback origins may use HTTP for development.

Confirm the recipient separately from the manifest. Preserve the buyer credentials and existing budget.

The default server binds to loopback. Access from another computer requires an appropriate deployment.

## Run the Local Simulation

```sh
npm run demo
```

The simulation requires no wallet or network access. It uses a separate educational challenge and receipt mechanism.

Its replay tests do not establish replay protection for the live x402 integration.

## Troubleshooting

### Network Requests Time Out

Network commands include:

```text
--network-family-autoselection-attempt-timeout=5000
```

This longer connection-attempt window resolved the timeout encountered during initial setup. Other failures may require separate diagnosis.

### `.env` Already Exists

Wallet creation deliberately refuses to overwrite credentials.

Inspect the existing file locally:

```sh
code .env
```

### The Buyer Has XLM but Cannot Pay

Check that the buyer has a USDC trustline and a positive balance from Circle’s Stellar Testnet faucet.

### Discovery Fails

Check the configured origin, advertised resource identifier, and manifest response.

Restart the service after changing server code.

### The Budget Refuses Payment

Inspect:

```sh
npm run budget:status
```

Pending payments reduce available funds alongside completed spending.

### A Budget Lock Remains

A leftover lock blocks updates. Do not remove it while another process may be updating the budget.

Recovery procedures for interrupted updates remain follow-up work.

### Submission Times Out

A timeout does not prove payment failed.

Inspect service output and available transaction evidence before rerunning the client. The client does not automatically retry signed requests.

### Verification Fails After HTTP 200

Settlement may already have completed.

If its hash was recorded, run:

```sh
npm run budget:reconcile
```

Do not submit another payment simply because independent verification failed.

## Current Boundaries

- Settlement depends on the configured facilitator.
- Independent verification confirms transfer evidence, not binding to a new request.
- Live signed-payload replay behavior remains untested in this repository.
- Recovery requires a recorded settlement hash.
- Reservations do not yet preserve complete original payment context.
- The budget is a local client control, not a wallet-wide spending restriction.
- Discovery targets one configured service at a time.
- Independent-builder demonstrations and fresh-environment workshop rehearsal remain follow-up work.

## References

- [Stellar x402 Quickstart](https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide)
- [Circle Testnet Faucet](https://faucet.circle.com)
- [Payment Evidence](testnet-evidence.md)
- [Delivery Roadmap](roadmap.md)