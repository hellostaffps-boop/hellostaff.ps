import { useState, useRef } from "react";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar, uploadResume, uploadLogo, uploadCover } from "@/lib/storageService";

/**
 * FileUpload — Reusable file upload component with preview.
 * @param {string} type - "avatar" | "resume" | "logo" | "cover"
 * @param {string} currentUrl - current file URL for preview
 * @param {function} onUploaded - callback(url) after successful upload
 * @param {boolean} isAr - Arabic mode
 */
export default function FileUpload({ type = "avatar", currentUrl, onUploaded, isAr = false, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);
  const inputRef = useRef(null);

  const isImage = type === "avatar" || type === "logo" || type === "cover";
  const accept = isImage ? "image/jpeg,image/png,image/webp" : ".pdf,.doc,.docx";
  const maxSize = isImage ? 5 : 20; // MB

  const labels = {
    avatar: { ar: "صورة شخصية", en: "Profile Photo" },
    resume: { ar: "السيرة الذاتية (PDF)", en: "Resume (PDF)" },
    logo: { ar: "شعار الشركة", en: "Company Logo" },
    cover: { ar: "صورة الغلاف", en: "Cover Image" },
  };

  const uploadFns = { avatar: uploadAvatar, resume: uploadResume, logo: uploadLogo, cover: uploadCover };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(isAr ? `الملف كبير جداً (الحد ${maxSize}MB)` : `File too large (max ${maxSize}MB)`);
      return;
    }

    // Preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    try {
      const fn = uploadFns[type] || uploadAvatar;
      const result = await fn(file);
      setPreview(result.file_url);
      onUploaded?.(result.file_url);
      toast.success(isAr ? "تم الرفع بنجاح!" : "Uploaded successfully!");
    } catch (err) {
      console.error("[FileUpload]", err);
      toast.error(isAr ? "فشل رفع الملف" : "Upload failed");
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploaded?.("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
        {labels[type]?.[isAr ? "ar" : "en"] || type}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          id={`upload-${type}`}
        />

        {preview && isImage ? (
          <div className="relative group">
            <img
              src={preview}
              alt=""
              className={`object-cover rounded-xl border border-border ${
                type === "avatar" ? "w-24 h-24 rounded-full" :
                type === "logo" ? "w-24 h-24" :
                "w-full h-32"
              }`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-1.5 bg-white/90 rounded-lg hover:bg-white"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 bg-white/90 rounded-lg hover:bg-white"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}
          </div>
        ) : preview && !isImage ? (
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border">
            <FileText className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{isAr ? "ملف مرفوع" : "File uploaded"}</p>
              <a href={preview} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">
                {isAr ? "عرض" : "View"}
              </a>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => inputRef.current?.click()} className="p-1 hover:bg-secondary rounded">
                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button type="button" onClick={handleRemove} className="p-1 hover:bg-secondary rounded">
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl hover:border-accent/40 hover:bg-accent/5 transition-all ${
              type === "avatar" ? "w-24 h-24 rounded-full" :
              type === "logo" ? "w-24 h-24" :
              "w-full h-32"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {isImage ? <Image className="w-5 h-5 text-muted-foreground" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground">{isAr ? "اختر ملف" : "Choose file"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
