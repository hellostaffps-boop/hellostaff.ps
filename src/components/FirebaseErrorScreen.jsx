/**
 * FirebaseErrorScreen — shown when Firebase fails to initialize.
 * Bilingual: Arabic (default) + English.
 */
export default function FirebaseErrorScreen({ error }) {
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
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
          تعذّر تشغيل التطبيق
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: 4 }}>
          حدث خطأ أثناء الاتصال بالخدمة. يرجى المحاولة مجدداً.
        </p>
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: 24, direction: "ltr" }}>
          App failed to initialize. Please try again.
        </p>
        {error?.message && (
          <p style={{
            fontSize: "0.7rem", color: "#f87171", background: "#fef2f2",
            borderRadius: 8, padding: "8px 12px", marginBottom: 24,
            fontFamily: "monospace", direction: "ltr", wordBreak: "break-all",
          }}>
            {error.message}
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
          إعادة المحاولة &nbsp;/&nbsp; Retry
        </button>
      </div>
    </div>
  );
}