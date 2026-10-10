# Stellar Testnet Payment Evidence

On **10 October 2026**, the repository completed several live x402 payment runs on Stellar testnet.

The runs progressively validated resource access, independent ledger verification, persistent budget accounting, and service discovery.

## Accounts and Asset

| Field | Value |
| --- | --- |
| Network | Stellar testnet |
| Asset | Testnet USDC |
| Payment amount | 0.01 USDC per run |
| Atomic amount | 100000 |
| Buyer | `GBB5B3NUMI2GGOIHYLAT557KDSOCKUOYB6AQMFNIUOHY3446VZIRP3YX` |
| Recipient | `GAL2YGM33MPWMFPUFCVFUY2CJ75SUSNPZ5XKN7STXQW3FJTPESWP7LD5` |
| USDC issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

## Account Preparation

Both accounts received testnet XLM through Stellar Friendbot and were configured with USDC trustlines.

The buyer received testnet USDC through Circle’s faucet. Its balance before the first successful payment was:

```text
Testnet USDC: 20.0000000
```

### Buyer Trustline Transaction

```text
17f2e5118cf962078979c2102644e1b7212849920e3ea8d866578187a58bfae4
```

### Recipient Trustline Transaction

```text
b9f789a2c5642d3f9675b2400c3bcbe3d5f85f84da20c7360d10b193d5a1241e
```

## Run 1: Payment and Resource Access

The client received HTTP 402, approved the payment terms, submitted one signed payment request, and received HTTP 200 with the protected resource.

### Settlement Transaction

```text
66bd9396d4949cbfb7fe9e35796301557b3d42358586b9ec32663173d234173d
```

### Observed Output

```text
Unpaid request: HTTP 402
USDC atomic units: 100000
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: 66bd9396d4949cbfb7fe9e35796301557b3d42358586b9ec32663173d234173d
Unlocked resource:
{"resource":"/resource","content":{"title":"Small-business planning checklist","items":["Identify the customer need","Estimate delivery costs","Set a spending budget"]}}
```

### Subsequent Independent Verification

The same transaction was later verified through testnet Horizon.

| Field | Verified Value |
| --- | --- |
| Ledger | `5119905` |
| Operation | `21989824533663745` |
| Buyer debit | `0.0100000 USDC` |
| Recipient credit | `0.0100000 USDC` |

The debit and credit belonged to the same operation.

## Run 2: Integrated Ledger Verification

The paying client completed another payment and independently verified settlement before displaying the resource.

### Settlement Transaction

```text
4771d91e7bcf695b8ccb7b2ac2d0ac24501b193b50da79ec04300851f558c88e
```

### Observed Output

```text
Paid request: HTTP 200
Settlement transaction: 4771d91e7bcf695b8ccb7b2ac2d0ac24501b193b50da79ec04300851f558c88e
Ledger verification passed: ledger 5120312
Unlocked resource:
{"resource":"/resource","content":{"title":"Small-business planning checklist","items":["Identify the customer need","Estimate delivery costs","Set a spending budget"]}}
```

## Run 3: Persistent Budget Integration

The client reserved funds before signing, completed payment, verified settlement, and marked the reservation settled.

### Settlement Transaction

```text
bcb52f81fcef28498b8359591b232730607e775c70b4c87272a7ae500a33a359
```

### Observed Output

```text
Budget reservation: 7aa86138-8bd6-498b-b5ea-abb5f78a64e9
Remaining budget atomic units: 9900000
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: bcb52f81fcef28498b8359591b232730607e775c70b4c87272a7ae500a33a359
Ledger verification passed: ledger 5120391
Budget reservation settled.
```

A separate budget status command confirmed:

```json
{
  "version": 1,
  "limitAtomic": "10000000",
  "payments": [
    {
      "id": "7aa86138-8bd6-498b-b5ea-abb5f78a64e9",
      "amountAtomic": "100000",
      "status": "settled",
      "hash": "bcb52f81fcef28498b8359591b232730607e775c70b4c87272a7ae500a33a359"
    }
  ],
  "remainingAtomic": "9900000"
}
```

The budget began tracking with this run. Earlier payments were not imported into its records.

## Reconciliation Command Check

After the budgeted payment had settled, the reconciliation command reported:

```text
No pending payments to reconcile.
Remaining budget atomic units: 9900000
```

This confirmed the command handled an already settled budget without changing its remaining allocation.

It did not demonstrate live recovery of an interrupted payment.

## Run 4: Discovery with Budgeted Payment

The client discovered the advertised resource, validated payment terms, reserved budget, completed payment, and independently verified settlement.

### Settlement Transaction

```text
f6cf32d8a905de846c78b520b60a9f3d41179d77847852fd1d4469b4b2aa2018
```

### Observed Output

```text
Discovered resource: Small-business planning checklist
Unpaid request: HTTP 402
USDC atomic units: 100000
Budget reservation: f1b02818-93ea-42b0-bd54-0f2fcdffd09a
Remaining budget atomic units: 9800000
Submitting one signed payment request.
Paid request: HTTP 200
Settlement transaction: f6cf32d8a905de846c78b520b60a9f3d41179d77847852fd1d4469b4b2aa2018
Ledger verification passed: ledger 5120560
Budget reservation settled.
Unlocked resource:
{"resource":"/resource","content":{"title":"Small-business planning checklist","items":["Identify the customer need","Estimate delivery costs","Set a spending budget"]}}
```

The subsequent budget status showed both budgeted payments as settled, with:

```text
Remaining budget atomic units: 9800000
```

That represents **0.98 USDC remaining**.

## Verified Runs

| Run | Demonstrated Behavior | Ledger |
| --- | --- | --- |
| 1 | Payment and resource access; independently verified afterward | `5119905` |
| 2 | Payment with integrated independent verification | `5120312` |
| 3 | Persistent reservation and settled budget accounting | `5120391` |
| 4 | Discovery followed by budgeted, independently verified payment | `5120560` |

## Automated Validation Observed

The recorded test outputs showed:

- 22 passing tests after the initial payment-client implementation.
- 35 passing tests after independent settlement verification.
- 46 passing tests after the persistent budget module.

Subsequent changes added reconciliation, discovery, and client-configuration tests. Use `npm test` to obtain the current suite count.

The live payments documented here were manual integration runs, separate from routine CI.

## Evidence Boundaries

These runs establish successful behavior for the tested configurations.

They do not establish:

- Live signed-payload replay protection.
- Binding a previously settled transfer to a new resource request.
- Recovery of a live interrupted payment.
- Recovery of reservations without recorded hashes.
- Full multiprocess concurrency guarantees.
- A payment between independently operated builder projects.
- Completion of the workshop sequence in a fresh environment.

The testnet verifier checks transfer evidence through Horizon. The service’s payment verification and settlement still depend on its configured facilitator.

## Reproducing the Flow

Follow the [testnet payment guide](testnet-payments.md).

To inspect an existing 0.01 USDC payment using the configured accounts:

```sh
npm run verify:stellar -- TRANSACTION_HASH
```

Replace `TRANSACTION_HASH` with a recorded settlement hash.

Verification does not submit another payment.

## Preserving Evidence

Testnet history may become unavailable after a network reset.

This document preserves transaction identifiers, ledger references, and observed output. Repository revision identifiers were not captured in these run records; future demonstrations should record the tested commit alongside their results.

See the [delivery roadmap](roadmap.md) for remaining validation work.