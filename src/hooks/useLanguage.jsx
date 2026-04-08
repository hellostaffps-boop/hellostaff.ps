import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "@/lib/i18n";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("hs_lang");
    if (saved) return saved;
    const browserLang = navigator.language || navigator.userLanguage || "en";
    return browserLang.startsWith("ar") ? "ar" : "en";
  });

  useEffect(() => {
    const isRTL = lang === "ar";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("hs_lang", lang);
  }, [lang]);

  const t = (section, key) => {
    return translations[lang]?.[section]?.[key] || translations["en"]?.[section]?.[key] || key;
  };

  const toggleLang = () => setLang((prev) => (prev === "en" ? "ar" : "en"));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isRTL: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}