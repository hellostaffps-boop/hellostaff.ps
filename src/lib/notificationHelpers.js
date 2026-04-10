import { toast } from "sonner";

/**
 * Consistent notification messaging throughout the app
 */

export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    ...options,
  });
};

export const showError = (message, options = {}) => {
  toast.error(message, {
    duration: 4000,
    ...options,
  });
};

export const showInfo = (message, options = {}) => {
  toast.info(message, {
    duration: 3000,
    ...options,
  });
};

export const showLoading = (message, options = {}) => {
  return toast.loading(message, options);
};

export const dismissToast = (id) => {
  toast.dismiss(id);
};

/**
 * Handle generic errors with user-friendly messages
 */
export const handleFirebaseError = (error, t, context = "") => {
  console.error(`Error in ${context}:`, error);
  const message = t ? t("errors", "generic") : "Something went wrong. Please try again.";
  showError(message);
  return message;
};

/**
 * Show success with action context
 */
export const showActionSuccess = (action, t) => {
  const messages = {
    save: t ? t("feedback", "saved") : "Saved successfully",
    delete: t ? t("feedback", "deleted") : "Deleted successfully",
    create: t ? t("feedback", "created") : "Created successfully",
    update: t ? t("feedback", "updated") : "Updated successfully",
    upload: t ? t("feedback", "uploaded") : "Uploaded successfully",
    apply: t ? t("feedback", "applied") : "Applied successfully",
  };
  showSuccess(messages[action] || "Action completed");
};