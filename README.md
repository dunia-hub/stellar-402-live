# Stellar 402 Live

**Build AI agents that discover services, pay on Stellar, and unlock access.**

Stellar 402 Live is a five-day hybrid builder program by [Dunia Hub](https://duniahub.xyz), combining four online workshops with an in-person finale.

Participants begin with a practical need, build payment-enabled digital services, and connect their projects into a small marketplace on Stellar testnet.

## What We Are Building

An agent requests a useful resource. The service responds with HTTP `402 Payment Required`. The client evaluates the payment terms, authorizes a payment within its spending limits, and receives the resource after settlement.

Services could provide educational resources, creator templates, small-business tools, fraud checks, or market information. Builders are encouraged to identify the intended user and practical value before choosing an implementation.

## Working Foundation

The repository includes:

- A local HTTP 402 simulation with receipt expiry and replay rejection.
- A Stellar x402 service accepting testnet USDC.
- Testnet account creation, XLM funding, and USDC trustline setup.
- A public service manifest and validated resource discovery.
- Configurable service origins and resource identifiers.
- Payment checks for scheme, network, asset, recipient, and amount.
- A persistent spending budget shared across service targets for each buyer.
- Independent settlement verification through testnet Horizon.
- Reconciliation of pending payments with recorded settlement hashes.
- Workshop exercises and a finale demonstration guide.
- Automated tests and GitHub Actions validation.

The paying client is deterministic. A model provider is not required.

## How the Payment Flow Works

1. **Discover:** Read the configured service’s public manifest.
2. **Request:** Ask for the advertised resource.
3. **Validate:** Check the HTTP 402 payment requirements.
4. **Reserve:** Allocate funds from the persistent budget.
5. **Sign:** Create a payment payload for an approved option.
6. **Settle:** Submit the paid request through the service’s x402 integration.
7. **Verify:** Check settlement evidence against independent ledger data.
8. **Record:** Mark the budget reservation settled.
9. **Display:** Show the returned resource.

The service delegates payment verification and settlement to its configured facilitator. The client separately checks the resulting transfer through Horizon before reporting success.

## Program Structure

| Session | Focus | Deliverable |
| --- | --- | --- |
| [01 · Digital Services and HTTP 402](workshops/01-service/README.md) | Build a useful resource and inspect payment challenges | A working local simulation |
| [02 · Stellar Testnet Payments](workshops/02-stellar-payments/README.md) | Configure accounts and complete a verified payment | Testnet settlement and resource access |
| [03 · Agent Spending Policies](workshops/03-agent-policy/README.md) | Apply payment permissions and persistent budgets | Allowed payments and demonstrated refusals |
| [04 · Service Discovery](workshops/04-discovery/README.md) | Validate manifests and target another service | Discovery with existing payment controls |
| [05 · Marketplace Finale](workshops/05-finale/README.md) | Bring builder projects together | A demonstration with payment evidence |

## Getting Started

### Requirements

- Node.js 24 or later
- npm
- Git

Network access and testnet funds are needed for the live Stellar flow. Core exercises do not require paid model APIs.

### Install

```sh
git clone https://github.com/dunia-hub/stellar-402-live.git
cd stellar-402-live
npm ci
```

### Validate

```sh
npm run check
npm test
```

### Run the Local Simulation

```sh
npm run demo
```

This example requires no wallets, funds, or network access. It demonstrates payment-term validation, simulated resource access, and receipt replay rejection.

The simulation uses a separate educational protocol. Its replay tests do not establish replay protection for the live x402 integration.

## Run the Stellar Testnet Flow

### Create and Configure Accounts

Confirm that credentials are ignored:

```sh
git check-ignore .env
```

Create the buyer and recipient:

```sh
npm run wallets:create
```

Fund their accounts with testnet XLM and create USDC trustlines:

```sh
npm run wallets:setup
```

Wallet creation refuses to overwrite an existing `.env`. Preserve your existing configuration if accounts have already been created.

Fund the buyer with testnet USDC through [Circle’s faucet](https://faucet.circle.com), selecting **Stellar Testnet**.

### Start the Service

In the first terminal:

```sh
npm run start:stellar
```

### Run the Paying Client

In a second terminal, from the repository root:

```sh
npm run pay:stellar
```

Each successful run makes a new payment of **0.01 testnet USDC**.

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

See the [testnet payment guide](docs/testnet-payments.md) for account setup and troubleshooting, and the [payment evidence](docs/testnet-evidence.md) for recorded runs.

## Spending Controls

| Control | Default |
| --- | --- |
| Network | Stellar testnet |
| Asset | Approved testnet USDC |
| Recipient | Explicitly configured public key |
| Per-payment ceiling | 0.01 USDC |
| Persistent total budget | 1 USDC per buyer |

Pending and settled payments both count against the total budget. Restarting the client does not reset recorded spending.

Inspect the budget:

```sh
npm run budget:status
```

The budget is stored locally under `.local/`, which is ignored by Git. It controls spending through this client; it does not restrict other applications using the same wallet.

## Verify and Reconcile Payments

Verify an existing 0.01 USDC payment by replacing `TRANSACTION_HASH` with its settlement hash:

```sh
npm run verify:stellar -- TRANSACTION_HASH
```

The verifier checks the network, transaction success, USDC issuer, buyer, recipient, exact amount, and matching debit and credit under one operation.

Reconcile pending reservations:

```sh
npm run budget:reconcile
```

This command submits no payments. Reservations with recorded hashes are independently verified before being marked settled.

Reservations without hashes, or whose verification fails, remain allocated.

## Target Another Service

The client defaults to the local service. Optional configuration selects a different origin and resource:

```dotenv
STELLAR_SERVICE_ORIGIN=https://builder.example
STELLAR_RESOURCE_ID=market-report
STELLAR_RECIPIENT=THE_BUILDERS_VALID_STELLAR_PUBLIC_KEY
```

These values are illustrative placeholders.

Remote origins require HTTPS. Local loopback origins may use HTTP for development.

Recipient approval remains separate from the service manifest. Discovery cannot change payment permissions or increase the budget.

The default server binds to loopback. A service intended for access from another computer needs an appropriate deployment.

## Repository Structure

| Path | Contents |
| --- | --- |
| `src/` | Local simulation service, client, and policy |
| `src/stellar/` | Live service, client, discovery, verification, budgets, and reconciliation |
| `scripts/` | Account setup, payment verification, and budget commands |
| `test/` | Automated tests |
| `docs/` | Setup instructions, evidence, and roadmap |
| `workshops/` | Exercises and finale guide |
| `.github/workflows/` | Continuous integration |
| `.env.example` | Configuration template |

## Payment Safety

- Use testnet accounts and funds.
- Keep secret keys in ignored local configuration.
- Keep credentials out of commits, screenshots, and logs.
- Validate payment terms before signing.
- Preserve pending reservations when outcomes are uncertain.
- Check settlement evidence before attempting another payment.
- Keep model suggestions separate from payment authority.

A failed or timed-out request does not prove that settlement failed. The client does not automatically retry signed payment requests.

## Current Boundaries

- Discovery targets one configured service at a time.
- Cross-builder deployment and payment demonstrations still require rehearsal.
- Live signed-payload replay behavior has not yet been tested in this repository.
- Transfer verification does not establish binding to a new resource request.
- Pending-payment recovery requires a recorded settlement hash.
- The ledger verifier accepts one matching USDC transfer per transaction.
- Budget enforcement depends on preserving the local state.
- Model integration is not implemented.
- The complete workshop sequence still needs a fresh-environment rehearsal.

See the [delivery roadmap](docs/roadmap.md) for remaining work.

## Contributing

Keep changes focused, document resulting behavior, and include meaningful tests.

Before committing:

```sh
npm run check
npm test
git diff --check
```

Use clear commit messages:

```text
feat: validate service manifests
test: reject payments above the remaining budget
docs: explain pending-payment recovery
```

Service examples should explain their intended users, practical value, and setup requirements.

## About Dunia Hub

Dunia Hub creates practical learning experiences around AI, blockchain, and open-source development.

Stellar 402 Live brings these areas together: identify a need, build a useful service, and demonstrate how an agent can discover and pay for it.

[Visit Dunia Hub](https://duniahub.xyz)

## References

- [Stellar x402 Quickstart](https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide)
- [Stellar x402 Repository](https://github.com/stellar/x402-stellar)
- [Circle Testnet Faucet](https://faucet.circle.com)