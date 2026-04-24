import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { getPublishedCourses } from "@/lib/academyService";
import { PlayCircle, FileText, Clock, User, BookOpen } from "lucide-react";

export default function Academy() {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: () => getPublishedCourses(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-24" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-primary pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <BookOpen className="w-12 h-12 text-primary-foreground/80 mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight mb-4">
            {t("academy", "title")}
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            {t("academy", "description")}
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        {courses.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("academy", "noCourses")}</h3>
            <p className="text-muted-foreground">{t("academy", "noCoursesDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-accent/40 transition-all group flex flex-col">
                <div className="h-48 bg-secondary relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <PlayCircle className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-medium px-2.5 py-1 rounded-full shadow-sm capitalize">
                    {course.category}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {isAr ? course.title_ar || course.title : course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {isAr ? course.description_ar || course.description : course.description}
                  </p>
                  
                  <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                    {course.instructor_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{isAr ? course.instructor_name_ar || course.instructor_name : course.instructor_name}</span>
                      </div>
                    )}
                    {course.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                    {course.video_url && (
                      <a href={course.video_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-primary text-primary-foreground text-center py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <PlayCircle className="w-4 h-4" /> {t("academy", "watchCourse")}
                      </a>
                    )}
                    {course.pdf_url && (
                      <a href={course.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-secondary text-secondary-foreground text-center py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" /> {t("academy", "downloadPDF")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
