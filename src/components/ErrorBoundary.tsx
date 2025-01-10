import React from "react";
import type { AnyLike } from "ts-utils-helper";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  errorMessage?: string;
};
export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  override state: { hasError: boolean };
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: AnyLike) {
    // 你可以在此处记录错误日志
    console.error("Error caught in ErrorBoundary: ", error, errorInfo);
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <h1>{this.props.errorMessage ?? "出错了!"}</h1>
        </div>
      );
    }

    return this.props.children;
  }
}
