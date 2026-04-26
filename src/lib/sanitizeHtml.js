/**
 * sanitizeHtml.js — Lightweight XSS sanitizer.
 * Uses regex-based filtering to remove dangerous HTML/JS.
 * 
 * NOTE: For production, replace with DOMPurify after `npm install isomorphic-dompurify`.
 * This is a defensive fallback when DOMPurify is unavailable.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onload=, etc.
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /data:\s*text\/html/gi,
];

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  let sanitized = html;
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });
  return sanitized.trim();
}

/**
 * sanitizeMarkdown — Sanitize rendered Markdown HTML.
 * Strips all tags except a whitelist of safe formatting tags.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a", "span", "div", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "td", "th",
]);

const ALLOWED_ATTRS = new Set(["href", "title", "target", "class", "style"]);

export function sanitizeMarkdownHtml(html) {
  if (!html || typeof html !== "string") return "";
  
  // Step 1: Remove dangerous patterns
  let sanitized = sanitizeHtml(html);
  
  // Step 2: Parse and whitelist tags/attributes
  const tagPattern = /<(\/?)(\w+)([^>]*)>/gi;
  sanitized = sanitized.replace(tagPattern, (match, slash, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return "";
    }
    
    // Sanitize attributes
    const sanitizedAttrs = (attrs || "").replace(/(\w+)=(["'])(.*?)\2/g, (attrMatch, attrName, quote, attrValue) => {
      const lowerAttr = attrName.toLowerCase();
      if (!ALLOWED_ATTRS.has(lowerAttr)) return "";
      
      // Sanitize href: only allow http/https/mailto
      if (lowerAttr === "href") {
        const safeHref = attrValue.trim();
        if (!/^https?:\/\/|^mailto:/i.test(safeHref)) {
          return "";
        }
      }
      
      // Escape quotes in attribute values
      const safeValue = attrValue.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      return `${attrName}="${safeValue}"`;
    }).trim();
    
    return `<${slash}${tagName}${sanitizedAttrs ? " " + sanitizedAttrs : ""}>`;
  });
  
  return sanitized;
}
