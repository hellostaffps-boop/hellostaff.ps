import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily: "'Tajawal', sans-serif",
          background: "#fafafa",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "#fef2f2", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem",
          }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: 4 }}>
            يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً.
          </p>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: 24, direction: "ltr" }}>
            An unexpected error occurred. Please reload.
          </p>
          {this.state.error?.message && (
            <p style={{
              fontSize: "0.7rem", color: "#f87171", background: "#fef2f2",
              borderRadius: 8, padding: "8px 12px", marginBottom: 24,
              fontFamily: "monospace", direction: "ltr", wordBreak: "break-all",
            }}>
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "hsl(222 47% 18%)", color: "white",
              fontSize: "0.875rem", fontWeight: 500,
            }}
          >
            إعادة تحميل &nbsp;/&nbsp; Reload
          </button>
        </div>
      </div>
    );
  }
}