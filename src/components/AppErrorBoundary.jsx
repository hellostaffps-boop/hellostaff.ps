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
    console.error("[AppErrorBoundary] Caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-white px-4"
          style={{ fontFamily: "'Tajawal', sans-serif" }}
        >
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-gray-500 mb-1">يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً.</p>
            <p className="text-xs text-gray-400 mb-6" dir="ltr">An unexpected error occurred. Please reload.</p>
            {this.state.error?.message && (
              <p className="text-xs text-red-400 bg-red-50 rounded-lg px-4 py-2 mb-6 font-mono break-all" dir="ltr">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ background: "hsl(222 47% 18%)", color: "white" }}
            >
              إعادة تحميل &nbsp;/&nbsp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}