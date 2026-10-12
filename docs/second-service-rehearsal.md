# Second-Service Rehearsal

## Result

On 12 October 2026, the payment client successfully targeted a second local service instance at `http://127.0.0.1:3002`.

The run completed discovery, payment authorization, budget reservation, settlement, independent ledger verification, and resource access.

## Commands

Start the second service:

```sh
STELLAR_PORT=3002 npm run start:stellar
```

Inspect its manifest:

```sh
curl -fsS http://127.0.0.1:3002/.well-known/stellar-402.json
```

Target its resource:

```sh
STELLAR_SERVICE_ORIGIN=http://127.0.0.1:3002 \
STELLAR_RESOURCE_ID=business-checklist \
npm run pay:stellar
```

## Evidence

| Field | Value |
| --- | --- |
| Resource | `business-checklist` |
| Amount | 0.01 testnet USDC |
| Unpaid response | HTTP 402 |
| Paid response | HTTP 200 |
| Verified ledger | `5155274` |
| Reservation | `fcd5e292-3208-4caa-a9a6-1f44e2c3b9d4` |
| Reservation status | `settled` |
| Remaining shared budget | 0.96 USDC |

Settlement transaction:

```text
fda2ea3fe3b0833a41cdb6912dc9a0721ac28b6977d4a2b83cae2bbb04f60b42
```

The persisted reservation included the buyer, recipient, network, and USDC asset contract.

## Scope

Both service instances used the same checkout and recipient. This validates configurable targeting and shared budget accounting across local service origins.

It does not establish integration between independently operated builder projects.