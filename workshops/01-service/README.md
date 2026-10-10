# Session 1: Build a payment-enabled service

## Goal

Build a useful digital service and introduce payment terms through HTTP 402.

## What participants will build

A service with a public description and a protected resource. Requests without
verified payment receive a `402 Payment Required` response.

## Topics

- Choosing a practical problem and defining a useful resource
- HTTP requests, responses, and status codes
- Describing payment terms
- Separating payment verification from resource access

## Exercise

1. Choose a resource your service will provide.
2. Describe who needs it and why.
3. Create an endpoint that serves the resource.
4. Protect the endpoint with a payment challenge.
5. Inspect the challenge using a command-line client.

Start with a small, deterministic resource. Examples include a sample market
report, a downloadable template, or a check against a synthetic fraud dataset.

## Deliverable

A runnable service with documented payment terms and an HTTP 402 response.

## Completion checks

- The service starts using documented commands.
- The protected resource is not returned before payment verification.
- The challenge identifies the resource, network, asset, amount, and recipient.
- Any simulated payment behavior is clearly labelled.
