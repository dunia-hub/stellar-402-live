# Stellar 402 Live

**Build AI agents that discover services, pay on Stellar, and unlock access.**

Stellar 402 Live is a five-day hybrid builder program by [Dunia Hub](https://duniahub.xyz), bringing together four online workshops and an in-person finale. Participants build AI agents and payment-enabled digital services, then connect their projects into a live marketplace on Stellar testnet.

The program starts with a practical question: **what happens when an agent can request a service and pay for it too?**

## What we are building

A small marketplace where services built by different participants can be discovered and used by AI agents.

A service might provide a fraud check, a design template, an educational resource, or information that helps a small business make a decision. When an agent requests a paid resource, the service responds with an HTTP `402 Payment Required` challenge. The agent evaluates the payment terms, authorizes a Stellar testnet payment within its spending policy, and submits payment evidence. The service independently verifies the payment before releasing the resource.

Participants are encouraged to begin with a clearly identified need. Possible areas include:

- Small-business tools
- Cross-border payment information
- Agriculture and market information
- Fraud detection
- Local-language services
- Education
- Digital creator tools

## How the payment flow works

1. **Request:** An agent requests a resource from a digital service.
2. **Challenge:** The service returns HTTP `402 Payment Required` with its payment terms.
3. **Authorize:** The agent checks the destination, asset, amount, network, and spending limits.
4. **Pay:** The client submits a payment on Stellar testnet.
5. **Verify:** The service checks the transaction against the requested resource and payment terms.
6. **Unlock:** Once verification succeeds, the service releases the resource.

Service discovery helps agents find available resources. It does not grant permission to spend funds.

HTTP 402 provides the response status. This repository will document the payment challenge format, receipt submission, and verification rules used by the program.

## Program structure

| Session | Focus | Builder outcome |
| --- | --- | --- |
| 01 · Digital services and HTTP 402 | Define a practical need, build a service, and return a payment challenge | A resource with clear payment terms |
| 02 · Stellar testnet payments | Submit a payment and independently verify transaction evidence | A service that unlocks access after a verified testnet payment |
| 03 · Agents and spending policies | Build an agent client with explicit payment permissions and limits | An agent that can accept or refuse a payment request |
| 04 · Service discovery | Publish service information and connect projects across builders | An agent that discovers and uses another participant’s service |
| 05 · In-person finale | Bring the projects together and demonstrate the complete flow | A working marketplace showcase with testnet payment evidence |

## Learning outcomes

By the end of the program, participants should be able to:

- Build a digital service around a practical use case.
- Explain how HTTP 402 fits into a payment-enabled request flow.
- Submit and verify payments on Stellar testnet.
- Apply spending limits before an agent authorizes a payment.
- Reject invalid, mismatched, expired, or reused payment evidence.
- Publish service information that other builders can discover.
- Demonstrate an agent using a service created by another participant.

## Repository structure

```text
stellar-402-live/
├── .github/
│   └── workflows/             # Automated checks
├── docs/                      # Architecture, decisions, and roadmap
├── src/                       # Services, payment adapters, and agent clients
├── test/                      # Unit and integration tests
├── workshops/
│   ├── 01-service/
│   ├── 02-stellar-payments/
│   ├── 03-agent-policy/
│   ├── 04-discovery/
│   └── 05-finale/
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Workshop guides, exercises, and runnable examples will be added as the implementation progresses.

## Getting started

### Requirements

- Node.js 24 or later
- npm
- Git

The examples will use free tooling and Stellar testnet. Paid model APIs will not be required. Agent exercises will include a deterministic client so participants can complete the payment flow without a model provider.

### Set up the project

```sh
git clone https://github.com/dunia-hub/stellar-402-live.git
cd stellar-402-live
npm ci
```

### Run tests

```sh
npm test
```

The repository is currently at the scaffold stage. The test command is configured; implementation tests will be added with the corresponding code.

## Development status

The foundation is being developed in stages:

- **Repository setup:** Project structure and program overview.
- **Local payment flow:** A runnable HTTP 402 service and client using clearly labelled simulated receipts.
- **Stellar integration:** Real testnet payments and independent transaction verification.
- **Agent policy:** Payment validation, approved destinations, and spending budgets.
- **Discovery:** Service manifests and connections between independently built projects.
- **Workshop materials:** Exercises, facilitator notes, troubleshooting guides, and finale preparation.

Simulated examples will be identified explicitly. Live testnet support will be documented with reproducible instructions and transaction evidence once implemented.

## Payment safety

Payment authorization and payment verification are separate responsibilities.

The client must validate payment terms and enforce its spending policy before submitting a transaction. Model output alone must never authorize spending.

The service must independently verify that payment evidence matches the expected network, destination, asset, amount, and resource. It must also prevent payment evidence from being reused to unlock additional requests.

Throughout the program:

- Use testnet funds only.
- Keep private keys out of source code, commits, screenshots, and logs.
- Keep local credentials in ignored environment files.
- Reject payment requests that exceed configured limits.
- Test refused payments and verification failures alongside successful access.
- Clearly distinguish simulated receipts from onchain transactions.

## Contributing

Contributions to code, documentation, exercises, and practical service examples are welcome.

Keep changes focused, document their behavior, and include relevant tests. Use clear commit messages that describe the completed change, such as:

```text
docs: define workshop learning outcomes
feat: return payment challenges for protected resources
test: reject reused payment receipts
```

Before committing, run the available checks:

```sh
npm test
git diff --check
```

When proposing a service example, explain the need it addresses, the resource it provides, and how another builder can run it.

## About Dunia Hub

Dunia Hub creates practical learning experiences around AI, blockchain, and open-source development.

Stellar 402 Live brings these areas together through a shared builder experience: identify a need, create a useful service, and demonstrate how an agent can discover and pay for it.

[Visit Dunia Hub](https://duniahub.xyz)