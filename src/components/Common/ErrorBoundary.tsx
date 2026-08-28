import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl my-4 shadow-sm text-slate-800">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-red-900">
                {this.props.fallbackTitle || 'Đã xảy ra lỗi khi hiển thị dữ liệu.'}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {this.state.error?.message || 'Có lỗi xảy ra trong quá trình render.'}
              </p>
              {this.state.errorInfo && (
                <details className="mt-3 text-xs bg-red-100/50 p-2.5 rounded font-mono text-red-800 max-h-36 overflow-y-auto">
                  <summary className="cursor-pointer font-bold mb-1">Chi tiết lỗi (Stack trace)</summary>
                  {this.state.error?.stack}
                </details>
              )}
              <div className="mt-4 flex items-center space-x-3">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Tải lại trang
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
