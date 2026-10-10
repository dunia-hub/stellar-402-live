# Finale: Demonstrate the Agent Marketplace

## Goal

Bring participant projects together and demonstrate how an agent discovers a useful service, authorizes a payment, and receives a resource after verified settlement.

The finale should explain the practical value of each project alongside its payment flow.

## What to Prepare

Each project should include:

- A clearly identified user need.
- A useful digital resource.
- A runnable service.
- A public service manifest.
- A payment client with explicit permissions.
- Tests for successful behavior and rejection paths.
- Setup instructions.
- Testnet payment evidence.

Use synthetic or openly licensed demonstration data.

## 1. Explain the Practical Need

Begin with three short statements:

1. Who is the intended user?
2. What problem does the service address?
3. What does the resource help them do?

Example:

> Small-business owners need a simple starting point for planning a new service. Our resource provides a structured checklist. An agent can purchase and retrieve it when helping someone prepare a business plan.

Describe only what the project actually implements.

## 2. Show the Service Manifest

Display the manifest endpoint:

```text
/.well-known/stellar-402.json
```

Explain:

- The service name.
- The advertised resource.
- Its identifier.
- Its request path.
- The intended network.

For the repository’s local example:

```sh
curl -fsS http://127.0.0.1:3001/.well-known/stellar-402.json
```

For another service, use its actual origin.

Discovery describes available resources. Payment permissions remain in the client’s configuration and policy.

## 3. Show the Unpaid Request

For the local example:

```sh
curl -i http://127.0.0.1:3001/resource
```

Show the HTTP `402 Payment Required` response.

Explain that the client must evaluate the payment requirements before signing.

## 4. Explain the Payment Permissions

Before running the paying client, identify:

| Control | Repository Default |
| --- | --- |
| Network | Stellar testnet |
| Asset | Approved testnet USDC |
| Recipient | Explicitly configured public key |
| Per-payment ceiling | 0.01 USDC |
| Persistent total budget | 1 USDC per buyer |

If your project changes these defaults, explain and test the resulting behavior.

Inspect the current budget:

```sh
npm run budget:status
```

Confirm sufficient funds remain for the demonstration.

## 5. Complete the Payment Flow

With the service running:

```sh
npm run pay:stellar
```

This authorizes a new payment.

Show:

1. The discovered resource.
2. HTTP 402.
3. Payment-policy approval.
4. The budget reservation.
5. The submitted payment request.
6. HTTP 200.
7. The settlement transaction hash.
8. Independent ledger verification.
9. The settled budget reservation.
10. The unlocked resource.

Avoid exposing `.env` or secret keys while presenting.

## 6. Show the Persisted Budget

```sh
npm run budget:status
```

Explain that completed payments and pending payments both count against the total budget.

Restarting the client does not reset recorded spending.

## 7. Demonstrate a Refusal

Include at least one refusal that happens before payment.

Suitable demonstrations include:

- A payment amount above the ceiling.
- An unapproved recipient.
- An unsupported asset or network.
- A missing resource identifier.
- An exhausted temporary budget.

Use the local exercises in Session 3 or Session 4 to demonstrate refusal without spending funds.

Do not remove policy checks to make the presentation succeed.

## 8. Connect Builder Projects

For the marketplace demonstration, use a client from one project to discover and purchase a resource from another independently operated project.

Agree on:

- The service origin.
- The resource identifier.
- The approved recipient public key.
- The supported payment asset and network.
- The demonstration time.

Do not exchange secret keys.

If projects run on separate computers, the service must be reachable through an appropriate deployment. The repository’s default service listens only on loopback.

Label demonstrations accurately:

| Setup | What It Demonstrates |
| --- | --- |
| One client and one local service | The core payment-enabled resource flow |
| One client and two local service instances | Configurable targeting across instances |
| One project’s client and another builder’s service | Cross-builder integration |

## Project Submission Checklist

Include:

- [ ] Project name and short description.
- [ ] Intended user and practical need.
- [ ] Source repository.
- [ ] Setup and run instructions.
- [ ] Service manifest location.
- [ ] Supported resource identifiers.
- [ ] Payment configuration instructions.
- [ ] Tests and their results.
- [ ] Testnet settlement transaction hash.
- [ ] Independent verification output.
- [ ] Demonstration video or recording, if available.
- [ ] Known limitations and remaining work.

Public submission materials must not include secret keys, private configuration files, or sensitive participant data.

## Rehearsal Checklist

Before the finale:

- [ ] Install and run the project from a fresh checkout.
- [ ] Confirm account funding and USDC trustlines.
- [ ] Confirm sufficient buyer USDC.
- [ ] Confirm sufficient remaining application budget.
- [ ] Start the service and inspect its manifest.
- [ ] Confirm the selected resource identifier.
- [ ] Confirm recipient approval.
- [ ] Complete a testnet payment.
- [ ] Independently verify settlement.
- [ ] Rehearse one refusal.
- [ ] Check presentation windows for exposed credentials.
- [ ] Prepare a recorded fallback.

Each successful payment rehearsal spends testnet USDC and reduces the tracked budget.

## Handling Problems During the Demo

### Discovery fails

Check the configured origin, service availability, manifest, and resource identifier.

Do not proceed to payment until discovery succeeds.

### The policy refuses payment

Explain the refusal and inspect the terms.

A correct refusal is useful evidence that the payment boundary is working.

### Submission times out

Do not immediately run the paying client again.

Check available settlement evidence and budget records. A timeout does not prove that payment failed.

### Ledger verification fails

A settlement may already have occurred.

If its hash was recorded, use:

```sh
npm run budget:reconcile
```

Unresolved reservations remain allocated.

### Connectivity prevents a live demonstration

Use the recorded fallback and identify it as recorded.

Explain which steps were previously verified and which could not be demonstrated live.

## Evidence to Preserve

Record:

- The date of the demonstration.
- The tested repository revision.
- The service and client configuration, excluding secrets.
- The payment amount and asset.
- The settlement transaction hash.
- Independent ledger verification output.
- The returned resource.
- Test results.

Testnet history may become unavailable after a network reset. Preserve the observed output alongside transaction identifiers.

## Completion Criteria

A completed demonstration shows:

- A practical need.
- A discoverable resource.
- Explicit payment authorization.
- A successful testnet payment.
- Independent transfer verification.
- Access to the protected resource.
- Persistent budget accounting.
- At least one refused request.

The marketplace showcase should also include a clearly identified cross-builder integration.

## Closing Discussion

Discuss:

- What made the service useful?
- Which payment terms did the client check?
- How did the budget constrain repeated requests?
- What happened when a request was refused?
- Which failures could be recovered automatically?
- What remains necessary before supporting real funds?

Keep conclusions tied to demonstrated behavior. A successful testnet flow is a foundation for further development, not evidence of production readiness.