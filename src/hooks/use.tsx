import { AnyLike, GetPromiseType } from "ts-utils-helper";

export const use = <
  T extends PromiseLike<AnyLike> & {
    status?: "pending" | "fulfilled" | "rejected";
    value?: AnyLike;
    reason?: unknown;
  },
  TValue = GetPromiseType<T>,
>(
  promise: T,
): TValue => {
  if (promise.status === "pending") {
    throw promise;
  } else if (promise.status === "fulfilled") {
    return promise.value as TValue;
  } else if (promise.status === "rejected") {
    throw promise.reason;
  } else {
    promise.status = "pending";
    promise.then(
      (v) => {
        promise.status = "fulfilled";
        promise.value = v;
      },
      (e) => {
        promise.status = "rejected";
        promise.reason = e;
      },
    );
  }
  throw promise;
};
