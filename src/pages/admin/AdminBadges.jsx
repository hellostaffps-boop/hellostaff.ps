import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import PageHeader from "@/components/PageHeader";
import { Loader2, Plus, Shield, Award } from "lucide-react";

export default function AdminBadges() {
  const { data: badges = [], isLoading } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from('skill_badges').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة شارات المهارات (Skill Badges)" 
        description="إضافة وتعديل الشارات التي يمكن منحها للمرشحين المتميزين"
      />

      <div className="bg-white rounded-xl border border-border p-6 text-center">
        <Shield className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">الشارات قيد التطوير</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          هذه الواجهة ستتيح لك مستقبلاً إنشاء شارات مثل "باريستا محترف"، "شيف معتمد"، ومنحها للمرشحين لزيادة فرصهم بالتوظيف.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {badges.map(badge => (
          <div key={badge.id} className="bg-white p-4 rounded-xl border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {badge.icon_url ? <img src={badge.icon_url} alt="icon" className="w-6 h-6" /> : <Award className="w-6 h-6 text-primary" />}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{badge.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
