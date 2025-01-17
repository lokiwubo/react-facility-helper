import { Draft, produce } from "immer";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { createHash, type AnyLike, type FunctionLike } from "ts-utils-helper";

type UseClientOutputType<T, TArgs extends AnyLike[]> = {
  error?: unknown;
  isLoaded: boolean;
  data?: T;
  payload: TArgs;
  trigger: (...args: TArgs) => void;
};

type ClientCache = {
  cachePromise: Promise<AnyLike>;
  timestamp: number; // 缓存时间  时间戳
  cacheResponse: AnyLike; // 缓存数据
};
type ClientOptions = {
  maxAge?: number; // 缓存最大有效时间
};
const clientHashMap = new Map<string, ClientCache>();

export const createUseClient = (options: ClientOptions) => {
  return <
    TClient extends FunctionLike,
    TReturn = ReturnType<TClient>,
    TValue = TReturn extends Promise<infer TValue> ? TValue : TReturn,
  >(
    client: TClient,
    ...payload: Parameters<TClient>
  ): UseClientOutputType<TValue, Parameters<TClient>> => {
    const [isMounted, setIsMounted] = useState(false);
    const [outPut, setOutPut] = useState<
      UseClientOutputType<TValue, Parameters<TClient>>
    >({
      isLoaded: false,
      data: undefined as TValue,
      payload: payload,
      get trigger() {
        return trigger;
      },
    });
    const clientKey = useMemo(
      () => `${createHash(client.toString())}|${createHash(payload)}`,
      [client, payload],
    );
    const trigger = useCallback(
      (...payload: Parameters<TClient>) => {
        return Promise.resolve(Reflect.apply(client, client, payload))
          .then((data) => {
            clientHashMap.set(clientKey, {
              cachePromise: Promise.resolve(null),
              timestamp: Date.now(),
              cacheResponse: data,
            });
            if (isMounted) {
              setOutPut((state) =>
                produce(state, (draft) => {
                  draft.error = undefined;
                  draft.isLoaded = true;
                  draft.data = data as Draft<TValue>;
                  draft.payload = payload as Draft<Parameters<TClient>>;
                }),
              );
            }
            return data;
          })
          .catch((error) => {
            clientHashMap.set(clientKey, {
              cachePromise: Promise.resolve(null),
              timestamp: Date.now(),
              cacheResponse: error,
            });
            if (isMounted) {
              setOutPut((state) =>
                produce(state, (draft) => {
                  draft.error = error;
                  draft.isLoaded = true;
                  draft.data = undefined as Draft<TValue>;
                  draft.payload = payload as Draft<Parameters<TClient>>;
                }),
              );
            }
          });
      },
      [client, clientKey, isMounted],
    );

    if (!clientHashMap.has(clientKey)) {
      const promise = trigger(...outPut.payload);
      clientHashMap.set(clientKey, {
        cachePromise: promise,
        timestamp: Date.now(),
        cacheResponse: undefined,
      });
    }
    useLayoutEffect(() => {
      setIsMounted(true);
      return () => {
        setIsMounted(false);
      };
    }, []);

    useLayoutEffect(() => {
      return () => {
        const cacheTimestamp = clientHashMap.get(clientKey)?.timestamp;
        /**
         * @description 当缓存过期 或者 未设置缓存事件时候 删除缓存
         */
        if (
          isMounted &&
          cacheTimestamp &&
          (options.maxAge === undefined ||
            Date.now() - cacheTimestamp > options.maxAge)
        ) {
          clientHashMap.delete(clientKey);
        }
      };
    }, [clientKey, isMounted]);

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
      } else if (outPut.isLoaded) {
        return outPut;
      } else {
        throw Promise.resolve(null);
      }
    }, [clientKey, outPut, trigger]);
  };
};

export const useClient = Object.assign(createUseClient({}), {
  bind: (options: ClientOptions) => {
    return createUseClient(options);
  },
});
export default useClient;
