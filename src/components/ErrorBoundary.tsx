import { Component, ErrorInfo, ReactNode } from "react";
import { Flame, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen w-full grid place-items-center bg-background px-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-gradient-ember shadow-ember grid place-items-center">
            <Flame className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-3">Something broke</h1>
          <p className="text-sm text-muted-foreground mb-7">
            That's on us, not on you. Reload and pick up where you left off — your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="press inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-ember text-primary-foreground font-bold text-sm shadow-ember"
          >
            <RotateCw className="h-4 w-4" strokeWidth={2.5} />
            Reload Focus Forge
          </button>
        </div>
      </div>
    );
  }
}
