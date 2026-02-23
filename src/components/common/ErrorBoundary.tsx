import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-center text-white">
            <h1 className="text-bronze-500 mb-4 text-4xl font-bold">Oops! Sesuatu salah.</h1>
            <p className="mb-8 max-w-md text-slate-400">
              Terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman atau hubungi
              dukungan jika masalah berlanjut.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-bronze-600 hover:bg-bronze-700 rounded-lg px-6 py-2 text-white transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
