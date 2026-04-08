import { useLanguage } from "@/hooks/useLanguage";

export default function LanguageSwitcher({ compact = false }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition-colors select-none"
      title={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <span className="text-sm leading-none">{lang === "en" ? "🇸🇦" : "🇬🇧"}</span>
      {!compact && <span className="text-muted-foreground">{lang === "en" ? "عربي" : "EN"}</span>}
    </button>
  );
}