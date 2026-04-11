'use client';

/**
 * components/ErrorBoundary.jsx
 * ─────────────────────────────────────────────────────
 * React class-based error boundary.
 * Catches render errors in the subtree and shows a
 * fallback instead of crashing the entire page.
 * ─────────────────────────────────────────────────────
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Render the caller-supplied fallback or a minimal default
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs">
          Something went wrong in this section.
        </div>
      );
    }
    return this.props.children;
  }
}
