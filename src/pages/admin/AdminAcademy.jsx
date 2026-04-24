import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/supabaseAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { getAdminCoursesSafe, upsertAdminCourse, deleteAdminCourse } from "@/lib/adminService";
import { uploadFile } from "@/lib/storageService";
import { Plus, Edit, Trash2, Video, FileText, CheckCircle2, XCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminAcademy() {
  const { userProfile } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => getAdminCoursesSafe(userProfile),
    enabled: !!userProfile && userProfile.role === "platform_admin",
  });

  const upsertMutation = useMutation({
    mutationFn: (data) => upsertAdminCourse(userProfile, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-courses"]);
      setIsEditing(false);
      setCurrentCourse(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminCourse(userProfile, id),
    onSuccess: () => queryClient.invalidateQueries(["admin-courses"]),
  });

  const handleEdit = (course = null) => {
    setCurrentCourse(course || {
      title: "", title_ar: "", description: "", description_ar: "",
      category: "barista", target_audience: "all", instructor_name: "",
      instructor_name_ar: "", duration: "", video_url: "", pdf_url: "",
      thumbnail_url: "", is_published: true
    });
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    upsertMutation.mutate(currentCourse);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingField(field);
      const { file_url } = await uploadFile(file, "academy");
      setCurrentCourse({ ...currentCourse, [field]: file_url });
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
          <h1 className="text-2xl font-bold">{isAr ? "إدارة الأكاديمية" : "Academy Management"}</h1>
          <p className="text-muted-foreground">{isAr ? "إدارة الكورسات والمواد التعليمية" : "Manage courses and educational materials"}</p>
        </div>
        <Button onClick={() => handleEdit()} className="gap-2">
          <Plus className="w-4 h-4" /> {isAr ? "إضافة كورس" : "Add Course"}
        </Button>
      </div>

      {isEditing ? (
        <div className="bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">{currentCourse.id ? (isAr ? "تعديل الكورس" : "Edit Course") : (isAr ? "كورس جديد" : "New Course")}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
                <Input value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} required />
              </div>
              <div>
                <Label>{isAr ? "العنوان (عربي)" : "Title (AR)"}</Label>
                <Input value={currentCourse.title_ar} onChange={e => setCurrentCourse({...currentCourse, title_ar: e.target.value})} />
              </div>
              <div>
                <Label>{isAr ? "التصنيف" : "Category"}</Label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentCourse.category} onChange={e => setCurrentCourse({...currentCourse, category: e.target.value})}>
                  <option value="barista">{isAr ? "باريستا" : "Barista"}</option>
                  <option value="chef">{isAr ? "شيف" : "Chef"}</option>
                  <option value="management">{isAr ? "إدارة" : "Management"}</option>
                  <option value="service">{isAr ? "خدمة عملاء" : "Customer Service"}</option>
                </select>
              </div>
              <div>
                <Label>{isAr ? "الجمهور المستهدف" : "Target Audience"}</Label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentCourse.target_audience} onChange={e => setCurrentCourse({...currentCourse, target_audience: e.target.value})}>
                  <option value="all">{isAr ? "الجميع" : "All"}</option>
                  <option value="workers">{isAr ? "الموظفين" : "Workers"}</option>
                  <option value="employers">{isAr ? "أصحاب العمل" : "Employers"}</option>
                </select>
              </div>
              <div>
                <Label>{isAr ? "المدرب (إنجليزي)" : "Instructor (EN)"}</Label>
                <Input value={currentCourse.instructor_name} onChange={e => setCurrentCourse({...currentCourse, instructor_name: e.target.value})} />
              </div>
              <div>
                <Label>{isAr ? "المدرب (عربي)" : "Instructor (AR)"}</Label>
                <Input value={currentCourse.instructor_name_ar} onChange={e => setCurrentCourse({...currentCourse, instructor_name_ar: e.target.value})} />
              </div>
              <div>
                <Label>{isAr ? "المدة" : "Duration"}</Label>
                <Input placeholder="e.g. 2 hours" value={currentCourse.duration} onChange={e => setCurrentCourse({...currentCourse, duration: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="published" checked={currentCourse.is_published} onChange={e => setCurrentCourse({...currentCourse, is_published: e.target.checked})} className="w-4 h-4" />
                <Label htmlFor="published">{isAr ? "منشور للعامة" : "Published"}</Label>
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "الوصف (إنجليزي)" : "Description (EN)"}</Label>
                <Input value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "الوصف (عربي)" : "Description (AR)"}</Label>
                <Input value={currentCourse.description_ar} onChange={e => setCurrentCourse({...currentCourse, description_ar: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "رابط الفيديو (YouTube/Vimeo أو رفع مباشر)" : "Video URL / Upload"}</Label>
                <div className="flex gap-2 items-center mt-1">
                  <Input value={currentCourse.video_url} onChange={e => setCurrentCourse({...currentCourse, video_url: e.target.value})} placeholder={isAr ? "رابط الفيديو أو ارفعه هنا (أقل من 20MB)..." : "Video URL or upload here..."} className="flex-1" />
                  <label className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer whitespace-nowrap transition-colors">
                    {uploadingField === 'video_url' ? <span className="animate-pulse">{isAr ? "جاري الرفع..." : "Uploading..."}</span> : <><UploadCloud className="w-4 h-4 mr-2 ml-2" /> {isAr ? "رفع ملف" : "Upload File"}</>}
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video_url')} disabled={!!uploadingField} />
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "ملف الكورس (PDF/Slides)" : "Course File (PDF/Slides)"}</Label>
                <div className="flex gap-2 items-center mt-1">
                  <Input value={currentCourse.pdf_url} onChange={e => setCurrentCourse({...currentCourse, pdf_url: e.target.value})} placeholder={isAr ? "رابط الملف أو ارفعه هنا..." : "File URL or upload here..."} className="flex-1" />
                  <label className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer whitespace-nowrap transition-colors">
                    {uploadingField === 'pdf_url' ? <span className="animate-pulse">{isAr ? "جاري الرفع..." : "Uploading..."}</span> : <><UploadCloud className="w-4 h-4 mr-2 ml-2" /> {isAr ? "رفع ملف" : "Upload File"}</>}
                    <input type="file" accept=".pdf,.ppt,.pptx,.zip" className="hidden" onChange={(e) => handleFileUpload(e, 'pdf_url')} disabled={!!uploadingField} />
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>{isAr ? "صورة الغلاف" : "Thumbnail"}</Label>
                <div className="flex gap-2 items-center mt-1">
                  <Input value={currentCourse.thumbnail_url} onChange={e => setCurrentCourse({...currentCourse, thumbnail_url: e.target.value})} placeholder={isAr ? "رابط الصورة أو ارفعها هنا..." : "Image URL or upload here..."} className="flex-1" />
                  <label className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer whitespace-nowrap transition-colors">
                    {uploadingField === 'thumbnail_url' ? <span className="animate-pulse">{isAr ? "جاري الرفع..." : "Uploading..."}</span> : <><UploadCloud className="w-4 h-4 mr-2 ml-2" /> {isAr ? "رفع صورة" : "Upload Image"}</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail_url')} disabled={!!uploadingField} />
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
                  <th className="px-6 py-3 font-medium">{isAr ? "العنوان" : "Title"}</th>
                  <th className="px-6 py-3 font-medium">{isAr ? "القسم" : "Category"}</th>
                  <th className="px-6 py-3 font-medium">{isAr ? "المدرب" : "Instructor"}</th>
                  <th className="px-6 py-3 font-medium text-center">{isAr ? "الحالة" : "Status"}</th>
                  <th className="px-6 py-3 font-medium text-right">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map(course => (
                  <tr key={course.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                        {course.video_url && <Video className="w-3 h-3" />}
                        {course.pdf_url && <FileText className="w-3 h-3" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{course.category}</td>
                    <td className="px-6 py-4">{course.instructor_name || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      {course.is_published 
                        ? <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs"><CheckCircle2 className="w-3 h-3"/> {isAr ? "منشور" : "Published"}</span>
                        : <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs"><XCircle className="w-3 h-3"/> {isAr ? "مخفي" : "Draft"}</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(course.id) }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">{isAr ? "لا يوجد كورسات حالياً." : "No courses found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
