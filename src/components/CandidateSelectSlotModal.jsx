import { useState } from "react";
import { X, CalendarCheck, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { selectInterviewSlot } from "@/lib/interviewSlotService";

const TYPE_LABELS = { in_person: "حضوري", online: "عبر الإنترنت", phone: "هاتفي" };

export default function CandidateSelectSlotModal({ slot, onClose, onSuccess }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (iso) => new Date(iso).toLocaleString("ar-SA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const handleConfirm = async () => {
    if (!selected) { toast.error("اختر موعداً أولاً"); return; }
    setLoading(true);
    await selectInterviewSlot(slot.id, selected);
    toast.success("تم تأكيد موعد مقابلتك! ستصلك رسالة تأكيد على بريدك الإلكتروني.");
    setLoading(false);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-base">اختر موعد مقابلتك</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">{slot.job_title} — {slot.organization_name}</p>
            <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
              <span>{TYPE_LABELS[slot.interview_type] || slot.interview_type}</span>
              {slot.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.location}</span>
              )}
            </div>
            {slot.notes && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800">
                {slot.notes}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">اختر الموعد الأنسب لك:</p>
            <div className="space-y-2">
              {slot.proposed_slots?.map((s, i) => (
                <button key={i} onClick={() => setSelected(s)}
                  className={`w-full text-right p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selected === s
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border hover:border-accent/40 hover:bg-secondary/30"
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected === s ? "border-accent bg-accent" : "border-muted-foreground"
                  }`}>
                    {selected === s && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm font-medium">{formatDate(s)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">لاحقاً</Button>
          <Button onClick={handleConfirm} disabled={!selected || loading} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الموعد"}
          </Button>
        </div>
      </div>
    </div>
  );
}