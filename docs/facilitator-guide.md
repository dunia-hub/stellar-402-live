# Workshop Facilitator Guide

Use this guide alongside the four online workshop exercises and the finale guide.

The suggested pacing assumes 90-minute online sessions. Adjust it after rehearsal and participant feedback.

## Before the Series

### Confirm the Teaching Revision

Choose a repository revision for the workshops and record it:

```sh
git rev-parse HEAD
```

Rehearse that revision before sharing participant instructions. Avoid introducing untested dependency or protocol changes during a live session.

### Validate the Repository

```sh
npm ci
npm audit
npm run check
npm test
npm run demo
```

Review audit findings rather than applying forced dependency updates during a workshop.

### Prepare the Live Environment

- Confirm testnet account funding.
- Confirm USDC trustlines.
- Confirm buyer USDC funding.
- Start the target service.
- Run preflight.
- Inspect the remaining application budget.
- Check for unresolved reservations.
- Prepare a recorded payment demonstration.

Use testnet accounts that hold no real funds.

### Share Participant Preparation

Ask participants to install:

- Node.js 24 or later.
- Git.
- A code editor.

Share the repository and explain that:

- Core exercises require no paid model API.
- Session 1 requires no wallet.
- Later sessions require internet access and testnet funds.
- Public keys may be shared.
- Secret keys and `.env` contents must remain private.

## Session 1: Digital Services and HTTP 402

Guide: [Session 1](../workshops/01-service/README.md)

### Suggested Pacing

| Time | Activity |
| --- | --- |
| 0–10 minutes | Introduce the practical need and intended resource |
| 10–25 minutes | Install dependencies and run the local demo |
| 25–40 minutes | Inspect HTTP 402 and challenge fields |
| 40–65 minutes | Adapt the protected resource |
| 65–80 minutes | Demonstrate policy refusal and receipt reuse rejection |
| 80–90 minutes | Review deliverables and questions |

### Checkpoints

Before participants continue, confirm:

- The local service starts.
- An unpaid request receives HTTP 402.
- The protected content is absent from that response.
- The demo unlocks the resource.
- A reused simulated receipt is rejected.

### Teaching Emphasis

HTTP 402 signals a payment requirement. It does not independently define a payment protocol.

The introductory simulation and live x402 integration use different mechanisms. Label the simulation throughout the session.

### Common Problems

| Problem | Response |
| --- | --- |
| Unsupported Node version | Check `node --version` |
| Port already in use | Select another local port |
| Demo confused with manually started service | Explain that the demo starts its own temporary service |
| Resource edit breaks an assertion | Review the intended output and update only the relevant resource assertion |

### End-of-Session Deliverable

A useful resource, an example payment challenge, and one demonstrated refusal.

## Session 2: Stellar Testnet Payments

Guide: [Session 2](../workshops/02-stellar-payments/README.md)

### Suggested Pacing

| Time | Activity |
| --- | --- |
| 0–10 minutes | Explain buyer, recipient, trustline, and facilitator roles |
| 10–35 minutes | Create accounts, fund XLM, and establish trustlines |
| 35–50 minutes | Fund buyer USDC and run preflight |
| 50–70 minutes | Complete one live payment |
| 70–85 minutes | Independently verify settlement and inspect the budget |
| 85–90 minutes | Record evidence and questions |

Account and faucet setup may take longer. Provide preparation instructions before the session where possible.

### Checkpoints

Before paying, confirm:

- Both accounts exist on testnet.
- Both have the required USDC trustline.
- The buyer has USDC.
- The configured recipient is correct.
- Preflight passes.
- The application budget has sufficient capacity.

After paying, confirm:

- HTTP 200 was received.
- A settlement hash was reported.
- Independent ledger verification passed.
- The reservation is settled.
- The resource was returned.

### Teaching Emphasis

Friendbot supplies testnet XLM. Circle’s faucet supplies the USDC used by this example.

A successful HTTP response and independent transfer verification are separate observations.

Each successful paying-client run purchases access again.

### Common Problems

| Problem | Response |
| --- | --- |
| Wallet creation refuses to overwrite `.env` | Preserve and inspect the existing configuration |
| Buyer has XLM but no USDC | Complete the Circle faucet step |
| Connection request times out | Diagnose connectivity without changing payment permissions |
| Verification fails after HTTP 200 | Inspect recorded settlement evidence and reconcile before paying again |

### End-of-Session Deliverable

