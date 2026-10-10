# Delivery roadmap

## 1. Repository foundation

- Project overview and development setup
- Five session guides
- Delivery roadmap

## 2. Local HTTP 402 flow

Build a dependency-free service and deterministic client.

Acceptance criteria:

- An unpaid request receives a structured payment challenge.
- The client validates payment terms before accepting them.
- A valid simulated receipt unlocks the intended resource.
- Invalid, expired, mismatched, and reused receipts are rejected.
- The demo clearly identifies simulated payments.
- Automated tests and CI run successfully.

## 3. Stellar testnet integration

Replace simulated payment handling with a tested Stellar adapter.

Acceptance criteria:

- The client submits an actual testnet payment.
- The service independently verifies transaction evidence.
- Verification checks success, destination, asset, amount, and challenge binding.
- Payment evidence cannot be reused across requests.
- Transaction consumption is atomic and persists across service restarts.
- Setup instructions work with a fresh participant account.
- A reproducible demo includes testnet transaction evidence.

Choose the payment binding and verification approach in a documented
architecture decision before implementing the adapter.

## 4. Agent spending policy

Add approved destinations and explicit spending budgets.

Acceptance criteria:

- Per-payment limits and total session budgets are enforced.
- Pending payments count against the available budget.
- Retries reconcile uncertain transactions before spending again.
- Model output cannot override payment permissions.
- Tests cover allowed payments and refused payments.

## 5. Service discovery

Connect independently built services through a shared manifest.

Acceptance criteria:

- Manifests follow a documented schema.
- Discovery data is validated before use.
- Current payment terms are checked before authorization.
- Two builders can run a complete cross-project payment flow.

## 6. Workshop readiness

Expand the session guides into tested teaching materials.

Acceptance criteria:

- Each session includes setup, exercises, expected results, and troubleshooting.
- Examples run with free tooling.
- Participants can complete the core flow without a paid model API.
- The complete program is rehearsed using fresh environments.
- Finale instructions cover live demonstrations and recorded fallbacks.
