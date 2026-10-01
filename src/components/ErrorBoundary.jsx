import { Component } from "react";

function ScreenCrashed() {
  return (
    <div className="table-state-card standalone">
      <div className="state-icon-badge danger">
        <i className="bi bi-exclamation-triangle"></i>
      </div>
      <h3>Something went wrong</h3>
      <p>This page couldn't load. Reload to try again.</p>
      <button
        type="button"
        className="state-action-btn secondary"
        onClick={() => window.location.reload()}
      >
        <i className="bi bi-arrow-clockwise"></i>
        <span>Reload</span>
      </button>
    </div>
  );
}

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <ScreenCrashed />;
    return this.props.children;
  }
}
