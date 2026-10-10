# Session 4: Discover and Connect Services

## Goal

Discover a service through its public manifest and request a resource while preserving explicit payment permissions.

Begin with a second local service. Then use the same configuration approach to connect to another builder’s HTTPS service when one is available.

## What You Will Build

A client configuration that:

- Targets an explicitly chosen service origin.
- Selects an advertised resource by its identifier.
- Rejects invalid manifests and unsafe resource paths.
- Validates current payment terms before signing.
- Uses the buyer’s existing persistent budget.

## Requirements

- Sessions 2 and 3 completed
- A funded testnet buyer
- The repository installed locally
- A second terminal
- A second service checkout for the local exercise

Run payment commands from your original repository so they use your existing buyer credentials and budget.

## 1. Inspect the Service Manifest

With the original service running:

```sh
curl -fsS http://127.0.0.1:3001/.well-known/stellar-402.json
```

The manifest describes:

- Its version.
- The service name.
- The intended network.
- Available resource identifiers.
- Resource names and descriptions.
- Resource paths.

The current advertised resource is:

```json
{
  "id": "business-checklist",
  "name": "Small-business planning checklist",
  "description": "A short checklist for planning a useful service",
  "path": "/resource"
}
```

The identifier selects a resource. The path tells the client where to request it within the configured origin.

## 2. Inspect Discovery Validation

Open:

```sh
code src/stellar/discovery.js src/stellar/client-config.js
```

The implementation rejects:

- Unsupported manifest versions.
- Unsupported networks.
- Duplicate resource identifiers.
- Invalid resource paths.
- Resource URLs outside the configured origin.
- Redirects during manifest retrieval.
- Remote service origins using HTTP.
- Configured origins containing credentials, paths, queries, or fragments.

Local loopback origins may use HTTP for development. Remote origins require HTTPS.

Run the relevant tests:

```sh
node --test test/stellar-discovery.test.js test/stellar-client-config.test.js
```

## 3. Start a Second Local Service

Create a separate checkout in another terminal:

```sh
cd ~
git clone https://github.com/dunia-hub/stellar-402-live.git stellar-402-peer
cd stellar-402-peer
npm ci
code .env
```

Add the following configuration to the peer checkout’s `.env`:

```dotenv
STELLAR_RECIPIENT=YOUR_APPROVED_RECIPIENT_PUBLIC_KEY
STELLAR_PORT=3002
```

Replace the placeholder with the recipient public key from your original setup.

Do not copy secret keys into the peer checkout. Running the service requires only the public recipient address.

Confirm that the file is ignored:

```sh
git check-ignore .env
```

Start the second service:

```sh
npm run start:stellar
```

It should listen on:

```text
http://127.0.0.1:3002
```

This exercise uses a second service instance with the same approved recipient. It demonstrates configurable targeting; it is not an independent-builder payment demonstration.

## 4. Inspect the Second Service

From your original checkout:

```sh
curl -fsS http://127.0.0.1:3002/.well-known/stellar-402.json
```

Confirm that the manifest advertises `business-checklist`.

Discover the resource without paying:

```sh
node --input-type=module <<'EOF'
import { discoverResource } from "./src/stellar/discovery.js";

const resource = await discoverResource(
  "http://127.0.0.1:3002",
  "business-checklist",
);

console.log(resource);
EOF
```

Expected output includes:

```text
url: 'http://127.0.0.1:3002/resource'
```

No payment is made by this command.

## 5. Pay the Second Service

From your original checkout:

```sh
STELLAR_SERVICE_ORIGIN=http://127.0.0.1:3002 \
STELLAR_RESOURCE_ID=business-checklist \
npm run pay:stellar
```

This authorizes another payment of **0.01 testnet USDC**.

The environment values override the target for this invocation. Your existing buyer credentials, approved recipient, and budget remain in use.

Expected sequence:

1. Discover the resource on port 3002.
2. Receive HTTP 402.
3. Approve the payment terms.
4. Reserve funds.
5. Submit the signed payment request.
6. Receive HTTP 200.
7. Verify settlement through Horizon.
8. Mark the reservation settled.
9. Display the resource.

Inspect the shared budget:

```sh
npm run budget:status
```

The new payment must appear alongside previous budgeted payments.

## 6. Demonstrate a Missing Resource

Run:

```sh
node --input-type=module <<'EOF'
import { discoverResource } from "./src/stellar/discovery.js";

try {
  await discoverResource(
    "http://127.0.0.1:3002",
    "missing-resource",
  );
  throw new Error("Expected discovery to refuse the missing resource");
} catch (error) {
  if (!error.message.includes("not advertised")) throw error;
  console.log("Discovery refused:", error.message);
}
EOF
```

Expected output:

```text
Discovery refused: Requested resource is not advertised
```

This command does not sign or submit a payment.

## 7. Connect to Another Builder

For an independent-builder demonstration, obtain:

- Their HTTPS service origin.
- Their advertised resource identifier.
- Their recipient public key, confirmed separately from the manifest.
- Confirmation that the service uses the supported Stellar testnet USDC flow.

Update your local `.env`:

```dotenv
STELLAR_SERVICE_ORIGIN=https://builder.example
STELLAR_RESOURCE_ID=their-resource-id
STELLAR_RECIPIENT=THE_BUILDERS_VALID_RECIPIENT_PUBLIC_KEY
```

These are placeholders, not a deployed service.

Preserve your buyer secret key. Do not request or copy the other builder’s recipient secret key.

Inspect their manifest before paying, then run:

```sh
npm run pay:stellar
```

The recipient remains an explicit local approval. The client does not adopt payment permissions from discovery data.

A remote demonstration requires the other builder to deploy a reachable HTTPS service. The repository’s default server binds to loopback for local development.

## 8. Distinguish Discovery from Authorization

| Question | Responsible Component |
| --- | --- |
| Which resources are advertised? | Service manifest |
| Which origin may the client contact? | Client configuration |
| Which resource should it request? | Configured resource identifier |
| Is the recipient approved? | Payment policy |
| Is the amount within the per-payment ceiling? | Payment policy |
| Is enough total budget available? | Persistent budget |
| Did the expected transfer settle? | Independent ledger verifier |

A manifest is descriptive data. It cannot increase spending limits or approve a new recipient.

The client checks the current payment challenge before signing, even after accepting the manifest.

## Deliverable

Submit:

- The service origin and selected resource identifier.
- The validated manifest.
- A successful payment-enabled request to the second service.
- Budget status showing the recorded payment.
- A missing-resource refusal.
- A clear statement of whether the demonstration used two local instances or independently operated builder projects.

## Completion Checklist

- [ ] The target origin is explicitly configured.
- [ ] The selected resource is advertised.
- [ ] Resource paths remain within the configured origin.
- [ ] The recipient is approved separately.
- [ ] Payment terms are checked before signing.
- [ ] The existing buyer budget is used across targets.
- [ ] The settlement is independently verified.
- [ ] Missing resources are rejected before payment.

## Current Boundaries

Discovery currently targets one configured service at a time. It is not a marketplace registry, crawler, or automatic service-ranking system.

The local exercise establishes targeting across service instances. An independent-builder demonstration remains a separate validation step.

## What Comes Next

The finale brings builder projects together and demonstrates practical need, discovery, payment authorization, settlement verification, and resource access.