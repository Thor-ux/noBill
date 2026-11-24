import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info.componentStack);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="container text-center">
        <h1 className="mt-10 mb-3 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-zinc-400">This page hit an unexpected error.</p>
        <button onClick={() => window.location.reload()} className="watch-button cursor-pointer">Reload</button>
      </main>
    );
  }
}
