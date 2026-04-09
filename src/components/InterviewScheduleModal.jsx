import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Video, Phone, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { scheduleInterview } from "@/lib/interviewService";
import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { useLanguage } from "@/hooks/useLanguage";

const TYPE_OPTIONS = [
  { value: "in_person", icon: Users,   labelAr: "حضوري",   labelEn: "In Person" },
  { value: "online",    icon: Video,   labelAr: "عبر الإنترنت", labelEn: "Online" },
  { value: "phone",     icon: Phone,   labelAr: "هاتفي",   labelEn: "Phone" },
];

export default function InterviewScheduleModal({ application, existingInterview, onClose, onSuccess }) {
  const { firebaseUser } = useFirebaseAuth();
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [form, setForm] = useState({
    scheduled_at: "",
    location: "",
    type: "in_person",
    notes: "",
  });

  useEffect(() => {
    if (existingInterview) {
      setForm({
        scheduled_at: existingInterview.scheduled_at || "",
        location: existingInterview.location || "",
        type: existingInterview.type || "in_person",
        notes: existingInterview.notes || "",
      });
    }
  }, [existingInterview]);

  const mutation = useMutation({
    mutationFn: () => scheduleInterview(firebaseUser.uid, application.id, form),
    onSuccess: () => {
      toast.success(ar ? "تمت جدولة المقابلة بنجاح" : "Interview scheduled successfully");
      onSuccess?.();
      onClose();
    },
    onError: () => toast.error(ar ? "حدث خطأ أثناء الجدولة" : "Failed to schedule interview"),
  });

  const isReschedule = !!existingInterview?.scheduled_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">
              {isReschedule
                ? (ar ? "إعادة جدولة المقابلة" : "Reschedule Interview")
                : (ar ? "جدولة مقابلة" : "Schedule Interview")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {application.candidate_name || application.candidate_email}
              {" · "}
              {application.job_title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Date & Time */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {ar ? "تاريخ ووقت المقابلة" : "Date & Time"}
            </Label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {ar ? "نوع المقابلة" : "Interview Type"}
            </Label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(({ value, icon: Icon, labelAr, labelEn }) => (
                <button
                  key={value}
                  onClick={() => setForm((f) => ({ ...f, type: value }))}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    form.type === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {ar ? labelAr : labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {ar ? "الموقع أو رابط الاجتماع" : "Location or Meeting Link"}
            </Label>
            <Input
              placeholder={ar ? "العنوان أو رابط Zoom/Teams..." : "Address or Zoom/Teams link..."}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>

          {/* Notes for candidate */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              {ar ? "ملاحظات للمرشح (اختياري)" : "Notes for Candidate (optional)"}
            </Label>
            <textarea
              rows={2}
              placeholder={ar ? "تعليمات للمرشح قبل المقابلة..." : "Instructions for the candidate..."}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={!form.scheduled_at || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? (ar ? "جارٍ الحفظ..." : "Saving...")
              : isReschedule
                ? (ar ? "تحديث الموعد" : "Update Interview")
                : (ar ? "تأكيد الموعد" : "Confirm Interview")}
          </Button>
        </div>
      </div>
    </div>
  );
}