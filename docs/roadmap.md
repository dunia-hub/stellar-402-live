# Delivery Roadmap

Stellar 402 Live now supports resource discovery, policy-controlled testnet payments, persistent spending budgets, independent ledger verification, and limited pending-payment recovery.

The next stages validate failure behavior, connect independent builder projects, and rehearse the workshop experience.

## Completed Foundation

- [x] Local HTTP 402 service and deterministic demo.
- [x] Simulated receipt expiry and replay rejection.
- [x] Stellar x402 service accepting testnet USDC.
- [x] Testnet wallet creation, XLM funding, and USDC trustline setup.
- [x] Payment validation for scheme, network, asset, recipient, and amount.
- [x] Successful manual testnet payments and protected resource access.
- [x] Independent settlement verification through testnet Horizon.
- [x] Persistent budget with reservations before signing.
- [x] Settlement records preserved across client runs.
- [x] Reconciliation for pending payments with recorded hashes.
- [x] Public service manifest and validated resource discovery.
- [x] Configurable service origins and resource identifiers.
- [x] Five workshop guides with exercises and expected results.
- [x] GitHub Actions for syntax checks, tests, and the local demo.

Completed implementation does not imply that every failure path or workshop exercise has been validated live.

## 1. Validate Live Payment Failure Behavior

### Tasks

- [ ] Test reused signed payment payloads against the live integration.
- [ ] Test facilitator rejection and settlement failures.
- [ ] Test delayed ledger availability after settlement.
- [ ] Test interruption before and after recording a settlement hash.
- [ ] Document the observed outcome of each failure case.
- [ ] Add controlled integration tests without spending funds in CI.

### Acceptance Criteria

- Replay behavior is demonstrated and documented.
- Failed resource access is distinguished from failed settlement.
- Uncertain outcomes do not trigger automatic duplicate payments.
- Pending reservations remain allocated until evidence establishes their outcome.
- Automated integration tests cover the client’s payment sequence and failure handling.

## 2. Strengthen Budget and Recovery Guarantees

### Tasks

- [ ] Bind reservations to immutable payment context, including network, asset, buyer, and recipient.
- [ ] Store sufficient payment identity before submission to support interruption recovery.
- [ ] Define recovery for reservations without a settlement hash.
- [ ] Add multiprocess tests for concurrent reservations.
- [ ] Test interruption during persistent-state updates.
- [ ] Document safe handling of leftover locks.
- [ ] Define an explicit budget lifecycle and renewal process.

### Acceptance Criteria

- Reconciliation uses the original reservation’s payment context.
- Changed client configuration cannot reinterpret a pending payment.
- Concurrent processes cannot allocate more than the configured budget.
- Corrupt or uncertain state blocks spending rather than resetting the budget.
- Budget renewal is explicit and preserves historical records.
- Missing transaction evidence is not treated as proof that funds were unspent.

## 3. Demonstrate Cross-Builder Integration

### Tasks

- [ ] Rehearse the second-local-service exercise.
- [ ] Deploy a builder service at a reachable HTTPS origin.
- [ ] Connect another builder’s client to that service.
- [ ] Confirm the recipient through a channel separate from discovery.
- [ ] Complete a payment and independent ledger verification.
- [ ] Record the participating projects, configuration, and transaction evidence.
- [ ] Demonstrate a refused request across the integration.

### Acceptance Criteria

- Independently operated projects complete the payment-enabled resource flow.
- Discovery remains within the configured origin.
- Payment permissions remain explicitly configured.
- The buyer’s budget is shared across service targets.
- Documentation distinguishes local instances from independent-builder demonstrations.

## 4. Rehearse the Workshops

### Tasks

- [ ] Run every guide from a fresh checkout.
- [ ] Verify commands and expected outputs.
- [ ] Test account setup with newly created testnet wallets.
- [ ] Confirm faucet and trustline instructions.
- [ ] Rehearse policy refusal and temporary budget exhaustion.
- [ ] Rehearse discovery and missing-resource refusal.
- [ ] Add facilitator notes based on observed difficulties.
- [ ] Prepare session quizzes and participant feedback prompts.

### Acceptance Criteria

- Participants can complete the core exercises with free tooling.
- No paid model API is required.
- Every session has a clear starting point and deliverable.
- Examples distinguish simulated receipts from live settlement.
- Troubleshooting instructions reflect reproduced problems.
- The complete sequence has been rehearsed in a fresh environment.

## 5. Add Optional Model-Assisted Service Selection

### Tasks

- [ ] Define a narrow role for a free or local model.
- [ ] Allow the model to suggest a resource from validated service information.
- [ ] Validate model output before using it.
- [ ] Keep origin, recipient, asset, network, and budgets outside model control.
- [ ] Preserve the deterministic client as the default fallback.
- [ ] Test attempts to override payment permissions.

### Acceptance Criteria

- Model output cannot expand spending authority.
- Invalid suggestions are rejected before signing.
- Participants can complete the program without a model.
- The implementation clearly separates service selection from payment authorization.

## 6. Prepare the Marketplace Finale

### Tasks

- [ ] Collect participant repositories and service manifests.
- [ ] Rehearse a cross-builder demonstration.
- [ ] Confirm account funding and remaining budgets.
- [ ] Collect settlement hashes and independent verification output.
- [ ] Prepare recorded fallbacks for connectivity problems.
- [ ] Review presentation materials for exposed credentials.
- [ ] Publish the project showcase and reproducible examples.

### Acceptance Criteria

- Each project explains the practical need it addresses.
- Demonstrations show discovery, authorization, settlement, and resource access.
- At least one demonstration connects independent builder projects.
- Demonstrations include a policy refusal or rejected request.
- Shared evidence contains no secret keys or sensitive participant data.

## Evidence and Documentation

Keep documentation aligned with implemented and verified behavior.

Record:

- The tested repository revision.
- Test results.
- Manual integration outcomes.
- Testnet transaction hashes and ledger identifiers.
- Known limitations.
- Exercises that still require rehearsal.

Testnet history may become unavailable after a network reset. Preserve observed output alongside transaction identifiers.

## Delivery Principles

- Use Stellar testnet throughout the program.
- Keep core exercises runnable with free tooling.
- Label simulations explicitly.
- Preserve explicit payment authority.
- Add meaningful tests alongside implementation changes.
- Keep commits focused and pull requests reviewable.
- Distinguish successful demonstrations from broader guarantees.
- Update documentation when behavior changes.