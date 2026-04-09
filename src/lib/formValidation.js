/**
 * Form validation helpers for consistent validation messaging
 */

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const getPasswordError = (password, t) => {
  if (!password) return t("validation", "passwordRequired");
  if (password.length < 6) return t("validation", "passwordMin");
  return null;
};

export const getEmailError = (email, t) => {
  if (!email) return t("validation", "emailRequired");
  if (!validateEmail(email)) return t("validation", "emailInvalid");
  return null;
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim();
};

export const isFormDirty = (original, current) => {
  return JSON.stringify(original) !== JSON.stringify(current);
};

export const getFormErrors = (data, schema, t) => {
  const errors = {};
  // Simple validation based on schema
  if (schema.required) {
    schema.required.forEach((field) => {
      if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
        errors[field] = t("validation", "fieldRequired");
      }
    });
  }
  return errors;
};