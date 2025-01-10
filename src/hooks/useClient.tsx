import { Draft, produce } from "immer";
import { useCallback, useMemo, useState } from "react";
import { createHash } from "store-provider-helper";
import type { AnyLike, FunctionLike } from "ts-utils-helper";

type UseClientOutputType<T, TArgs extends AnyLike[]> = {
  error?: unknown;
  isLoaded: boolean;
  data?: T;
  payload: TArgs;
  trigger: (...args: TArgs) => void;
};

type ClientCache = {
  cachePromise: Promise<AnyLike>;
  date: Date; // 缓存时间
  cacheResponse: AnyLike; // 缓存数据
};

const clientHashMap = new Map<string, ClientCache>();

export const useClient = <
  TClient extends FunctionLike,
  TReturn = ReturnType<TClient>,
  TValue = TReturn extends Promise<infer TValue> ? TValue : TReturn,
>(
  client: TClient,
  ...payload: Parameters<TClient>
): UseClientOutputType<TValue, Parameters<TClient>> => {
  const clientKey = `${createHash(client.toString())}|${createHash(payload)}`;
  const trigger = useCallback(
    (...payload: Parameters<TClient>) => {
      return Promise.resolve(Reflect.apply(client, client, payload))
        .then((data) => {
          clientHashMap.set(clientKey, {
            cachePromise: Promise.resolve(null),
            date: new Date(),
            cacheResponse: data,
          });
          setOutPut((state) =>
            produce(state, (draft) => {
              draft.error = undefined;
              draft.isLoaded = true;
              draft.data = data as Draft<TValue>;
              draft.payload = payload as Draft<Parameters<TClient>>;
            }),
          );
          return data;
        })
        .catch((error) => {
          clientHashMap.set(clientKey, {
            cachePromise: Promise.resolve(null),
            date: new Date(),
            cacheResponse: error,
          });
          setOutPut((state) =>
            produce(state, (draft) => {
              draft.error = error;
              draft.isLoaded = true;
              draft.data = undefined as Draft<TValue>;
              draft.payload = payload as Draft<Parameters<TClient>>;
            }),
          );
        });
    },
    [client, clientKey],
  );
  const [outPut, setOutPut] = useState<
    UseClientOutputType<TValue, Parameters<TClient>>
  >({
    isLoaded: false,
    data: undefined as TValue,
    payload: payload,
    trigger,
  });

  if (!clientHashMap.has(clientKey)) {
    const promise = trigger(...outPut.payload);
    clientHashMap.set(clientKey, {
      cachePromise: promise,
      date: new Date(),
      cacheResponse: undefined,
    });
  }

  return useMemo(() => {
    const cache = clientHashMap.get(clientKey);
    if (cache && cache.cacheResponse) {
      return {
        isLoaded: true,
        data: outPut?.data ?? cache.cacheResponse,
        payload: outPut.payload,
        error: outPut?.error,
        trigger,
      };
    } else {
      throw Promise.resolve(null);
    }
  }, [clientKey, outPut, trigger]);
};
