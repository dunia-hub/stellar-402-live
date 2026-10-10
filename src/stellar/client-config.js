import { readConfig } from "./config.js";

export function readClientConfig(env = process.env) {
  const config = readConfig(env);

  const origin = new URL(
    env.STELLAR_SERVICE_ORIGIN ??
    `http://127.0.0.1:${config.port}`,
  );

  const loopback = [
    "127.0.0.1",
    "localhost",
    "[::1]",
  ].includes(origin.hostname);

  if (
    !["http:", "https:"].includes(origin.protocol) ||
    (origin.protocol === "http:" && !loopback) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error(
      "Service origin must use HTTPS, or HTTP for local development",
    );
  }

  const resourceId =
    env.STELLAR_RESOURCE_ID ?? "business-checklist";

  if (
    typeof resourceId !== "string" ||
    !/^[a-z0-9-]{1,64}$/.test(resourceId)
  ) {
    throw new Error("Invalid configured resource identifier");
  }

  return Object.freeze({
    ...config,
    serviceOrigin: origin.origin,
    resourceId,
  });
}
