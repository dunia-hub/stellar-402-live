# Session 2: Pay and verify on Stellar testnet

## Goal

Connect the protected service to real Stellar testnet payments.

## What participants will build

A payment client and a verifier that checks transaction evidence before
unlocking a resource.

## Topics

- Participant-owned testnet accounts
- Funding a testnet account
- Representing XLM amounts without floating-point arithmetic
- Constructing and submitting a payment
- Independently verifying a transaction
- Binding payment evidence to a resource request

## Exercise

1. Create and fund a testnet account.
2. Request a payment challenge from the service.
3. Validate the payment terms.
4. Submit the required testnet payment.
5. Retry the resource request with payment evidence.
6. Verify the transaction on the service before returning the resource.

Wallet setup and adapter commands will be added with the tested Stellar
integration.

## Deliverable

A resource unlocked by an independently verified Stellar testnet payment.

## Completion checks

- The transaction succeeded on the expected network.
- The destination, asset, and amount match the payment terms.
- The payment is bound to the intended challenge.
- Reusing payment evidence does not unlock another request.
- Private keys remain outside source code and logs.
