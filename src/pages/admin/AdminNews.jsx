import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { getAdminNewsSafe, upsertAdminNews, deleteAdminNews } from "@/lib/adminService";
import { uploadFile } from "@/lib/storageService";
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Newspaper, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminNews() {
  const { userProfile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [currentNews, setCurrentNews] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);

  const { data: newsList = [], isLoading } = useQuery({
    queryKey: ["admin-news"],
    queryFn: () => getAdminNewsSafe(userProfile),
    enabled: !!userProfile && userProfile.role === "platform_admin",
  });

  const upsertMutation = useMutation({
    mutationFn: (data) => upsertAdminNews(userProfile, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-news"]);
      setIsEditing(false);
      setCurrentNews(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminNews(userProfile, id),
    onSuccess: () => queryClient.invalidateQueries(["admin-news"]),
  });

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
  };

  const handleEdit = (newsItem = null) => {
    setCurrentNews(newsItem || {
      title: "", title_ar: "", slug: "", excerpt: "", excerpt_ar: "",
      content: "", content_ar: "", image_url: "", category: "general", 
      status: "published", author_id: userProfile?.id || null
    });
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const dataToSave = { ...currentNews };
    if (!dataToSave.slug) {
      dataToSave.slug = generateSlug(dataToSave.title || "article");
    }
    upsertMutation.mutate(dataToSave);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingField(field);
      const { file_url } = await uploadFile(file, "news");
      setCurrentNews({ ...currentNews, [field]: file_url });
    } catch (err) {
      console.error(err);
      alert(isAr ? "فشل رفع الملف. يرجى المحاولة مرة أخرى." : "File upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "إدارة الأخبار" : "News Management"}</h1>
          <p className="text-muted-foreground">{isAr ? "إضافة وتعديل المقالات والأخبار" : "Add and edit articles and news"}</p>
        </div>
        <Button onClick={() => handleEdit()} className="gap-2">
          <Plus className="w-4 h-4" /> {isAr ? "إضافة مقال" : "Add Article"}
        </Button>
      </div>

      {isEditing ? (
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">{currentNews.id ? (isAr ? "تعديل المقال" : "Edit Article") : (isAr ? "مقال جديد" : "New Article")}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
                <Input value={currentNews.title} onChange={e => setCurrentNews({...currentNews, title: e.target.value})} required />
              </div>
              <div>
                <Label>{isAr ? "العنوان (عربي)" : "Title (AR)"}</Label>
                <Input value={currentNews.title_ar} onChange={e => setCurrentNews({...currentNews, title_ar: e.target.value})} />
              </div>

              <div>
                <Label>{isAr ? "القسم" : "Category"}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentNews.category} onChange={e => setCurrentNews({...currentNews, category: e.target.value})}>
                  <option value="general">{isAr ? "عام" : "General"}</option>
                  <option value="tips">{isAr ? "نصائح" : "Tips"}</option>
                  <option value="announcements">{isAr ? "إعلانات المنصة" : "Announcements"}</option>
                </select>
              </div>
              <div>
                <Label>{isAr ? "حالة النشر" : "Status"}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentNews.status} onChange={e => setCurrentNews({...currentNews, status: e.target.value})}>
                  <option value="published">{isAr ? "منشور" : "Published"}</option>
                  <option value="draft">{isAr ? "مسودة" : "Draft"}</option>
                  <option value="archived">{isAr ? "مؤرشف" : "Archived"}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>{isAr ? "ملخص قصير (إنجليزي)" : "Excerpt (EN)"}</Label>
                <Input value={currentNews.excerpt} onChange={e => setCurrentNews({...currentNews, excerpt: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "ملخص قصير (عربي)" : "Excerpt (AR)"}</Label>
                <Input value={currentNews.excerpt_ar} onChange={e => setCurrentNews({...currentNews, excerpt_ar: e.target.value})} />
              </div>

              <div className="sm:col-span-2">
                <Label>{isAr ? "المحتوى (إنجليزي)" : "Content (EN)"}</Label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentNews.content} onChange={e => setCurrentNews({...currentNews, content: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "المحتوى (عربي)" : "Content (AR)"}</Label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentNews.content_ar} onChange={e => setCurrentNews({...currentNews, content_ar: e.target.value})}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>{isAr ? "صورة الغلاف" : "Cover Image"}</Label>
                <div className="flex gap-2 items-center mt-1">
                  <Input value={currentNews.image_url} onChange={e => setCurrentNews({...currentNews, image_url: e.target.value})} placeholder={isAr ? "رابط الصورة أو ارفعها هنا..." : "Image URL or upload here..."} className="flex-1" />
                  <label className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer whitespace-nowrap transition-colors">
                    {uploadingField === 'image_url' ? <span className="animate-pulse">{isAr ? "جاري الرفع..." : "Uploading..."}</span> : <><UploadCloud className="w-4 h-4 mr-2 ml-2" /> {isAr ? "رفع صورة" : "Upload Image"}</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image_url')} disabled={!!uploadingField} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>{isAr ? "حفظ" : "Save"}</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">{isAr ? "المقال" : "Article"}</th>
                  <th className="px-6 py-3 font-medium">{isAr ? "القسم" : "Category"}</th>
                  <th className="px-6 py-3 font-medium text-center">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-6 py-3 font-medium text-right">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {newsList.map(news => (
                  <tr key={news.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {news.image_url ? (
                        <img src={news.image_url} className="w-10 h-10 rounded object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center"><Newspaper className="w-5 h-5 text-muted-foreground"/></div>
                      )}
                      <div>
                        <div className="font-medium">{news.title}</div>
                        <div className="text-xs text-muted-foreground">{new Date(news.created_at).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{news.category}</td>
                    <td className="px-6 py-4 text-center">
                      {news.status === 'published'
                        ? <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs"><CheckCircle2 className="w-3 h-3"/> {isAr ? "منشور" : "Published"}</span>
                        : <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs"><XCircle className="w-3 h-3"/> {isAr ? "مسودة/مؤرشف" : "Draft/Arch"}</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(news)}>
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(news.id) }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {newsList.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-8 text-muted-foreground">{isAr ? "لا يوجد مقالات حالياً." : "No news found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
