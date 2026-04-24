import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { getTopRatedEmployees } from "@/lib/supabaseService";
import { Star, MapPin, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Demo data to show when no real employees exist yet
const DEMO_EMPLOYEES = [
  { profile_id: "demo-1", full_name: "أحمد الخطيب", title: "باريستا محترف", city: "رام الله", average_rating: 5.0, review_count: 12, avatar_url: null },
  { profile_id: "demo-2", full_name: "سارة عوض", title: "شيف معجنات", city: "بيت لحم", average_rating: 4.9, review_count: 8, avatar_url: null },
  { profile_id: "demo-3", full_name: "عمر نصار", title: "نادل أول", city: "نابلس", average_rating: 4.8, review_count: 15, avatar_url: null },
  { profile_id: "demo-4", full_name: "لينا حمدان", title: "مديرة مطعم", city: "الخليل", average_rating: 4.9, review_count: 10, avatar_url: null },
];

const TopEmployeesSection = () => {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await getTopRatedEmployees(4);
        // Use real data if available, otherwise show demo
        setEmployees(data && data.length > 0 ? data : DEMO_EMPLOYEES);
      } catch (error) {
        console.error("Error fetching top employees:", error);
        setEmployees(DEMO_EMPLOYEES);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  if (loading) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-app-bg">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Award className="w-4 h-4" />
            {t("hero", "workers")}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {t("topEmployees", "heading")}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("topEmployees", "subtext")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {employees.map((emp, idx) => (
            <Card key={emp.profile_id || idx} className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300 overflow-hidden hover:border-primary/30 group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg">
                      <img 
                        src={emp.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.full_name}`}
                        alt={emp.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-md border border-border">
                      <div className="flex items-center justify-center bg-primary/10 text-primary font-bold text-xs px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-primary mr-1" />
                        {Number(emp.average_rating).toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1 truncate w-full">{emp.full_name}</h3>
                  <p className="text-sm text-primary font-medium mb-3 truncate w-full">{emp.title || (isRTL ? "محترف ضيافة" : "Hospitality Pro")}</p>
                  
                  {emp.city && (
                    <div className="flex items-center text-xs text-muted-foreground mb-4">
                      <MapPin className="w-3 h-3 mr-1" />
                      {emp.city}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md w-full">
                    {emp.review_count} {t("topEmployees", "reviews")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopEmployeesSection;
