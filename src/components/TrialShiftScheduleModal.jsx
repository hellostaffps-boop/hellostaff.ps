import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { saasService } from "@/lib/services/saasService";
import { toast } from "sonner";

export default function TrialShiftScheduleModal({ application, onClose, onSuccess }) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const ar = lang === "ar";

  const [form, setForm] = useState({
    scheduled_date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: ""
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      return await saasService.createTrialShift({
        application_id: application.id,
        candidate_id: application.candidate_id,
        organization_id: application.organization_id,
        ...data
      });
    },
    onSuccess: () => {
      toast.success(ar ? "تمت جدولة فترة التجربة بنجاح" : "Trial shift scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["employer-applications"] });
      queryClient.invalidateQueries({ queryKey: ["trial-shifts"] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(ar ? "فشل في جدولة التجربة" : "Failed to schedule trial shift");
      console.error(err);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.scheduled_date || !form.start_time || !form.end_time) {
      toast.error(ar ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    scheduleMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <h3 className="font-semibold text-foreground">
            {ar ? "جدولة تجربة عمل (Trial Shift)" : "Schedule Trial Shift"}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-primary/5 p-3 rounded-lg flex flex-col gap-1 mb-4 border border-primary/10">
            <span className="text-xs text-muted-foreground">{ar ? "المرشح:" : "Candidate:"} <strong className="text-foreground">{application.candidate_name || application.candidate_email}</strong></span>
            <span className="text-xs text-muted-foreground">{ar ? "الوظيفة:" : "Role:"} <strong className="text-foreground">{application.job_title}</strong></span>
          </div>

          <div>
            <Label className="text-sm flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {ar ? "التاريخ *" : "Date *"}</Label>
            <Input 
              type="date" 
              value={form.scheduled_date} 
              onChange={e => setForm({...form, scheduled_date: e.target.value})} 
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {ar ? "من الساعة *" : "Start Time *"}</Label>
              <Input 
                type="time" 
                value={form.start_time} 
                onChange={e => setForm({...form, start_time: e.target.value})} 
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {ar ? "إلى الساعة *" : "End Time *"}</Label>
              <Input 
                type="time" 
                value={form.end_time} 
                onChange={e => setForm({...form, end_time: e.target.value})} 
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {ar ? "الموقع / الفرع" : "Location / Branch"}</Label>
            <Input 
              placeholder={ar ? "مثال: فرع رام الله الرئيسي" : "e.g. Main Ramallah Branch"} 
              value={form.location} 
              onChange={e => setForm({...form, location: e.target.value})} 
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">{ar ? "ملاحظات إضافية للمرشح" : "Additional Notes"}</Label>
            <Textarea 
              placeholder={ar ? "اللباس المطلوب، من سيسأل عنه، إلخ..." : "Required dress code, who to ask for..."}
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})} 
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={scheduleMutation.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {scheduleMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {ar ? "تأكيد الجدولة" : "Confirm Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
