/**
 * Bilingual UI helpers for consistent status/label rendering
 */

export const STATUS_COLORS = {
  // Application status
  pending: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  submitted: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  reviewing: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  shortlisted: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  interview: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  offered: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  hired: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  rejected: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  withdrawn: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },

  // Job status
  draft: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
  published: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  closed: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  filled: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
};

export const getStatusBadgeClass = (status) => {
  const color = getStatusColor(status);
  return `${color.bg} ${color.text} border ${color.border}`;
};

/**
 * Format timestamp to localized string
 */
export const formatTimestamp = (timestamp, lang = "en") => {
  if (!timestamp) return "";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/**
 * Format date only
 */
export const formatDate = (timestamp, lang = "en") => {
  if (!timestamp) return "";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp, t, lang = "en") => {
  if (!timestamp) return "";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return lang === "ar" ? "للتو" : "just now";
  if (diffMins < 60) return `${diffMins} ${lang === "ar" ? "دقيقة" : "mins"} ${lang === "ar" ? "مضت" : "ago"}`;
  if (diffHours < 24) return `${diffHours} ${lang === "ar" ? "ساعة" : "hours"} ${lang === "ar" ? "مضت" : "ago"}`;
  if (diffDays < 7) return `${diffDays} ${lang === "ar" ? "يوم" : "days"} ${lang === "ar" ? "مضت" : "ago"}`;
  return formatDate(timestamp, lang);
};