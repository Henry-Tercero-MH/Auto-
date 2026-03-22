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
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.9 15.54A1 1 0 002.27 21h19.46a1 1 0 00.88-1.6l-8.9-15.54a1.14 1.14 0 00-2.02 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">Algo salió mal</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-xs">
            {this.state.error?.message || 'Ocurrió un error inesperado en esta sección.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
