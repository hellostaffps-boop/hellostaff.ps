import { useState } from "react";
import { X, Plus, Trash2, CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { proposeInterviewSlots } from "@/lib/interviewSlotService";

const TYPE_LABELS = { in_person: "حضوري", online: "عبر الإنترنت", phone: "هاتفي" };

export default function ProposeInterviewSlotsModal({ application, employerEmail, organizationId, organizationName, onClose, onSuccess }) {
  const [slots, setSlots] = useState([""]);
  const [location, setLocation] = useState("");
  const [interviewType, setInterviewType] = useState("in_person");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const addSlot = () => setSlots((s) => [...s, ""]);
  const removeSlot = (i) => setSlots((s) => s.filter((_, idx) => idx !== i));
  const setSlot = (i, v) => setSlots((s) => s.map((x, idx) => idx === i ? v : x));

  const handleSubmit = async () => {
    const validSlots = slots.filter(Boolean);
    if (validSlots.length === 0) { toast.error("أضف موعداً واحداً على الأقل"); return; }
    setLoading(true);
    await proposeInterviewSlots({
      applicationId: application.id,
      organizationId,
      candidateEmail: application.candidate_email,
      candidateName: application.candidate_name,
      employerEmail,
      jobTitle: application.job_title,
      organizationName,
      proposedSlots: validSlots,
      location,
      interviewType,
      notes,
    });
    toast.success("تم إرسال المواعيد المقترحة للمرشح");
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
            <h2 className="font-bold text-base">اقتراح مواعيد للمقابلة</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            اقترح مواعيد متعددة للمرشح <strong>{application.candidate_name || application.candidate_email}</strong> ليختار الأنسب له.
          </p>

          {/* Slots */}
          <div>
            <label className="text-sm font-medium block mb-2">المواعيد المقترحة *</label>
            <div className="space-y-2">
              {slots.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={s}
                    onChange={(e) => setSlot(i, e.target.value)}
                    className="flex-1 text-sm"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {slots.length > 1 && (
                    <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addSlot} className="mt-2 flex items-center gap-1.5 text-sm text-accent hover:underline">
              <Plus className="w-3.5 h-3.5" /> إضافة موعد آخر
            </button>
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium block mb-2">نوع المقابلة</label>
            <div className="flex gap-2">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => setInterviewType(k)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${interviewType === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium block mb-1.5">الموقع / الرابط</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder={interviewType === "online" ? "رابط Google Meet / Zoom" : "العنوان"}
              className="text-sm" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5">ملاحظات للمرشح (اختياري)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="أي تعليمات أو معلومات إضافية..."
              className="w-full text-sm border border-input rounded-md px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال المواعيد"}
          </Button>
        </div>
      </div>
    </div>
  );
}