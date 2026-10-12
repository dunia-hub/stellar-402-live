# Fresh-Checkout Rehearsal

## Result

On 12 October 2026, a separate checkout completed account setup, payment preflight, and a live Stellar testnet payment using newly created accounts.

The client discovered the resource, validated payment terms, reserved budget, received HTTP 200 after payment, and independently verified settlement.

## Environment

| Field | Value |
| --- | --- |
| Node.js | `24.19.0` |
| npm | `11.17.0` |
| Service origin | `http://127.0.0.1:3003` |
| Resource | `business-checklist` |
| Live payment revision | `f2ed36d110f705af5f9726dc8f8cbec708b55354` |

The initial checkout at `ee97cb676d389314232cabdc728d1ce07fb6a91f` passed all 86 tests, syntax checks, and the local simulation.

Installation exposed a vulnerable nested Axios dependency. The rehearsal checkout was subsequently updated to include the merged dependency override before account setup and live payment.

## Dependency Verification

At the live payment revision:

- The direct Stellar SDK used Axios 1.20.0.
- The Stellar SDK nested under `@x402/stellar` used Axios 1.20.0.
- `npm audit` reported zero vulnerabilities.
- `git status --short` showed no tracked or untracked changes.

An audit result reflects the advisory data available when the command ran.

## Fresh Accounts

| Role | Public Key |
| --- | --- |
| Buyer | `GCMWOO7GF37AQCJVI2RF5ET4JY2NSRVAHE6CK7I27GYRBQFGCGOCXUVX` |
| Recipient | `GCYZICXXR64D6SZ2P7QSFJC2CAFLVAXLVYJJNQB7KV5CSLCODFVRRXIH` |

Both accounts received testnet XLM and USDC trustlines. The buyer received 20 testnet USDC through Circle’s faucet.

Buyer trustline transaction:

```text
a86f4d42b31655649347059dbf8545ad210d682f01c33fb75ffd1e9decbf6dfc
```

Recipient trustline transaction:

```text
0deb9786557b0dda89d2f9bdb79241205842babb1e2365fa36b14e7cac53da53
```

## Preflight

Command:

```sh
STELLAR_PORT=3003 npm run preflight
```

Preflight passed with:

- 20 USDC available to the buyer.
- A fresh 1 USDC application budget.
- No pending reservations.
- The expected resource and recipient.

No payment was submitted during preflight.

## Live Payment

Command:

```sh
STELLAR_PORT=3003 npm run pay:stellar
```

| Field | Observed Value |
| --- | --- |
| Payment | 0.01 testnet USDC |
| Unpaid response | HTTP 402 |
| Paid response | HTTP 200 |
| Verified ledger | `5156223` |
| Reservation | `1761121c-061f-4fa0-aa8d-5bde3cf03c34` |
| Reservation status | `settled` |
| Remaining budget | 0.99 USDC |

Settlement transaction:

```text
3f29b305459d18009eb1afd1c6bd2d7da17f98260c394b7194641c6572ce6012
```

The returned resource was the small-business planning checklist.

## Persistent Budget

A separate budget status command confirmed:

- Budget version 2.
- One settled payment of 100000 atomic units.
- The verified settlement hash.
- The original buyer, recipient, network, and USDC asset contract.
- 9900000 atomic units remaining.

## Scope

This rehearsal validates setup and the core payment flow from a separate checkout with fresh accounts on the existing development machine.

It also demonstrates a successful live payment with the Axios override.

It does not establish:

- Completion of every workshop exercise.
- Compatibility with other operating systems or participant machines.
- Integration between independently operated builder projects.
- Production readiness.

No credentials or local budget files are included in this document.