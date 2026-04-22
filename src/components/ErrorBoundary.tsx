import React from "react";

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", padding: 24, background: "#0b1020", color: "#e6f7ff", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ color: "#7CFF3F", fontSize: 22, marginBottom: 12 }}>Algo deu errado</h1>
          <p style={{ marginBottom: 16, opacity: 0.85 }}>
            Ocorreu um erro ao carregar o app. Tente recarregar a página.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#111a33", padding: 12, borderRadius: 8, fontSize: 12, opacity: 0.9 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); location.reload(); }}
            style={{ marginTop: 16, padding: "10px 16px", background: "#1FB8FF", color: "#0b1020", fontWeight: 700, border: 0, borderRadius: 8 }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