A successful payment hash, independent verification output, and persisted budget record.

## Session 3: Payment Policies and Budgets

Guide: [Session 3](../workshops/03-agent-policy/README.md)

### Suggested Pacing

| Time | Activity |
| --- | --- |
| 0–15 minutes | Explain payment authority and spending boundaries |
| 15–35 minutes | Inspect and run policy rejection tests |
| 35–55 minutes | Demonstrate temporary budget exhaustion |
| 55–75 minutes | Inspect reservations and reconciliation |
| 75–90 minutes | Discuss uncertain outcomes and review deliverables |

### Checkpoints

Confirm that participants can explain:

- The difference between a per-payment ceiling and total budget.
- Why pending funds remain allocated.
- Why settled spending is not restored to the budget.
- Why restarting the client does not reset spending.
- Why model output cannot grant payment permission.

### Recovery Demonstration

For an account with a settled context-bearing payment:

```sh
npm run rehearse:recovery
```

This reconstructs a pending reservation in a temporary budget and verifies the existing transaction.

It does not submit another payment or modify the real budget.

Describe it as a reconstructed-state rehearsal, not a live process-termination test.

### Common Problems

| Problem | Response |
| --- | --- |
| Budget refuses another reservation | Inspect pending and settled allocations |
| Pending reservation has no hash | Explain that recovery cannot infer its outcome |
| Legacy pending record lacks context | Preserve the reservation; do not invent a recipient |
| Lock blocks budget access | Stop overlapping activity and investigate before removing any lock |

### End-of-Session Deliverable

A policy refusal, temporary budget exhaustion demonstration, and explanation of recovery boundaries.

## Session 4: Service Discovery

Guide: [Session 4](../workshops/04-discovery/README.md)

### Suggested Pacing

| Time | Activity |
| --- | --- |
| 0–15 minutes | Inspect the manifest and discovery validation |
| 15–35 minutes | Start and inspect a second local service |
| 35–55 minutes | Configure its origin and run preflight |
| 55–75 minutes | Complete the second-service payment |
| 75–90 minutes | Demonstrate missing-resource refusal and plan builder pairings |

### Checkpoints

Confirm:

- The service origin is explicitly configured.
- The resource is advertised.
- The recipient is approved separately.
- Discovery cannot redirect payment authority.
- The buyer’s budget is shared across targets.
- The payment receives independent verification.

### Teaching Emphasis

Two local service instances demonstrate configurable targeting.

A cross-builder demonstration requires independently operated projects and a reachable service. Do not describe the local rehearsal as that result.

### Common Problems

| Problem | Response |
| --- | --- |
| Manifest endpoint returns 404 | Restart the correct service revision |
| Resource identifier is missing | Compare configuration with the manifest |
| Remote HTTP origin is rejected | Use HTTPS for remote services |
| Payment recipient differs | Confirm the intended recipient separately before approving it |

### End-of-Session Deliverable

A validated manifest, second-service result, and plan for an independent-builder integration.

## Finale Preparation

Guide: [Finale](../workshops/05-finale/README.md)

Before the event:

- Collect project repositories.
- Confirm intended users and practical needs.
- Review service manifests and configuration instructions.
- Rehearse cross-builder connections.
- Confirm funding and remaining budgets.
- Collect transaction evidence.
- Prepare recorded fallbacks.
- Review presentation windows for exposed credentials.

A demonstration should show the need, discovery, payment authorization, settlement, independent verification, resource access, and one refusal.

## Handling Interrupted Payments

If submission or verification fails:

1. Stop automatic retries.
2. Inspect service output and budget status.
3. Identify any recorded settlement hash.
4. Verify or reconcile the recorded transaction.
5. Preserve unresolved reservations.

Do not equate HTTP failure with absence of settlement.

The replay probe is an optional investigation tool. It is not required for participant setup and may leave a contingency reservation unresolved.

## Facilitator Evidence

Record:

- Teaching revision.
- Environment versions.
- Test results.
- Setup problems and resolutions.
- Completed exercises.
- Manual payment evidence.
- Participant feedback.
- Remaining limitations.

Do not collect participant secret keys.

## Follow-Up

After each session:

- Correct instructions that caused confusion.
- Record reproduced problems.
- Preserve useful participant examples.
- Confirm changes through the repository’s checks.
- Keep documentation aligned with demonstrated behavior.

The complete teaching sequence still requires rehearsal with participant environments beyond the original development machine.