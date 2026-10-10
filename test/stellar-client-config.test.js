import test from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@stellar/stellar-sdk";
import { readClientConfig } from "../src/stellar/client-config.js";

const recipient = Keypair.random().publicKey();

function config(changes = {}) {
  return readClientConfig({
    STELLAR_RECIPIENT: recipient,
    ...changes,
  });
}

test("client defaults to the local service and checklist", () => {
  const result = config();

  assert.equal(result.serviceOrigin, "http://127.0.0.1:3001");
  assert.equal(result.resourceId, "business-checklist");
});

test("default service origin follows the configured local port", () => {
  assert.equal(
    config({ STELLAR_PORT: "3002" }).serviceOrigin,
    "http://127.0.0.1:3002",
  );
});

test("client accepts an explicitly configured HTTPS service", () => {
  const result = config({
    STELLAR_SERVICE_ORIGIN: "https://builder.example",
    STELLAR_RESOURCE_ID: "market-report",
  });

  assert.equal(result.serviceOrigin, "https://builder.example");
  assert.equal(result.resourceId, "market-report");
  assert.equal(result.recipient, recipient);
  assert.ok(Object.isFrozen(result));
});

test("remote HTTP services are rejected", () => {
  assert.throws(
    () => config({
      STELLAR_SERVICE_ORIGIN: "http://builder.example",
    }),
    /must use HTTPS/,
  );
});

test("local HTTP services remain available for development", () => {
  for (const origin of [
    "http://127.0.0.1:3002",
    "http://localhost:3002",
    "http://[::1]:3002",
  ]) {
    assert.equal(config({
      STELLAR_SERVICE_ORIGIN: origin,
    }).serviceOrigin, origin);
  }
});

test("credentials, paths, queries, and fragments are rejected", () => {
  for (const origin of [
    "https://user:password@builder.example",
    "https://builder.example/resource",
    "https://builder.example/?query=value",
    "https://builder.example/#fragment",
    "file:///tmp/",
  ]) {
    assert.throws(
      () => config({ STELLAR_SERVICE_ORIGIN: origin }),
    );
  }
});

test("invalid configured resource identifiers are rejected", () => {
  for (const resourceId of ["", "../resource", "Market Report", "a".repeat(65)]) {
    assert.throws(
      () => config({ STELLAR_RESOURCE_ID: resourceId }),
      /resource identifier/,
    );
  }
});
