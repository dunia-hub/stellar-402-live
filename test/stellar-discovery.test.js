import test from "node:test";
import assert from "node:assert/strict";
import {
  createManifest,
  discoverResource,
  validateManifest,
} from "../src/stellar/discovery.js";

const origin = "http://127.0.0.1:3001";
const resourceId = "business-checklist";

test("valid manifest resolves the advertised resource", () => {
  const resource = validateManifest(
    createManifest(),
    origin,
    resourceId,
  );

  assert.equal(resource.url, `${origin}/resource`);
  assert.equal(resource.id, resourceId);
});

test("unsupported manifest versions and networks are rejected", () => {
  for (const change of [
    { version: 2 },
    { network: "stellar:pubnet" },
  ]) {
    assert.throws(
      () => validateManifest(
        { ...createManifest(), ...change },
        origin,
        resourceId,
      ),
      /Invalid service manifest/,
    );
  }
});

test("duplicate resource identifiers are rejected", () => {
  const manifest = createManifest();
  manifest.resources.push({ ...manifest.resources[0] });

  assert.throws(
    () => validateManifest(manifest, origin, resourceId),
    /Invalid manifest resource/,
  );
});

test("external URLs and ambiguous paths are rejected", () => {
  for (const path of [
    "https://other.example/resource",
    "//other.example/resource",
    "/../resource",
    "/%2e%2e/resource",
    "/resource?recipient=other",
    "/resource#fragment",
  ]) {
    const manifest = createManifest();
    manifest.resources[0].path = path;

    assert.throws(
      () => validateManifest(manifest, origin, resourceId),
    );
  }
});

test("missing resources are rejected", () => {
  assert.throws(
    () => validateManifest(createManifest(), origin, "missing"),
    /not advertised/,
  );
});

test("invalid configured origins are rejected", () => {
  for (const invalid of [
    "file:///tmp/",
    "http://user:password@127.0.0.1:3001",
    `${origin}/other`,
    `${origin}/?query=value`,
  ]) {
    assert.throws(
      () => validateManifest(createManifest(), invalid, resourceId),
      /Invalid configured service origin/,
    );
  }
});

test("discovery uses the configured manifest endpoint without redirects", async () => {
  const resource = await discoverResource(origin, resourceId, {
    fetchImpl: async (url, options) => {
      assert.equal(url, `${origin}/.well-known/stellar-402.json`);
      assert.equal(options.redirect, "error");

      return {
        ok: true,
        text: async () => JSON.stringify(createManifest()),
      };
    },
  });

  assert.equal(resource.url, `${origin}/resource`);
});

test("failed discovery does not return a resource", async () => {
  await assert.rejects(
    discoverResource(origin, resourceId, {
      fetchImpl: async () => ({ ok: false, status: 503 }),
    }),
    /Discovery failed: HTTP 503/,
  );
});

test("oversized manifests are rejected", async () => {
  await assert.rejects(
    discoverResource(origin, resourceId, {
      fetchImpl: async () => ({
        ok: true,
        text: async () => " ".repeat(65537),
      }),
    }),
    /too large/,
  );
});
