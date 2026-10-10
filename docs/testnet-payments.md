# Run the Stellar Testnet Payment Flow

This guide runs a local digital service that accepts a **0.01 USDC payment through x402 on Stellar testnet**.

The client validates payment terms before signing. The service uses a managed facilitator to verify and settle the payment before returning the protected resource.

## Requirements

- Node.js 24 or later
- npm
- Internet access
- Testnet USDC from Circle’s faucet

Run all commands from the repository root.

## 1. Install and validate

```sh
npm ci
npm run check
npm test
```

## 2. Create testnet wallets

Confirm that the local environment file is ignored by Git:

```sh
git check-ignore .env
```

Expected output:

```text
.env
```

Create the buyer and service recipient accounts:

```sh
npm run wallets:create
```

The script saves credentials in `.env` with restricted file permissions, prints public keys only, and refuses to overwrite an existing file.

The configuration contains:

| Variable | Purpose |
| --- | --- |
| `STELLAR_PRIVATE_KEY` | Buyer secret key used by the payment client |
| `STELLAR_RECIPIENT` | Public key of the service’s payment recipient |
| `STELLAR_RECIPIENT_SECRET` | Recipient secret key used during account and trustline setup |
| `STELLAR_PORT` | Local service port, defaulting to `3001` |

The service itself requires only the recipient public key. Keep secret keys out of commits, screenshots, and logs.

If `.env` already exists, inspect it locally rather than generating replacement accounts:

```sh
code .env
```

## 3. Fund accounts and create USDC trustlines

```sh
npm run wallets:setup
```

The setup script:

1. Checks whether each account exists.
2. Funds missing accounts with testnet XLM through Friendbot.
3. Creates a USDC trustline for each account if one is missing.
4. Prints public keys and submitted transaction hashes.

Existing accounts and trustlines are preserved when the script is rerun.

Testnet XLM covers account reserves and applicable network fees. It does not provide the USDC needed to purchase the resource.

## 4. Fund the buyer with testnet USDC

Open [Circle’s faucet](https://faucet.circle.com).

Select **Stellar Testnet** and enter the buyer public key printed by the wallet setup script.

The USDC asset used by this project has the following testnet issuer:

```text
GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Both accounts need the trustline, but only the buyer needs faucet USDC to initiate the payment.

## 5. Start the service

In the first terminal:

```sh
npm run start:stellar
```

The service listens on:

```text
http://127.0.0.1:3001
```

If `STELLAR_PORT` is configured differently, the service and client use that port.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Returns service health information |
| `GET /resource` | Requests the payment-protected resource |

The health endpoint confirms that the HTTP service is running. It does not establish facilitator availability or successful payment settlement.

## 6. Request and pay for the resource

In a second terminal, from the repository root:

```sh
npm run pay:stellar
```

The client:

1. Requests `/resource` without payment.
2. Receives an HTTP `402 Payment Required` response.
3. Reads the x402 payment requirements.
4. Checks the scheme, network, asset, recipient, and amount.
5. Creates a signed payment payload for an approved option.
6. Submits one paid request.
7. Requires HTTP `200` and successful testnet settlement evidence.
8. Prints the settlement transaction hash and unlocked resource.

The payment policy permits:

| Payment term | Allowed value |
| --- | --- |
| Scheme | `exact` |
| Network | `stellar:testnet` |
| Asset | The configured testnet USDC asset contract |
| Recipient | The public key configured in `STELLAR_RECIPIENT` |
| Maximum amount | `0.01 USDC` per client run |

Stellar USDC uses seven decimal places. Therefore, `100000` atomic units represent `0.01 USDC`.

## Expected output

Public keys and transaction hashes vary between runs.

```text
Unpaid request: HTTP 402
Policy approved:
  Buyer: G...
  Recipient: G...
  USDC atomic units: 100000
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: ...
Unlocked resource:
{"resource":"/resource","content":{"title":"Small-business planning checklist","items":["Identify the customer need","Estimate delivery costs","Set a spending budget"]}}
```

Each successful invocation purchases access again. The per-payment limit does not impose a cumulative budget across separate runs.

## Run the local simulation

The introductory demo requires no wallet, testnet funds, or network access:

```sh
npm run demo
```

It demonstrates an HTTP 402 challenge, payment-term validation, simulated receipt consumption, and replay rejection.

The simulation uses its own challenge and receipt mechanism. Its replay tests do not establish replay protection for the live x402 integration.

## Troubleshooting

### Network requests time out

The wallet setup, Stellar service, and payment client commands include:

```text
--network-family-autoselection-attempt-timeout=5000
```

This longer connection-attempt window resolved the timeout encountered during the initial account setup. Other network failures may require separate diagnosis.

### Wallet creation reports that `.env` already exists

The script deliberately refuses to overwrite credentials.

Inspect the existing file locally:

```sh
code .env
```

Preserve the accounts already created unless you intentionally want to replace them.

### The buyer has XLM but cannot pay in USDC

XLM and USDC are separate assets.

Confirm that the buyer has:

- A trustline for the documented testnet USDC issuer.
- A positive USDC balance from Circle’s Stellar Testnet faucet.

### A payment request times out or fails

A timeout does not prove that settlement failed.

Check the service output and available transaction or account history before running the client again. The client does not automatically retry a signed payment request.

### The payment policy refuses the challenge

Check that the service is requesting:

- The `exact` scheme.
- Stellar testnet.
- The approved testnet USDC asset.
- The configured recipient.
- A positive amount no greater than `0.01 USDC`.

Do not remove validation checks to bypass a refusal.

## Current boundaries

- The implementation is restricted to Stellar testnet.
- Verification and settlement depend on the configured facilitator.
- The client enforces a per-payment ceiling.
- A persistent session budget is not implemented.
- The client checks facilitator settlement evidence.
- Independent ledger reconciliation is not implemented.
- Live signed-payload replay behavior has not yet been tested in this repository.
- No model provider is required for the deterministic client.

## References

- [Stellar x402 quickstart](https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide)
- [Circle testnet faucet](https://faucet.circle.com)
- [Recorded testnet evidence](testnet-evidence.md)
- [Delivery roadmap](roadmap.md)