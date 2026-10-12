# Participant Preparation

Stellar 402 Live includes four online workshops and an in-person finale. This checklist helps you arrive ready to build.

You do not need a paid model API. Session 1 does not require a wallet or testnet funds.

## Before Session 1

### Install Your Tools

- Node.js 24 or later
- Git
- A code editor, such as VS Code

Check your versions:

```sh
node --version
npm --version
git --version
```

### Set Up the Repository

```sh
git clone https://github.com/dunia-hub/stellar-402-live.git
cd stellar-402-live
npm ci
```

Run the checks and local demo:

```sh
npm run check
npm test
npm run demo
```

The demo uses simulated receipts and makes no blockchain payment.

If installation or checks fail, keep the error message so the facilitator can help. Do not use a forced dependency update to bypass an installation issue.

### Choose a Practical Need

Bring a short answer to these questions:

- Who could use your service?
- What problem do they face?
- What digital resource could help them?

Start small. A checklist, template, educational resource, or report using synthetic data is enough for the first exercise.

## Before Session 2

### Create Testnet Accounts

Confirm that Git ignores the local credentials file:

```sh
git check-ignore .env
```

Create the buyer and recipient accounts:

```sh
npm run wallets:create
```

If `.env` already exists, preserve it. The script refuses to overwrite existing credentials.

### Fund Accounts and Create USDC Trustlines

```sh
npm run wallets:setup
```

The script funds accounts with testnet XLM and creates their USDC trustlines.

Fund the buyer with testnet USDC through [Circle’s faucet](https://faucet.circle.com). Select **Stellar Testnet** and enter the buyer public key printed by the setup script.

Do not enter a secret key into the faucet.

### Check the Live Setup

Start the service in one terminal:

```sh
npm run start:stellar
```

In another terminal, from the repository root:

```sh
npm run preflight
```

Preflight checks discovery, payment terms, accounts, USDC trustlines, available funds, and the application budget. It does not submit a payment.

Resolve reported issues before the live payment exercise.

## Before Session 3

Keep your existing accounts and budget records.

Inspect the budget:

```sh
npm run budget:status
```

Read:

- [Session 3: Payment Policies](../workshops/03-agent-policy/README.md)
- [Payment Preflight](payment-preflight.md)

Be ready to explain the difference between:

- A per-payment ceiling.
- A persistent total budget.
- A pending reservation.
- A settled payment.

Do not delete budget records to restore spending capacity.

## Before Session 4

Read:

- [Session 4: Service Discovery](../workshops/04-discovery/README.md)

Know your service’s:

- Origin.
- Resource identifier.
- Manifest endpoint.
- Recipient public key.

The repository advertises its example resource at:

```text
/.well-known/stellar-402.json
```

Remote services require HTTPS. Local exercises can use HTTP on loopback addresses.

Confirm another builder’s recipient separately from their manifest. Never exchange secret keys.

## Before the Finale

Prepare:

- A project repository.
- A short explanation of the intended user and practical need.
- Setup and run instructions.
- A service manifest.
- A successful testnet payment hash.
- Independent verification output.
- A demonstration of one refused request.
- A recorded fallback for connectivity problems.

Follow the [finale guide](../workshops/05-finale/README.md).

## Keep Credentials Private

Public keys and transaction hashes may be shared as demonstration evidence.

Keep these private:

- Secret keys.
- `.env` contents.
- Signed payment payloads and payment headers.
- Sensitive personal or customer data.

Use fresh testnet accounts. Do not use wallets holding real funds.

## When Something Fails

### Setup or Connection Failure

Keep the command and error output. Remove credentials before sharing screenshots or logs.

### Payment Failure or Timeout

Do not immediately run the paying client again. Settlement may have occurred even if the request failed.

Inspect:

```sh
npm run budget:status
```

If a pending reservation has a recorded settlement hash:

```sh
npm run budget:reconcile
```

Reservations without sufficient evidence remain allocated.

### Need Help?

Share:

- The session and exercise.
- The command you ran.
- The error message.
- Your Node.js and npm versions.

Never share a secret key or paste your `.env`.

## Useful Guides

- [Session 1: Local Service](../workshops/01-service/README.md)
- [Session 2: Testnet Payments](../workshops/02-stellar-payments/README.md)
- [Session 3: Payment Policies](../workshops/03-agent-policy/README.md)
- [Session 4: Discovery](../workshops/04-discovery/README.md)
- [Finale](../workshops/05-finale/README.md)
- [Testnet Payment Setup](testnet-payments.md)
- [Payment Preflight](payment-preflight.md)