export function createManifest() {
  return {
    version: 1,
    name: "Stellar 402 Live",
    description: "Payment-enabled builder service on Stellar testnet",
    network: "stellar:testnet",
    resources: [
      {
        id: "business-checklist",
        name: "Small-business planning checklist",
        description: "A short checklist for planning a useful service",
        path: "/resource",
      },
    ],
  };
}

export function validateManifest(manifest, origin, resourceId) {
  const base = new URL(origin);

  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.pathname !== "/" ||
    base.search ||
    base.hash
  ) {
    throw new Error("Invalid configured service origin");
  }

  if (
    manifest?.version !== 1 ||
    manifest.network !== "stellar:testnet" ||
    typeof manifest.name !== "string" ||
    manifest.name.length === 0 ||
    manifest.name.length > 120 ||
    !Array.isArray(manifest.resources) ||
    manifest.resources.length === 0 ||
    manifest.resources.length > 32
  ) {
    throw new Error("Invalid service manifest");
  }

  const ids = new Set();

  for (const resource of manifest.resources) {
    if (
      !resource ||
      typeof resource.id !== "string" ||
      !/^[a-z0-9-]{1,64}$/.test(resource.id) ||
      ids.has(resource.id) ||
      typeof resource.name !== "string" ||
      resource.name.length === 0 ||
      resource.name.length > 120 ||
      typeof resource.description !== "string" ||
      resource.description.length > 500 ||
      typeof resource.path !== "string" ||
      resource.path.length > 200 ||
      !/^\/[A-Za-z0-9/_-]+$/.test(resource.path) ||
      resource.path.includes("//")
    ) {
      throw new Error("Invalid manifest resource");
    }

    const url = new URL(resource.path, base);

    if (url.origin !== base.origin || url.pathname !== resource.path) {
      throw new Error("Resource must remain within the configured origin");
    }

    ids.add(resource.id);
  }

  const selected = manifest.resources.find(
    (resource) => resource.id === resourceId,
  );

  if (!selected) {
    throw new Error("Requested resource is not advertised");
  }

  return {
    id: selected.id,
    name: selected.name,
    url: new URL(selected.path, base).href,
  };
}

export async function discoverResource(
  origin,
  resourceId,
  { fetchImpl = fetch } = {},
) {
  // Validate the configured origin before making a request.
  validateManifest(createManifest(), origin, "business-checklist");

  const response = await fetchImpl(
    new URL("/.well-known/stellar-402.json", origin).href,
    {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Discovery failed: HTTP ${response.status}`);
  }

  const text = await response.text();

  if (Buffer.byteLength(text, "utf8") > 64 * 1024) {
    throw new Error("Service manifest is too large");
  }

  return validateManifest(JSON.parse(text), origin, resourceId);
}
