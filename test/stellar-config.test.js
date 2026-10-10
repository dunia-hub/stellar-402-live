import test from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@stellar/stellar-sdk";
import { readConfig } from "../src/stellar/config.js";

const recipient = Keypair.random().publicKey();

test("Stellar configuration uses testnet and the configured recipient", () => {
  const config = readConfig({ STELLAR_RECIPIENT: recipient });

  assert.equal(config.recipient, recipient);
  assert.equal(config.network, "stellar:testnet");
  assert.equal(config.price, "$0.01");
  assert.equal(config.port, 3001);
  assert.ok(Object.isFrozen(config));
});

test("Stellar configuration rejects a missing recipient", () => {
  assert.throws(() => readConfig({}), /public key/);
});

test("Stellar configuration rejects an invalid public key", () => {
  assert.throws(
    () => readConfig({ STELLAR_RECIPIENT: "local-demo-recipient" }),
    /public key/,
  );
});

test("Stellar configuration rejects a secret key as recipient", () => {
  assert.throws(
    () => readConfig({
      STELLAR_RECIPIENT: Keypair.random().secret(),
    }),
    /public key/,
  );
});

test("Stellar configuration rejects invalid ports", () => {
  for (const port of ["0", "-1", "65536", "1.5", "invalid", ""]) {
    assert.throws(
      () => readConfig({
        STELLAR_RECIPIENT: recipient,
        STELLAR_PORT: port,
      }),
      /STELLAR_PORT/,
    );
  }
});

test("environment values cannot switch the service to mainnet", () => {
  const config = readConfig({
    STELLAR_RECIPIENT: recipient,
    STELLAR_NETWORK: "stellar:pubnet",
  });

  assert.equal(config.network, "stellar:testnet");
});
