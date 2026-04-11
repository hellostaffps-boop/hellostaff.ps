import { useEffect } from "react";

const DEFAULT_TITLE = "Hospitality Jobs | Find Café & Restaurant Jobs";
const DEFAULT_DESC = "Browse the latest hospitality jobs — barista, waiter, chef, and more. Apply in minutes.";

function setMeta(name, content, attr = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * usePageMeta — dynamically updates <title> and meta tags for SEO.
 * @param {{ title?: string, description?: string, image?: string, url?: string }} opts
 */
export function usePageMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const t = title ? `${title} | HospitalityJobs` : DEFAULT_TITLE;
    const d = description || DEFAULT_DESC;
    const canonical = url || window.location.href;

    // Title
    document.title = t;

    // Standard
    setMeta("description", d);
    setMeta("robots", "index, follow");

    // Canonical
    let link = document.querySelector("link[rel='canonical']");
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;

    // Open Graph
    setMeta("og:title", t, "property");
    setMeta("og:description", d, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", "website", "property");
    if (image) setMeta("og:image", image, "property");

    // Twitter
    setMeta("twitter:title", t, "name");
    setMeta("twitter:description", d, "name");
    if (image) setMeta("twitter:image", t, "name");

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESC);
      setMeta("og:title", DEFAULT_TITLE, "property");
      setMeta("og:description", DEFAULT_DESC, "property");
    };
  }, [title, description, image, url]);
}