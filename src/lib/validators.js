/**
 * validators.js — Input validation utilities for forms.
 * Provides both individual validators and combined form validators.
 */

// Email validation (RFC 5322 simplified)
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) && email.length <= 254;
}

// Palestinian phone number validation
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Accepts: +970..., 970..., 059..., 056..., etc.
  const re = /^(\+?970|0)(5[0-9])\d{7}$/;
  return re.test(cleaned);
}

// URL validation
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Text length validation
export function isValidLength(text, min = 1, max = 5000) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

// Sanitize text input (strip dangerous HTML)
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

// Validate checkout form
export function validateCheckoutForm(data, lang = 'en') {
  const errors = {};
  const isAr = lang === 'ar';
  
  if (!isValidPhone(data.phone)) {
    errors.phone = isAr ? 'رقم الهاتف غير صالح' : 'Invalid phone number';
  }
  if (!isValidLength(data.address, 5, 500)) {
    errors.address = isAr ? 'العنوان مطلوب (5 أحرف على الأقل)' : 'Address required (min 5 chars)';
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}

// Validate job posting form
export function validateJobForm(data, lang = 'en') {
  const errors = {};
  const isAr = lang === 'ar';
  
  if (!isValidLength(data.title, 3, 200)) {
    errors.title = isAr ? 'عنوان الوظيفة مطلوب' : 'Job title is required';
  }
  if (!isValidLength(data.description, 20, 10000)) {
    errors.description = isAr ? 'الوصف يجب أن يكون 20 حرفاً على الأقل' : 'Description must be at least 20 characters';
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}

// Validate application form
export function validateApplicationForm(data, lang = 'en') {
  const errors = {};
  const isAr = lang === 'ar';

  if (!isValidLength(data.cover_letter || '', 10, 5000)) {
    errors.cover_letter = isAr ? 'رسالة التغطية يجب أن تكون 10 أحرف على الأقل' : 'Cover letter must be at least 10 characters';
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}
