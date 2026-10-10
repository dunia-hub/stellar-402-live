# Session 4: Discover and connect services

## Goal

Connect agents to services built by other participants.

## What participants will build

A service manifest and a discovery client that can find and evaluate
available resources.

## Topics

- Describing services through a shared manifest
- Resource identifiers, endpoints, and payment terms
- Validating untrusted discovery data
- Selecting services within an existing spending policy
- Handling unavailable services and changing prices

## Exercise

1. Publish a manifest describing your service.
2. Validate another builder's manifest.
3. Select a resource relevant to your agent's task.
4. Request the resource and inspect its current payment challenge.
5. Apply your spending policy.
6. Complete a testnet payment and retrieve the resource.

A manifest describes a service. The current payment challenge supplies the
terms that must be validated before payment.

## Deliverable

An agent that discovers and uses another participant's service.

## Completion checks

- The manifest follows the documented schema.
- Malformed entries and unsupported endpoints are rejected.
- Discovery does not modify the agent's payment permissions.
- Current payment terms are checked before spending.
- The integration works between independently run projects.
