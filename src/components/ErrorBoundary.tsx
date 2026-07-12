import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Stops a thrown render in any route from white-screening the whole app.
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error in route:', error, info);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md space-y-4 py-24 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Something went wrong</h1>
          <p className="font-mono text-sm text-zinc-500">{this.state.error.message}</p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.1]"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
