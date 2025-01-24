import type { FC, NamedExoticComponent, ReactNode } from "react";
import React from "react";
import type { AnyLike } from "ts-utils-helper";

//抽取nameSpace react 的props
export type ExtractProps<T> =
  T extends NamedExoticComponent<infer TProps>
    ? TProps
    : T extends FC<infer TProps>
      ? TProps
      : never;

type WrappedComponent<T> = React.FC<T> | NamedExoticComponent<T>;
/**
 * @description 骨架屏组件
 * @param WrappedComponent 被包裹的组件
 * @param skeletonComponent 骨架屏组件
 */
const withSuspense = <T extends WrappedComponent<AnyLike>>(
  WrappedComponent: T,
  skeletonComponent: ReactNode,
) => {
  const ComponentWithSuspense = (props: ExtractProps<T>) => {
    return (
      <React.Suspense fallback={skeletonComponent}>
        <WrappedComponent {...props} />
      </React.Suspense>
    );
  };
  ComponentWithSuspense.displayName = `withSuspense(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return ComponentWithSuspense;
};

export default withSuspense;
