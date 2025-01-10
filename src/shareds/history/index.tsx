import { produce } from "immer";
import { useCallback, useId, useMemo, useSyncExternalStore } from "react";
import { createHash, createHistoryHelper } from "store-provider-helper";
import type { AnyLike } from "ts-utils-helper";

type HistoryOptions = {
  /**过期事件 */
  expire?: number; //  number(ms)
};
/**
 * @description 提供把数据存储在history中的能力
 */

interface SetState<TData = AnyLike> {
  <T extends (data: TData) => TData>(updateFn: T): void;
  <T extends Partial<TData>>(data: T): void;
}

const historyHelper = createHistoryHelper();

export const useHistoryState = function <TState>(
  InitState: TState,
  options?: HistoryOptions,
) {
  const id = useId();
  const key = useMemo(() => {
    return `${createHash(InitState)}/${id}`;
  }, [InitState, id]);

  const setValue = useCallback(
    (curData: Partial<TState> | ((data: TState) => TState)) => {
      if (typeof curData === "function") {
        produce(historyHelper.getValue(key), (draft: TState) => {
          const updateData = curData(draft);
          historyHelper.setValue(key, updateData);
        });
      } else {
        historyHelper.setValue(key, curData);
      }
    },
    [key],
  );

  const state = useSyncExternalStore(
    (onStoreChange) => {
      return historyHelper.subscribe(key, onStoreChange);
    },
    () => historyHelper.getValue(key),
    () => historyHelper.getValue(key),
  );

  return useMemo(() => {
    const historyItem = historyHelper.getItem(key);
    let value = state ?? InitState;
    if (
      options?.expire &&
      historyItem?.date &&
      Date.now() > historyItem.date + options.expire
    ) {
      value = InitState;
    }
    return [value, setValue] as [TState, SetState<TState>];
  }, [key, state, InitState, options?.expire, setValue]);
};
