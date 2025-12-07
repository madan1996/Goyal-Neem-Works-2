import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../services/loggerService';
import { Leaf, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.log('CRITICAL', 'Unhandled UI Exception', {
      errorCode: 'UI_CRASH_001',
      functionName: 'ErrorBoundary',
      error: error,
      requestData: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-earth-50 text-earth-900 p-4 font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-earth-100">
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Leaf className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold mb-3 text-earth-900">Something went wrong</h1>
            <p className="text-earth-600 mb-8 leading-relaxed">
              Our herbalists have detected an imbalance in the system. We've logged this issue and are preparing a remedy.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-earth-900 text-white rounded-xl hover:bg-earth-800 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload Application
            </button>
            <p className="mt-4 text-xs text-earth-400">Error Code: UI_CRASH_001</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}