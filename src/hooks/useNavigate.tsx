import type { FunctionLike } from "ts-utils-helper";
import {
  dynamicUrlReplaceParams,
  type AnyLike,
  type DeepWritable,
  type DynamicUrlReplaceParams,
  type ExtractDynamicUrlParams,
  type FlattenTree,
  type RecordLike,
} from "ts-utils-helper";

// 定义排除特定子字符串的类型
type ExcludeSubstrings<
  T extends string,
  U extends string,
> = T extends `${infer _Prefix}${U}${infer _Suffix}` ? never : T;

interface BasicRouterObject {
  path: string;
  children?: ReadonlyArray<BasicRouterObject>;
}
/**
 * 用来提示和约束路由路径参数
 */
export const createNavigate = <
  T extends ReadonlyArray<BasicRouterObject & RecordLike>,
>(
  _routerConfig: T,
) => {
  type RouteConfigTypes = FlattenTree<DeepWritable<T>, "children">;
  type RoutePathTypes = RouteConfigTypes[number] extends { path: string }
    ? RouteConfigTypes[number]["path"]
    : never;
  type ExcludeParamsPath = ExcludeSubstrings<RoutePathTypes & string, "/:">;
  interface RouteActions {
    <
      T extends Exclude<RoutePathTypes, ExcludeParamsPath>,
      const TParams extends {
        [K in ExtractDynamicUrlParams<T & string>]: AnyLike;
      },
    >(
      navigateHandler: (
        path: DynamicUrlReplaceParams<T & `${string}:${string}`, TParams>,
      ) => void,
      path: T,
      params: TParams,
    ): void;
    <T extends ExcludeParamsPath>(
      navigateHandler: (path: NoInfer<T>) => void,
      path: T,
    ): void;
  }
  const createNavigateHandler = (fn: RouteActions) => fn;
  const useNavigate = () => {
    return createNavigateHandler(
      (fn: FunctionLike, url: string, params?: RecordLike) => {
        if (params === undefined) {
          fn(url);
        } else {
          fn(dynamicUrlReplaceParams(url, params));
        }
      },
    );
  };

  return useNavigate;
};
