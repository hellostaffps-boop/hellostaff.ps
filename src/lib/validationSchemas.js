/**
 * validationSchemas.js — Input validation helpers.
 */

// ─── Password Validation ─────────────────────────────────────────────────────
const PASSWORD_MIN = 8;
const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export const validatePassword = (password, lang = "en") => {
  const isAr = lang === "ar";
  const errors = [];
  if (!password || password.length < PASSWORD_MIN) {
    errors.push(isAr ? `كلمة المرور يجب أن تكون ${PASSWORD_MIN} أحرف على الأقل` : `Password must be at least ${PASSWORD_MIN} characters`);
  }
  if (!PASSWORD_REGEX.uppercase.test(password)) {
    errors.push(isAr ? "يجب أن تحتوي على حرف كبير واحد على الأقل" : "Must contain at least one uppercase letter");
  }
  if (!PASSWORD_REGEX.number.test(password)) {
    errors.push(isAr ? "يجب أن تحتوي على رقم واحد على الأقل" : "Must contain at least one number");
  }
  if (!PASSWORD_REGEX.special.test(password)) {
    errors.push(isAr ? "يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%...)" : "Must contain at least one special character (!@#$%...)");
  }
  return { valid: errors.length === 0, errors };
};

export const validatePasswordMatch = (password, confirmPassword, lang = "en") => {
  const isAr = lang === "ar";
  if (password !== confirmPassword) {
    return { valid: false, error: isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match" };
  }
  return { valid: true, error: null };
};

// ─── Password Strength Indicator ─────────────────────────────────────────────
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= PASSWORD_MIN) score++;
  if (password.length >= 12) score++;
  if (PASSWORD_REGEX.uppercase.test(password) && PASSWORD_REGEX.lowercase.test(password)) score++;
  if (PASSWORD_REGEX.number.test(password)) score++;
  if (PASSWORD_REGEX.special.test(password)) score++;

  if (score <= 1) return { score: 1, label: "weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "fair", color: "bg-orange-500" };
  if (score <= 3) return { score: 3, label: "good", color: "bg-yellow-500" };
  if (score <= 4) return { score: 4, label: "strong", color: "bg-green-500" };
  return { score: 5, label: "excellent", color: "bg-emerald-500" };
};

// ─── Email Validation ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateEmail = (email, lang = "en") => {
  const isAr = lang === "ar";
  if (!email) return { valid: false, error: isAr ? "البريد الإلكتروني مطلوب" : "Email is required" };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: isAr ? "بريد إلكتروني غير صالح" : "Invalid email address" };
  return { valid: true, error: null };
};

// ─── Phone Validation (Palestinian numbers) ──────────────────────────────────
const PHONE_REGEX = /^(\+970|0)(5[679])\d{7}$/;

export const validatePhone = (phone, lang = "en") => {
  const isAr = lang === "ar";
  if (!phone) return { valid: true, error: null }; // optional
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: isAr ? "رقم هاتف فلسطيني غير صالح (059/056/057)" : "Invalid Palestinian phone number (059/056/057)" };
  }
  return { valid: true, error: null };
};

// ─── Name Validation ─────────────────────────────────────────────────────────
export const validateName = (name, lang = "en") => {
  const isAr = lang === "ar";
  if (!name || name.trim().length < 2) {
    return { valid: false, error: isAr ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters" };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: isAr ? "الاسم طويل جداً" : "Name is too long" };
  }
  return { valid: true, error: null };
};

// ─── Text Field Length ───────────────────────────────────────────────────────
export const validateLength = (text, min, max, fieldName, lang = "en") => {
  const isAr = lang === "ar";
  const len = (text || "").length;
  if (min && len < min) {
    return { valid: false, error: isAr ? `${fieldName} يجب أن يكون ${min} حرف على الأقل` : `${fieldName} must be at least ${min} characters` };
  }
  if (max && len > max) {
    return { valid: false, error: isAr ? `${fieldName} لا يمكن أن يتجاوز ${max} حرف` : `${fieldName} cannot exceed ${max} characters` };
  }
  return { valid: true, error: null };
};
