'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-err-bg text-err flex items-center justify-center text-2xl">⚠</div>
          <h2 className="font-display text-2xl text-ink">Something went wrong</h2>
          <p className="text-ink-muted text-sm max-w-sm font-fn">
            {this.state.error.message || 'An unexpected error occurred on this page.'}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-fn font-medium text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
