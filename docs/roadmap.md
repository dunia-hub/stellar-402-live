# Delivery Roadmap

The foundation supports a local HTTP 402 simulation and a working Stellar testnet x402 payment flow. The next stages strengthen payment handling, connect services across builders, and prepare the workshop materials.

## Completed Foundation

- [x] Repository overview and five session guides.
- [x] Local HTTP 402 service and deterministic client.
- [x] Simulated receipt expiry and replay rejection.
- [x] GitHub Actions for syntax checks, tests, and the local demo.
- [x] Stellar x402 testnet service.
- [x] Testnet wallet creation and XLM funding.
- [x] USDC trustline setup for buyer and recipient.
- [x] Client validation of scheme, network, asset, recipient, and amount.
- [x] Successful manual 0.01 USDC payment that unlocked a protected resource.
- [x] Testnet setup guide and recorded payment evidence.

The automated suite currently contains 22 passing tests. The live testnet payment was validated through a separate manual integration run.

## 1. Strengthen Live Payment Verification

Confirm the behavior of the complete payment flow beyond the successful demonstration.

### Tasks

- [ ] Independently reconcile settlement evidence against ledger data.
- [ ] Check transaction success and the expected asset, recipient, and amount.
- [ ] Test reused signed payment payloads against the live integration.
- [ ] Test facilitator rejection and settlement failure paths.
- [ ] Define how the client handles uncertain payment outcomes.
- [ ] Add an integration test harness using controlled facilitator responses.
- [ ] Keep live payments outside routine CI.

### Acceptance Criteria

- Settlement evidence is checked against independent ledger data.
- Invalid payment evidence cannot be reported as a successful payment.
- Replay behavior is tested and documented.
- A timeout does not trigger an automatic second payment.
- Automated tests cover rejection and failure paths without spending funds.

## 2. Add Session Spending Budgets

Extend the current per-payment ceiling into a budget shared across requests.

### Tasks

- [ ] Define an explicit session budget.
- [ ] Reserve budget before authorizing a payment.
- [ ] Count pending payments against the available budget.
- [ ] Prevent concurrent requests from exceeding the budget.
- [ ] Persist budget state across client restarts.
- [ ] Reconcile uncertain outcomes before releasing reserved funds.
- [ ] Test budget exhaustion, concurrent requests, and restart recovery.

### Acceptance Criteria

- Authorized payments cannot exceed the configured session budget.
- Concurrent requests cannot allocate the same available funds.
- Restarting the client does not reset recorded spending.
- Uncertain payments remain reserved until their outcome is established.
- Payment permissions remain outside model control.

## 3. Connect Services Through Discovery

Allow agents to find and use services built by other participants.

### Tasks

- [ ] Define a service manifest schema.
- [ ] Describe resource identifiers, endpoints, and supported payment methods.
- [ ] Validate manifests and permitted endpoint URLs.
- [ ] Add a discovery client.
- [ ] Check current payment requirements before authorizing payment.
- [ ] Connect two independently run builder projects.
- [ ] Test malformed manifests, unavailable services, and changed payment terms.

### Acceptance Criteria

- Another builder can publish a compatible service manifest.
- An agent can discover and request that builder’s resource.
- Discovery cannot expand the agent’s payment permissions.
- Unapproved endpoints and payment terms are rejected.
- A cross-project demonstration completes a verified testnet payment.

## 4. Prepare Workshop Materials

Turn the working foundation into exercises participants can complete.

### Tasks

- [ ] Expand each session guide with setup instructions and exercises.
- [ ] Add solutions and expected outputs.
- [ ] Add facilitator notes and troubleshooting guidance.
- [ ] Map exercises to the tested repository examples.
- [ ] Provide an optional free or local model integration.
- [ ] Keep the deterministic client available for all core exercises.
- [ ] Rehearse the program with fresh participant environments.

### Acceptance Criteria

- Each workshop has a clear starting point and deliverable.
- Commands and examples work from a fresh checkout.
- Participants can complete the payment flow without a paid model API.
- Exercises demonstrate both successful payments and policy refusals.
- Facilitators can diagnose common setup and connection problems.

## 5. Prepare the Marketplace Finale

Bring independently built projects together into a shared demonstration.

### Tasks

- [ ] Publish a project submission checklist.
- [ ] Publish a demonstration sequence and evidence requirements.
- [ ] Rehearse an agent using another builder’s service.
- [ ] Prepare recorded fallbacks for connectivity problems.
- [ ] Collect participant repositories and testnet transaction evidence.
- [ ] Document the resulting marketplace examples.

### Acceptance Criteria

- Each project explains the practical need it addresses.
- Demonstrations show discovery, payment authorization, settlement, and resource access.
- At least one demonstration connects independently built projects.
- Each demonstration includes a refused payment or rejected request.
- Shared materials contain no private keys or sensitive participant data.

## Delivery Principles

- Use Stellar testnet throughout the program.
- Keep core exercises runnable with free tooling.
- Label simulated payments explicitly.
- Add meaningful tests alongside implementation changes.
- Keep commits focused and pull requests reviewable.
- Update documentation when behavior changes.
- Record verified outcomes separately from planned capabilities.