import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/lib/supabaseAuth";
import { broadcastNotificationAdmin } from "@/lib/adminService";
import { 
  Send, 
  Users, 
  User, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminBroadcast() {
  const { t, isRTL } = useLanguage();
  const { userProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetRole: "all"
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await broadcastNotificationAdmin(userProfile, formData);
      setResult(res);
      setFormData({ title: "", message: "", targetRole: formData.targetRole });
      toast.success(t("notifications", "broadcastSuccess").replace("{count}", res.count));
    } catch (error) {
      console.error("[AdminBroadcast]", error);
      toast.error(isRTL ? "فشل إرسال الرسالة" : "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("notifications", "broadcastTitle")}</h1>
        <p className="text-muted-foreground">{t("notifications", "broadcastSubtext")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              {t("notifications", "broadcastDetails")}
            </CardTitle>
            <CardDescription>
              {t("notifications", "broadcastWarning")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? "الفئة المستهدفة" : "Target Audience"}</label>
              <Select 
                value={formData.targetRole} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, targetRole: val }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{t("notifications", "targetAll")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="candidate">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{t("notifications", "targetCandidates")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="employer">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{t("notifications", "targetEmployers")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("notifications", "messageTitle")}</label>
              <Input 
                placeholder={isRTL ? "مثلاً: تحديث جديد في المنصة" : "e.g. New platform update"} 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("notifications", "messageBody")}</label>
              <Textarea 
                placeholder={isRTL ? "اكتب محتوى الرسالة هنا..." : "Type your message content here..."} 
                className="min-h-[120px] resize-none"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-sm text-blue-700">
              <Info className="w-5 h-5 shrink-0" />
              <p>
                {t("notifications", "broadcastNotice")}
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 p-4 flex justify-between items-center">
            {result && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {t("notifications", "broadcastSuccess").replace("{count}", result.count)}
              </div>
            )}
            {!result && <div />}
            <Button type="submit" disabled={loading} className="gap-2 px-8">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t("notifications", "sending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("notifications", "sendBroadcast")}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
