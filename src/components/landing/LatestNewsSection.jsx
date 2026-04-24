import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { getLatestNews } from "@/lib/supabaseService";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS = {
  industry_news: { en: "Industry News", ar: "أخبار القطاع" },
  career_tips: { en: "Career Tips", ar: "نصائح مهنية" },
  platform_updates: { en: "Platform Updates", ar: "تحديثات المنصة" },
  general: { en: "General", ar: "عام" },
};

const LatestNewsSection = () => {
  const { t, lang, isRTL } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getLatestNews(3);
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

  if (loading || news.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-app-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {t("latestNews", "heading")}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("latestNews", "subtext")}
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link to="/news">
              {t("latestNews", "viewAll")}
              {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item) => (
            <Link 
              to={`/news/${item.slug || item.id}`} 
              key={item.id}
              className="group flex flex-col rounded-2xl border border-border bg-card/40 hover:bg-card/80 transition-all duration-300 overflow-hidden hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]"
            >
              <div className="h-48 w-full overflow-hidden relative">
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
                <div className="text-xs text-muted-foreground mb-3">
                  {formatDate(item.published_at)}
                </div>
                
                <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {isRTL && item.title_ar ? item.title_ar : item.title}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-grow">
                  {isRTL && item.excerpt_ar ? item.excerpt_ar : item.excerpt}
                </p>
                
                <div className="flex items-center text-sm font-medium pt-4 border-t border-border mt-auto text-primary">
                  {t("latestNews", "readMore")}
                  {isRTL ? <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild className="w-full">
            <Link to="/news">
              {t("latestNews", "viewAll")}
              {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LatestNewsSection;
