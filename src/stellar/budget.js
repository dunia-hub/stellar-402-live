import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { validatePaymentContext } from "./payment-context.js";

function amount(value) {
  if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value)) {
    throw new Error("Invalid budget amount");
  }
  return BigInt(value);
}

export function createBudget({
  path,
  limitAtomic = "10000000",
}) {
  const limit = amount(limitAtomic);

  if (limit <= 0n) throw new Error("Budget limit must be positive");

  function validate(state) {
    if (
      state.version !== 2 ||
      state.limitAtomic !== limitAtomic ||
      !Array.isArray(state.payments)
    ) {
      throw new Error("Invalid budget state or changed budget limit");
    }

    const ids = new Set();

    for (const payment of state.payments) {
      if (
        typeof payment.id !== "string" ||
        ids.has(payment.id) ||
        !["pending", "settled"].includes(payment.status) ||
        amount(payment.amountAtomic) <= 0n ||
        (payment.hash !== null &&
          !/^[a-f0-9]{64}$/.test(payment.hash)) ||
        (payment.status === "settled" && payment.hash === null)
      ) {
        throw new Error("Invalid payment record");
      }

      if (payment.context !== null) {
        validatePaymentContext(payment.context);
      }

      ids.add(payment.id);
    }

    const allocated = state.payments.reduce(
      (total, payment) => total + amount(payment.amountAtomic),
      0n,
    );

    if (allocated > limit) {
      throw new Error("Budget state exceeds its limit");
    }

    return allocated;
  }

  function update(change) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });

    const lockPath = `${path}.lock`;
    let lock;

    try {
      lock = openSync(lockPath, "wx", 0o600);
    } catch (error) {
      if (error.code === "EEXIST") {
        throw new Error("Budget is locked; payment was not authorized");
      }
      throw error;
    }

    const temporary = `${path}.${randomUUID()}.tmp`;

    try {
      const state = existsSync(path)
        ? JSON.parse(readFileSync(path, "utf8"))
        : { version: 2, limitAtomic, payments: [] };

      if (state.version === 1) {
        if (
          state.limitAtomic !== limitAtomic ||
          !Array.isArray(state.payments)
        ) {
          throw new Error("Invalid legacy budget state");
        }

        state.payments = state.payments.map((payment) => ({
          ...payment,
          context: null,
        }));

        state.version = 2;
      }

      validate(state);
      const result = change(state);
      validate(state);

      const descriptor = openSync(temporary, "wx", 0o600);

      try {
        writeFileSync(descriptor, `${JSON.stringify(state, null, 2)}\n`);
        fsyncSync(descriptor);
      } finally {
        closeSync(descriptor);
      }

      renameSync(temporary, path);

      const directory = openSync(dirname(path), "r");

      try {
        fsyncSync(directory);
      } finally {
        closeSync(directory);
      }

      return result;
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
      closeSync(lock);
      unlinkSync(lockPath);
    }
  }

  return {
    reserve(amountAtomic, context) {
      const approvedContext = validatePaymentContext(context);
      const requested = amount(amountAtomic);

      if (requested <= 0n) {
        throw new Error("Reservation must be positive");
      }

      return update((state) => {
        const allocated = validate(state);

        if (allocated + requested > limit) {
          throw new Error("Payment exceeds remaining total budget");
        }

        const id = randomUUID();

        state.payments.push({
          id,
          amountAtomic,
          status: "pending",
          hash: null,
          context: approvedContext,
        });

        return id;
      });
    },

    recordSettlement(id, hash) {
      if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) {
        throw new Error("Invalid settlement hash");
      }

      return update((state) => {
        const payment = state.payments.find((entry) => entry.id === id);

        if (!payment || payment.status !== "pending") {
          throw new Error("Pending reservation not found");
        }

        if (
          (payment.hash !== null && payment.hash !== hash) ||
          state.payments.some(
            (entry) => entry.id !== id && entry.hash === hash,
          )
        ) {
          throw new Error("Settlement hash conflicts with budget records");
        }

        payment.hash = hash;
      });
    },

    settle(id) {
      return update((state) => {
        const payment = state.payments.find((entry) => entry.id === id);

        if (!payment || payment.hash === null) {
          throw new Error("Recorded settlement not found");
        }

        payment.status = "settled";
      });
    },

    snapshot() {
      return update((state) => {
        const allocated = validate(state);

        return {
          ...structuredClone(state),
          remainingAtomic: (limit - allocated).toString(),
        };
      });
    },
  };
}
