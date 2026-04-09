/**
 * FirebaseErrorScreen — shown when Firebase fails to initialize.
 * Bilingual: Arabic (default) + English.
 */
export default function FirebaseErrorScreen({ error }) {
  const reload = () => window.location.reload();

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-background px-4"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">تعذّر تشغيل التطبيق</h1>
        <p className="text-sm text-gray-500 mb-1">حدث خطأ أثناء الاتصال بالخدمة. يرجى المحاولة مجدداً.</p>
        <p className="text-xs text-gray-400 mb-6" dir="ltr">App failed to initialize. Please try again.</p>
        {error?.message && (
          <p className="text-xs text-red-400 bg-red-50 rounded-lg px-4 py-2 mb-6 font-mono break-all" dir="ltr">
            {error.message}
          </p>
        )}
        <button
          onClick={reload}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: "hsl(222 47% 18%)", color: "white" }}
        >
          إعادة المحاولة &nbsp;/&nbsp; Retry
        </button>
      </div>
    </div>
  );
}