import { Component, type ReactNode } from "react";

/** Keeps one broken view from blanking the whole Workbench. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <p className="section-empty">
          Something on this page broke: <code>{this.state.error.message}</code>
          <br />
          Your artifacts are safe. <a href="/">Back to the bench</a>
        </p>
      </div>
    );
  }
}
