# Live Replay Observation

## Test

On 12 October 2026, the client completed a normal payment against the local service on port 3002, then resent the same signed payload once.

## Results

| Step | Observed result |
| --- | --- |
| Normal payment | HTTP 200 |
| Independent verification | Ledger 5155395 |
| Replay | HTTP 402 |
| Replay contingency | Pending |
| Available application budget | 0.94 USDC |

Normal settlement transaction:

`85bc47e94432802f61f03745006a17632da7993e8ae0661b920a5ef4a1610920`

Replay contingency reservation:

`916b7a52-b539-4cbd-802a-3c4e8ec90ee0`

## Ledger Inspection

A subsequent query returned 11 buyer account effects.

The latest observed USDC debit was 0.01 USDC at
2026-10-12T10:22:42Z, under operation 22142252922990593.

The operation lookup confirmed:

- Transaction hash matched the normal settlement.
- Transaction was successful.
- Operation type was `invoke_host_function`.

No later USDC debit appeared in the inspected response.

## Interpretation

The replay refused resource access. The inspected ledger records showed
the normal payment and no second USDC debit.

This is a bounded observation, not a general replay-protection guarantee.
The replay response body was not retained, so its exact rejection reason
was not captured.

## Budget Treatment

The 0.01 USDC contingency remains reserved.

The inspected results are not used to automatically release funds.
Resolving uncertain reservations requires an explicit recovery procedure
with sufficient payment identity and finality evidence.