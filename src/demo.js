import { once } from "node:events";
import { createService } from "./service.js";
import { validateChallenge } from "./policy.js";

const service = createService();
service.server.listen(0, "127.0.0.1");
await once(service.server, "listening");

const { port } = service.server.address();
const url = `http://127.0.0.1:${port}/resource`;

try {
  const initial = await fetch(url);

  if (initial.status !== 402) {
    throw new Error(`Expected HTTP 402, received ${initial.status}`);
  }

  const { challenge } = await initial.json();
  console.log("1. Service returned HTTP 402.");

  const policy = {
    network: "stellar:testnet",
    asset: "native:XLM",
    recipient: "local-demo-recipient",
    maxPaymentStroops: "1000000",
  };

  const amount = validateChallenge(challenge, policy);

  if (challenge.resource !== "/resource") {
    throw new Error("Challenge does not match requested resource");
  }

  console.log(`2. Policy approved ${amount} stroops.`);
  const receipt = service.simulatePayment(challenge.id);
  console.log("3. Created a simulated receipt. No onchain payment.");

  const paid = await fetch(url, {
    headers: { "Payment-Receipt": receipt },
  });

  if (paid.status !== 200) {
    throw new Error(`Access failed with HTTP ${paid.status}`);
  }

  console.log("4. Resource unlocked:");
  console.log(JSON.stringify(await paid.json(), null, 2));

  const replay = await fetch(url, {
    headers: { "Payment-Receipt": receipt },
  });

  if (replay.status !== 403) {
    throw new Error("Receipt replay was not rejected");
  }

  console.log("5. Reused receipt rejected.");
} finally {
  await new Promise((resolve, reject) => {
    service.server.close((error) => error ? reject(error) : resolve());
    service.server.closeIdleConnections();
  });
}
