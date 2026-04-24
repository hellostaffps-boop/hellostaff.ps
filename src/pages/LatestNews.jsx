import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { getLatestNews } from "@/lib/supabaseService";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS = {
  industry_news: { en: "Industry News", ar: "أخبار القطاع" },
  career_tips: { en: "Career Tips", ar: "نصائح مهنية" },
  platform_updates: { en: "Platform Updates", ar: "تحديثات المنصة" },
  general: { en: "General", ar: "عام" },
};

const LatestNews = () => {
  const { t, lang, isRTL } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getLatestNews(50);
        setNews(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: isRTL ? ar : enUS,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <Button variant="ghost" asChild className="mb-6 -ml-4 px-4 text-muted-foreground hover:text-foreground">
            <Link to="/">
              {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t("comingSoon", "backHome")}
            </Link>
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t("latestNews", "heading")}</h1>
          <p className="text-xl text-muted-foreground">{t("latestNews", "subtext")}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card/30 p-4 space-y-4 animate-pulse">
                <div className="h-48 bg-muted rounded-xl w-full"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/20">
            <p className="text-muted-foreground text-lg">{t("latestNews", "noNews")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <Link 
                to={`/news/${item.slug || item.id}`} 
                key={item.id}
                className="group flex flex-col rounded-2xl border border-border bg-card/40 hover:bg-card/80 transition-all duration-300 overflow-hidden hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]"
              >
                <div className="h-52 w-full overflow-hidden relative">
                  <img 
                    src={item.image_url || "https://images.unsplash.com/photo-1559925393-8be0a33e2a14?w=800&q=80"} 
                    alt={isRTL ? item.title_ar : item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                      {CATEGORY_LABELS[item.category]?.[isRTL ? "ar" : "en"] || item.category || "General"}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    {formatDate(item.published_at)}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {isRTL && item.title_ar ? item.title_ar : item.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-grow">
                    {isRTL && item.excerpt_ar ? item.excerpt_ar : item.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm font-medium pt-4 border-t border-border mt-auto">
                    <span className="text-primary flex items-center">
                      {t("latestNews", "readMore")}
                      {isRTL ? <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestNews;
