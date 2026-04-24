import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getPlatformSettings, updatePlatformSettings, uploadLogo } from "@/lib/services/settingsService";
import { useSettings } from "@/context/SettingsContext";
import PageHeader from "@/components/PageHeader";
import { Upload, Image as ImageIcon, Save, Loader2, Link2, Palette, Type } from "lucide-react";

export default function AdminBranding() {
  const { lang } = useLanguage();
  const { fetchSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    logo_url: "",
    primary_color: "222 47% 18%",
    accent_color: "38 92% 50%",
    font_family: "Inter",
    facebook_url: "",
    instagram_url: "",
    whatsapp_url: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getPlatformSettings();
    if (data) {
      setFormData({
        logo_url: data.logo_url || "",
        primary_color: data.primary_color || "222 47% 18%",
        accent_color: data.accent_color || "38 92% 50%",
        font_family: data.font_family || "Inter",
        facebook_url: data.facebook_url || "",
        instagram_url: data.instagram_url || "",
        whatsapp_url: data.whatsapp_url || "",
      });
      setPreviewUrl(data.logo_url || "");
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalLogoUrl = formData.logo_url;
      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (uploadedUrl) finalLogoUrl = uploadedUrl;
      }

      const newSettings = {
        ...formData,
        logo_url: finalLogoUrl,
      };

      await updatePlatformSettings(newSettings);
      await fetchSettings(); // Refresh app context
      toast.success(lang === 'ar' ? 'تم حفظ الهوية البصرية بنجاح' : 'Branding settings saved successfully');
    } catch (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={lang === 'ar' ? 'الهوية البصرية للمنصة' : 'Platform Branding'}
        description={lang === 'ar' ? 'تخصيص الشعار، الألوان، وروابط السوشال ميديا للمنصة.' : 'Customize platform logo, colors, and social links.'}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Section */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-lg font-semibold border-b pb-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h3>{lang === 'ar' ? 'الشعار الرئيسي (Logo)' : 'Main Logo'}</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl mb-4 bg-secondary/30 relative overflow-hidden group">
            {previewUrl ? (
              <img src={previewUrl} alt="Platform Logo" className="h-24 object-contain" />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No logo uploaded</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Label htmlFor="logo-upload" className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-white/90">
                <Upload className="w-4 h-4" />
                {lang === 'ar' ? 'تغيير الشعار' : 'Change Logo'}
              </Label>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {lang === 'ar' ? 'يفضل استخدام صيغة PNG بخلفية شفافة وأبعاد متناسبة.' : 'Use a transparent PNG with balanced dimensions.'}
          </p>
        </div>

        {/* Colors & Typography Section */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold border-b pb-2">
            <Palette className="w-5 h-5 text-primary" />
            <h3>{lang === 'ar' ? 'الألوان والخطوط (متقدم)' : 'Colors & Fonts (Advanced)'}</h3>
          </div>
          
          <div>
            <Label className="mb-1 block">{lang === 'ar' ? 'اللون الأساسي (Primary Color - HSL)' : 'Primary Color (HSL)'}</Label>
            <div className="flex gap-2">
              <Input name="primary_color" value={formData.primary_color} onChange={handleInputChange} placeholder="e.g. 222 47% 18%" />
              <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: `hsl(${formData.primary_color})` }} />
            </div>
          </div>
          
          <div>
            <Label className="mb-1 block">{lang === 'ar' ? 'اللون التمييزي (Accent Color - HSL)' : 'Accent Color (HSL)'}</Label>
            <div className="flex gap-2">
              <Input name="accent_color" value={formData.accent_color} onChange={handleInputChange} placeholder="e.g. 38 92% 50%" />
              <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: `hsl(${formData.accent_color})` }} />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">{lang === 'ar' ? 'نوع الخط (Font Family)' : 'Font Family'}</Label>
            <Input name="font_family" value={formData.font_family} onChange={handleInputChange} placeholder="e.g. Inter, Tajawal" className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1">Must be available in Google Fonts or CSS.</p>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-lg font-semibold border-b pb-2">
            <Link2 className="w-5 h-5 text-primary" />
            <h3>{lang === 'ar' ? 'روابط السوشال ميديا' : 'Social Media Links'}</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1 block">Facebook URL</Label>
              <Input name="facebook_url" value={formData.facebook_url} onChange={handleInputChange} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <Label className="mb-1 block">Instagram URL</Label>
              <Input name="instagram_url" value={formData.instagram_url} onChange={handleInputChange} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label className="mb-1 block">WhatsApp URL / Number</Label>
              <Input name="whatsapp_url" value={formData.whatsapp_url} onChange={handleInputChange} placeholder="https://wa.me/..." />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[150px] gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {!saving && <Save className="w-4 h-4" />}
          {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
