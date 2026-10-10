# Stellar 402 Live

**Build AI agents that discover services, pay on Stellar, and unlock access.**

Stellar 402 Live is a five-day hybrid builder program by [Dunia Hub](https://duniahub.xyz), bringing together four online workshops and an in-person finale.

Participants build AI agents and payment-enabled digital services, then connect their projects into a small marketplace on Stellar testnet.

The program starts with a practical question: **what happens when an agent can request a service and pay for it too?**

## What We Are Building

A marketplace where AI agents can discover and use services created by different builders.

A service might provide a fraud check, a design template, an educational resource, or information that helps a small business make a decision.

When an agent requests a paid resource, the service returns an HTTP `402 Payment Required` response. The client checks the payment terms against its spending policy, creates a signed payment payload, and retries the request. The service uses an x402 facilitator to verify and settle the payment before returning the resource.

Participants are encouraged to begin with a clearly identified need. Possible areas include:

- Small-business tools
- Cross-border payment information
- Agriculture and market information
- Fraud detection
- Local-language services
- Education
- Digital creator tools

## Working Foundation

The repository currently includes:

- A local HTTP 402 simulation with receipt expiry and replay rejection.
- A Stellar x402 service accepting testnet USDC.
- Testnet wallet creation, XLM funding, and USDC trustline setup.
- A deterministic client that validates payment terms before signing.
- A successful manual 0.01 USDC testnet payment that unlocked a protected resource.
- 22 automated tests.
- GitHub Actions for syntax checks, tests, and the local demo.

Service discovery, persistent session budgets, and optional model integration are planned development stages.

## How the Live Payment Flow Works

1. **Request:** The client requests a protected resource.
2. **Challenge:** The service returns HTTP 402 with x402 payment requirements.
3. **Authorize:** The client checks the scheme, network, asset, recipient, and amount.
4. **Sign:** The client creates a signed payment payload for an approved option.
5. **Settle:** The service delegates verification and settlement to the configured facilitator.
6. **Unlock:** The service returns the resource, and the client checks the settlement response.

The current client permits payments of up to **0.01 testnet USDC per run** to the configured recipient.

HTTP 402 is the response status. The live integration uses the x402 packages to handle payment requirements, signed payloads, and settlement responses.

## Program Structure

| Session | Focus | Builder Outcome |
| --- | --- | --- |
| 01 · Digital Services and HTTP 402 | Define a practical need, build a service, and introduce payment challenges | A protected resource with clear payment terms |
| 02 · Stellar Testnet Payments | Set up accounts, fund them, and complete the x402 payment flow | A resource unlocked after testnet settlement |
| 03 · Agents and Spending Policies | Validate payment terms and enforce spending permissions | A client that accepts permitted payments and refuses prohibited ones |
| 04 · Service Discovery | Publish service information and connect builder projects | An agent that discovers and uses another participant’s service |
| 05 · In-Person Finale | Demonstrate the connected marketplace | A cross-project showcase with testnet payment evidence |

## Learning Outcomes

By the end of the program, participants should be able to:

- Build a digital service around a practical use case.
- Explain how HTTP 402 fits into a payment-enabled request flow.
- Complete a payment-enabled request on Stellar testnet.
- Validate payment terms before authorizing spending.
- Explain the roles of the client, service, and facilitator.
- Test successful access and rejected payment requests.
- Publish service information that other builders can discover.
- Demonstrate an agent using another participant’s service.

## Getting Started

### Requirements

- Node.js 24 or later
- npm
- Git

Core examples use free tooling. A paid model API is not required.

### Install

```sh
git clone https://github.com/dunia-hub/stellar-402-live.git
cd stellar-402-live
npm ci
```

### Validate the Project

```sh
npm run check
npm test
```

### Run the Local Simulation

```sh
npm run demo
```

The simulation requires no wallets, testnet funds, or network access. It demonstrates payment-term validation, resource access, and simulated receipt replay rejection.

### Run the Stellar Testnet Flow

Follow the [testnet payment guide](docs/testnet-payments.md) to create accounts, fund the buyer, and configure USDC trustlines.

Start the service:

```sh
npm run start:stellar
```

In a second terminal:

```sh
npm run pay:stellar
```

A successful run returns HTTP 200, prints a settlement transaction hash, and displays the protected resource.

See the [recorded testnet evidence](docs/testnet-evidence.md) for the successful integration run.

## Repository Structure

| Path | Contents |
| --- | --- |
| `src/` | Local simulation service, client, and payment policy |
| `src/stellar/` | Stellar x402 service, client, configuration, and payment policy |
| `scripts/` | Testnet wallet creation, funding, and trustline setup |
| `test/` | Simulation, configuration, and payment-policy tests |
| `docs/` | Setup guide, payment evidence, and delivery roadmap |
| `workshops/` | Four online session guides and the finale guide |
| `.github/workflows/` | Automated validation |
| `.env.example` | Environment configuration template |

## Payment Safety

Payment authorization happens before signing.

The client permits only the configured recipient, Stellar testnet, the approved USDC asset, and an amount within its per-payment ceiling. Model output must not override these permissions.

The live service depends on its configured facilitator for payment verification and settlement. The client requires successful testnet settlement evidence before reporting success.

Throughout the program:

- Use testnet funds.
- Keep private keys in ignored local configuration.
- Keep credentials out of commits, screenshots, and logs.
- Preserve payment checks when troubleshooting.
- Check uncertain payment outcomes before attempting another payment.
- Clearly identify simulated behavior.

## Current Boundaries

The successful testnet run establishes a working payment-enabled resource flow. Further work remains:

- A persistent session budget is not implemented.
- Independent ledger reconciliation is not implemented.
- Live signed-payload replay behavior has not yet been tested in this repository.
- Service discovery is not implemented.
- The paying client is deterministic; model integration is optional future work.

The local simulation has replay tests, but those tests do not establish replay protection for the live x402 integration.

See the [delivery roadmap](docs/roadmap.md) for planned work and acceptance criteria.

## Contributing

Contributions to code, documentation, exercises, and practical service examples are welcome.

Keep changes focused, document their behavior, and include relevant tests.

Before committing:

```sh
npm run check
npm test
git diff --check
```

Use commit messages that describe the completed change:

```text
docs: add workshop exercises
feat: validate service manifests
test: reject payments above the session budget
```

When proposing a service example, explain the need it addresses, the resource it provides, and how another builder can run it.

## About Dunia Hub

Dunia Hub creates practical learning experiences around AI, blockchain, and open-source development.

Stellar 402 Live brings these areas together through a shared builder experience: identify a need, create a useful service, and demonstrate how an agent can discover and pay for it.

[Visit Dunia Hub](https://duniahub.xyz)

## References

- [Stellar x402 Quickstart](https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide)
- [Stellar x402 Repository](https://github.com/stellar/x402-stellar)
- [Circle Testnet Faucet](https://faucet.circle.com)