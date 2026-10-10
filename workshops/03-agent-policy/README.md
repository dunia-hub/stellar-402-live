# Session 3: Build an agent with a spending policy

## Goal

Allow an agent to request and pay for services within explicit permissions.

## What participants will build

An agent client that evaluates payment challenges and explains whether it
will authorize or refuse a payment.

## Topics

- Separating model suggestions from spending authority
- Approved destinations, networks, and assets
- Per-payment limits and total session budgets
- Handling expired or malformed challenges
- Tracking pending payments and retries

## Exercise

1. Start with a deterministic client.
2. Configure an approved recipient and a spending ceiling.
3. Validate a service's payment challenge.
4. Authorize a payment that satisfies the policy.
5. Refuse a payment that exceeds the limit.
6. Add a total session budget.
7. Optionally connect a free or local model for service selection.

A model may suggest a service. The policy layer decides whether payment is
authorized.

## Deliverable

An agent that completes an allowed payment and refuses a prohibited one.

## Completion checks

- Invalid terms are rejected before a transaction is submitted.
- The client checks the recipient, network, asset, amount, and expiry.
- Repeated requests cannot bypass the total budget.
- An uncertain submission is reconciled before another payment is attempted.
- Refusal reasons are understandable.
