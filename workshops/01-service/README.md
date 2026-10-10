# Session 1: Build a Payment-Enabled Service

## Goal

Understand how a service can protect a digital resource and return an HTTP `402 Payment Required` response.

Start with a practical need, inspect the repository’s local service, and adapt its resource into a useful example.

This session uses simulated payments. No wallet, testnet funds, or model provider is required.

## What You Will Build

A local service that:

- Describes a useful resource.
- Responds to an unpaid request with payment terms.
- Returns the resource after accepting a simulated receipt.
- Rejects reused receipts.

## Requirements

- Node.js 24 or later
- npm
- Git
- A terminal and code editor

## 1. Set Up the Repository

```sh
git clone https://github.com/dunia-hub/stellar-402-live.git
cd stellar-402-live
npm ci
```

If you already have the repository, use your existing checkout.

Check the implementation:

```sh
npm run check
npm test
```

Expected result: syntax checks complete successfully and the tests pass.

## 2. Choose a Practical Need

Write down:

1. Who will use your service?
2. What problem do they face?
3. What resource could help them?
4. What would a successful response contain?

Keep the first resource small and deterministic.

Examples include:

| Need | Possible Resource |
| --- | --- |
| A business owner needs a planning starting point | A planning checklist |
| A creator needs a reusable document | A downloadable template |
| A learner needs structured practice | An exercise with an answer guide |
| A buyer needs help interpreting market data | A report built from synthetic sample data |

Use synthetic or openly licensed material for the exercise.

## 3. Start the Local Service

In your first terminal:

```sh
npm start
```

Expected output:

```text
Local service: http://127.0.0.1:3000
Simulation mode. Run npm run demo for the complete flow.
```

The service listens locally. Keep this terminal running.

## 4. Check Service Health

In a second terminal:

```sh
curl -i http://127.0.0.1:3000/health
```

Expected response status:

```text
HTTP/1.1 200 OK
```

Expected JSON body:

```json
{
  "status": "ok",
  "mode": "simulation"
}
```

## 5. Request the Protected Resource

```sh
curl -i http://127.0.0.1:3000/resource
```

Expected response status:

```text
HTTP/1.1 402 Payment Required
```

The JSON body contains a challenge similar to:

```json
{
  "mode": "simulation",
  "challenge": {
    "version": 1,
    "id": "generated-challenge-id",
    "resource": "/resource",
    "network": "stellar:testnet",
    "asset": "native:XLM",
    "recipient": "local-demo-recipient",
    "amountStroops": "1000000",
    "expiresAt": 0
  }
}
```

The actual challenge contains a newly generated ID and a future expiry timestamp. The timestamp above is a placeholder.

Inspect the fields:

| Field | Meaning |
| --- | --- |
| `id` | Identifies this challenge |
| `resource` | Resource the challenge protects |
| `network` | Intended payment network |
| `asset` | Requested payment asset |
| `recipient` | Intended recipient |
| `amountStroops` | Amount represented as an integer string |
| `expiresAt` | Challenge deadline in milliseconds since the Unix epoch |

The response must not contain the protected checklist.

The simulated amount is 0.1 XLM. The recipient is a local placeholder, not a Stellar account.

## 6. Run the Complete Simulation

From the repository root:

```sh
npm run demo
```

The demo starts its own temporary service. It does not use the server you started with `npm start`.

Expected sequence:

```text
1. Service returned HTTP 402.
2. Policy approved 1000000 stroops.
3. Created a simulated receipt. No onchain payment.
4. Resource unlocked:
...
5. Reused receipt rejected.
```

The simulated payment function is available only inside the process. There is no public HTTP endpoint that mints receipts.

## 7. Inspect the Code

Open:

```sh
code src/service.js src/policy.js src/demo.js
```

Find the code responsible for:

- Returning HTTP 402.
- Creating and storing a challenge.
- Checking the payment terms.
- Creating a simulated receipt.
- Consuming the receipt.
- Returning the protected resource.
- Rejecting receipt reuse.

Discuss why the service should verify payment evidence rather than accept a client-provided success flag.

## 8. Adapt the Resource

In `src/service.js`, replace the checklist’s title and items with your chosen resource.

Keep the payment challenge and receipt checks intact.

For example:

```js
content: {
  title: "Digital creator launch checklist",
  items: [
    "Define the intended audience",
    "Prepare one useful sample",
    "Choose a delivery format",
  ],
},
```

Run:

```sh
npm run check
npm test
npm run demo
```

Confirm that the unlocked resource reflects your change.

If you change the number of checklist items, update the resource assertion in `test/payment-flow.test.js` to match the intended output. Preserve the payment rejection tests.

## 9. Demonstrate a Policy Refusal

In `src/demo.js`, temporarily lower:

```js
maxPaymentStroops: "1000000",
```

to:

```js
maxPaymentStroops: "999999",
```

Run:

```sh
npm run demo
```

Expected result: the client refuses the challenge with a spending-limit error before creating a simulated receipt.

Restore the original limit and rerun the demo.

## Deliverable

Submit:

- A short explanation of your service’s intended user and practical need.
- The adapted resource.
- Commands needed to run the service and demo.
- An example HTTP 402 response.
- Evidence that an allowed request succeeds and an over-limit request is refused.

## Completion Checklist

- [ ] The service starts using the documented command.
- [ ] An unpaid request receives HTTP 402.
- [ ] The challenge describes the payment terms.
- [ ] The unpaid response does not disclose the protected resource.
- [ ] The simulated receipt unlocks the resource.
- [ ] Reusing the receipt is rejected.
- [ ] The client refuses a payment above its ceiling.
- [ ] The example is clearly identified as a simulation.

## Troubleshooting

### Port 3000 is already in use

Choose another port:

```sh
PORT=3002 npm start
```

Use that port in your curl requests.

### The challenge has expired

Request `/resource` again to receive a new challenge.

### The demo cannot connect to the manually started service

The demo starts its own service on an automatically assigned port. You do not need to configure it to use port 3000.

## What Comes Next

Session 2 introduces real Stellar testnet payments using the x402 integration.

The live flow uses testnet USDC and a facilitator. Its protocol is separate from this introductory simulation.