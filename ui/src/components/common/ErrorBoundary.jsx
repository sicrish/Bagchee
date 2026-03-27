import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-semibold text-text-main mb-4">Something went wrong</h2>
          <p className="text-gray-500 max-w-md mb-8">
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-8 py-3 font-bold uppercase text-sm tracking-wider hover:bg-primary-dark transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
