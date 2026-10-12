import { createBudget } from "../src/stellar/budget.js";

process.once("message", ({ path, context }) => {
  try {
    const budget = createBudget({
      path,
      limitAtomic: "200000",
    });

    const id = budget.reserve("100000", context);

    process.send({ status: "reserved", id }, () => {
      process.disconnect();
    });
  } catch (error) {
    process.send({
      status: "refused",
      reason: error.message,
    }, () => {
      process.disconnect();
    });
  }
});

process.send({ status: "ready" });
