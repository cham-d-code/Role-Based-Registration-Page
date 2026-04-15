import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
  stack?: string;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return { hasError: true, message, stack };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep a console trail for dev, but show UI fallback.
    // eslint-disable-next-line no-console
    console.error('UI crashed', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222' }}>Something went wrong</h2>
          <p style={{ marginTop: 8, color: '#555', fontSize: 14 }}>
            The page crashed while rendering. The error below will help us fix it.
          </p>

          <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b42318' }}>Error</div>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, fontSize: 12, color: '#111' }}>
              {this.state.message || 'Unknown error'}
            </pre>
            {this.state.stack ? (
              <>
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#555' }}>Stack</div>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, fontSize: 12, color: '#333' }}>
                  {this.state.stack}
                </pre>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

