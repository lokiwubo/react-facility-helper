import type { Draft } from "immer";
import { produce } from "immer";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { createHash, type AnyLike, type FunctionLike } from "ts-utils-helper";

type UseClientOutputType<T, TArgs extends unknown[]> = {
  error?: unknown;
  isInitialized: boolean;
  isLoading: boolean;
  data?: T;
  payload: TArgs;
  trigger: (...args: TArgs) => void;
};

type ClientCache = {
  cachePromise: Promise<unknown>;
  status: "pending" | "fulfilled" | "rejected";
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
    const [outPut, setOutPut] = useState<
      Omit<UseClientOutputType<TValue, Parameters<TClient>>, "trigger">
    >({
      isInitialized: false,
      isLoading: true,
      data: undefined as TValue,
      payload: payload,
    });
    const clientKey = useMemo(
      () =>
        `${client.name}:${createHash(client.toString())}_${createHash(payload)}`,
      [client, payload],
    );
    const [_isPending, startTransition] = useTransition();

    const trigger = useCallback(
      (...payload: Parameters<TClient>) => {
        if (outPut.isInitialized && !outPut.isLoading) {
          setOutPut((state) =>
            produce(state, (draft) => {
              draft.error = undefined;
              draft.isLoading = true;
            }),
          );
        }
        let _isError = false;
        let _data: unknown;
        return Promise.resolve(Reflect.apply(client, client, payload))
          .then((data) => {
            _data = data;
            _isError = false;
          })
          .catch((error) => {
            _data = error;
            _isError = true;
          })
          .finally(() => {
            clientHashMap.set(clientKey, {
              cachePromise: Promise.resolve(null),
              status: _isError ? "rejected" : "fulfilled",
              timestamp: Date.now(),
              cacheResponse: _data,
            });
            if (outPut.isInitialized) {
              startTransition(() =>
                setOutPut((state) =>
                  produce(state, (draft) => {
                    draft.error = _isError ? _data : undefined;
                    draft.isInitialized = true;
                    draft.isLoading = false;
                    draft.data = _isError
                      ? undefined
                      : (_data as Draft<TValue>);
                    draft.payload = payload as Draft<Parameters<TClient>>;
                  }),
                ),
              );
            }
          });
      },
      [client, clientKey, outPut],
    );

    useEffect(() => {
      const cache = clientHashMap.get(clientKey);
      if (cache) {
        setOutPut((state) =>
          produce(state, (draft) => {
            draft.error =
              cache.status === "rejected" ? cache.cacheResponse : undefined;
            draft.isInitialized = true;
            draft.isLoading = false;
            draft.data =
              cache.status === "fulfilled"
                ? cache.cacheResponse
                : (undefined as Draft<TValue>);
          }),
        );
      }
    }, [clientKey]);

    useEffect(() => {
      return () => {
        const cacheTimestamp = clientHashMap.get(clientKey)?.timestamp;
        /**
         * @description 当缓存过期 或者 未设置缓存事件时候 删除缓存
         */
        if (
          cacheTimestamp &&
          (options.maxAge === undefined ||
            Date.now() - cacheTimestamp > options.maxAge)
        ) {
          clientHashMap.delete(clientKey);
        }
      };
    }, [clientKey]);

    return useMemo(() => {
      const cache = clientHashMap.get(clientKey);
      if (outPut.isInitialized) {
        return { ...outPut, trigger };
      } else if (cache && cache.cacheResponse) {
        return {
          isInitialized: true,
          data: outPut?.data ?? cache.cacheResponse,
          isLoading: false,
          payload: outPut.payload,
          error: outPut?.error,
          trigger,
        };
      } else {
        throw new Promise((resolve) => {
          const promise = trigger(...outPut.payload);
          clientHashMap.set(clientKey, {
            cachePromise: promise,
            timestamp: Date.now(),
            status: "pending",
            cacheResponse: undefined,
          });
          resolve(null);
        });
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
