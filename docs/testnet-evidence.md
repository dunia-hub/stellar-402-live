# Stellar Testnet Payment Evidence

On **10 October 2026**, the payment client completed a live x402 payment flow on Stellar testnet and received the protected resource.

## Observed flow

1. The client requested `/resource` without payment.
2. The service returned HTTP `402 Payment Required`.
3. The client approved the network, asset, recipient, scheme, and amount.
4. The client submitted one signed payment request.
5. The service returned HTTP `200` with the protected resource.
6. The client received successful settlement evidence and a transaction hash.

## Payment details

| Field | Value |
| --- | --- |
| Network | Stellar testnet |
| Asset | Testnet USDC |
| Amount | 0.01 USDC |
| Atomic amount | 100000 |
| Buyer | `GBB5B3NUMI2GGOIHYLAT557KDSOCKUOYB6AQMFNIUOHY3446VZIRP3YX` |
| Recipient | `GAL2YGM33MPWMFPUFCVFUY2CJ75SUSNPZ5XKN7STXQW3FJTPESWP7LD5` |
| Settlement transaction | `66bd9396d4949cbfb7fe9e35796301557b3d42358586b9ec32663173d234173d` |

## Account preparation

Both accounts were funded with testnet XLM and configured with USDC trustlines.

The buyer’s USDC balance before the payment was:

```text
Testnet USDC: 20.0000000
```

### Buyer trustline transaction

```text
17f2e5118cf962078979c2102644e1b7212849920e3ea8d866578187a58bfae4
```

### Recipient trustline transaction

```text
b9f789a2c5642d3f9675b2400c3bcbe3d5f85f84da20c7360d10b193d5a1241e
```

## Payment client output

```text
Unpaid request: HTTP 402
Policy approved:
  Buyer: GBB5B3NUMI2GGOIHYLAT557KDSOCKUOYB6AQMFNIUOHY3446VZIRP3YX
  Recipient: GAL2YGM33MPWMFPUFCVFUY2CJ75SUSNPZ5XKN7STXQW3FJTPESWP7LD5
  USDC atomic units: 100000
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: 66bd9396d4949cbfb7fe9e35796301557b3d42358586b9ec32663173d234173d
Unlocked resource:
{"resource":"/resource","content":{"title":"Small-business planning checklist","items":["Identify the customer need","Estimate delivery costs","Set a spending budget"]}}
```

## Automated validation

At the time of the successful run:

- All 22 automated tests passed.
- JavaScript syntax checks passed.

The tests covered:

| Area | Coverage |
| --- | --- |
| Local simulation | Payment challenges, resource access, fabricated receipts, expiry, and replay rejection |
| Stellar configuration | Recipient validation, port validation, and enforced testnet configuration |
| Payment policy | Approved payments, amount limits, rejected terms, malformed amounts, and payment-option filtering |

The live payment was a manual integration run. It was not executed by the automated test suite.

## Evidence boundaries

The settlement transaction hash was obtained from the facilitator’s settlement response. The client required a successful settlement result on Stellar testnet before reporting success.

This run demonstrates that the configured client, service, and facilitator completed the payment-enabled resource flow.

It does not establish:

- Independent reconciliation against ledger data.
- Live signed-payload replay protection.
- Persistent session budget enforcement.
- Recovery from uncertain settlement outcomes.
- Behavior under concurrent payment requests.

These remain separate implementation and validation tasks.

Testnet transaction history may become unavailable after a network reset. This document preserves the identifiers and observed output from the run.

## Reproduce the flow

Follow the [testnet payment guide](testnet-payments.md) to create accounts, fund the buyer, and run the service and client.

See the [delivery roadmap](roadmap.md) for the remaining work.