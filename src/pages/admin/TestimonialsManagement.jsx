import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, MessageSquareQuote, Star, Trash2, ShieldCheck, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";

function TestimonialCard({ t, isAr, onToggleFeature, onDelete }) {
  const profile = t.profiles || {};
  
  return (
    <div className={`p-4 rounded-xl border ${t.is_featured ? 'border-accent bg-accent/5' : 'border-border bg-card'} relative`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
            {profile.avatar_url ? (
               <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">{profile.first_name?.[0]}</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{profile.first_name} {profile.last_name}</h3>
            <p className="text-xs text-muted-foreground">{profile.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
      </div>
      
      <p className="text-sm text-foreground/80 mb-4 line-clamp-3">
        "{t.quote}"
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-3 border-t border-border">
        <Button 
          variant={t.is_featured ? "default" : "outline"}
          size="sm"
          className={`flex-1 h-8 text-xs ${t.is_featured ? 'bg-accent hover:bg-accent/90 text-white' : ''}`}
          onClick={() => onToggleFeature(t.id, !t.is_featured)}
        >
          {t.is_featured ? (
            <><ShieldCheck className="w-3 h-3 me-1.5" /> {isAr ? "مميز حالياً" : "Featured"}</>
          ) : (
            <><ToggleRight className="w-3 h-3 me-1.5" /> {isAr ? "إظهار كـ مميز" : "Mark Featured"}</>
          )}
        </Button>
        <Button 
          variant="destructive"
          size="sm"
          className="h-8 w-full sm:w-auto px-3"
          onClick={() => {
            if (window.confirm(isAr ? "هل أنت متأكد من حذف هذا التقييم؟" : "Are you sure you want to delete this testimonial?")) {
              onDelete(t.id);
            }
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function TestimonialsManagement() {
  const { lang } = useLanguage();
  const { userProfile } = useAuth();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_testimonials")
        .select("*, profiles(first_name, last_name, avatar_url, role)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: userProfile?.role === "platform_admin",
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, isFeatured }) => {
      const { error } = await supabase.from("platform_testimonials").update({ is_featured: isFeatured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(["admin-testimonials"]),
    onError: (err) => toast.error(err.message),
  });

  const delMut = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("platform_testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم حذف التقييم" : "Testimonial deleted");
      queryClient.invalidateQueries(["admin-testimonials"]);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <MessageSquareQuote className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "آراء المشتركين والتوصيات" : "Platform Testimonials"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "إدارة تقييمات المنصة، اختر الأفضل واجعله مميزاً ليظهر على الصفحة الرئيسية" : "Manage platform testominials, feature the best to show on the homepage."}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <strong className="block mb-1">{isAr ? "كيف تعمل التوصيات المميزة؟" : "How do Featured Testimonials work?"}</strong>
          {isAr ? "التقييمات المميزة باللون البرتقالي هي التقييمات التي يتم سحبها وعرضها في الصفحة الرئيسية للمنصة أمام الزوار الجدد." : "Testimonials marked as featured (in orange) are pulled and displayed directly on the platform's public homepage for new visitors to see."}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : testimonials?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <TestimonialCard 
               key={t.id} 
               t={t} 
               isAr={isAr} 
               onToggleFeature={(id, val) => toggleMut.mutate({ id, isFeatured: val })}
               onDelete={(id) => delMut.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
          <MessageSquareQuote className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">{isAr ? "لا توجد تقييمات بعد" : "No testimonials yet"}</h3>
          <p className="text-sm text-muted-foreground">{isAr ? "لم يقم أي مستخدم بكتابة رأيه حتى الآن" : "No user has submitted a testimonial yet"}</p>
        </div>
      )}
    </div>
  );
}
