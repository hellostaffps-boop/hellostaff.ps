import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { getNewsArticleById, getArticleComments, addArticleComment, getArticleLikes, toggleArticleLike } from "@/lib/supabaseService";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Share2, Calendar, User, Clock, Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabaseAuth";

const NewsArticle = () => {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { t, lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Social state
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const data = await getNewsArticleById(slugOrId);
        if (!data) {
          navigate("/news");
          return;
        }
        setArticle(data);
        
        // Fetch social data in parallel
        if (data.id) {
          const [likesData, commentsData] = await Promise.all([
            getArticleLikes(data.id, user?.id),
            getArticleComments(data.id)
          ]);
          setLikesCount(likesData.count);
          setHasLiked(likesData.hasLiked);
          setComments(commentsData);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchArticle();
    window.scrollTo(0, 0);
  }, [slugOrId, navigate]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", {
        locale: isRTL ? ar : enUS,
      });
    } catch {
      return dateString;
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: isRTL && article?.title_ar ? article.title_ar : article?.title,
          text: isRTL && article?.excerpt_ar ? article.excerpt_ar : article?.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert(isRTL ? "تم نسخ الرابط!" : "Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      navigate('/auth/login', { state: { returnTo: window.location.pathname } });
      return;
    }
    if (likeLoading) return;
    
    setLikeLoading(true);
    // Optimistic UI update
    setHasLiked(!hasLiked);
    setLikesCount(prev => hasLiked ? prev - 1 : prev + 1);
    
    try {
      await toggleArticleLike(article.id, user.id, hasLiked);
    } catch (error) {
      // Revert on error
      setHasLiked(hasLiked);
      setLikesCount(prev => hasLiked ? prev + 1 : prev - 1);
    } finally {
      setLikeLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      await addArticleComment(article.id, user.id, newComment.trim());
      setNewComment("");
      // Refresh comments
      const updatedComments = await getArticleComments(article.id);
      setComments(updatedComments);
    } catch (error) {
      alert(isRTL ? "حدث خطأ أثناء إضافة التعليق" : "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-24 bg-muted rounded"></div>
          <div className="h-12 w-3/4 bg-muted rounded"></div>
          <div className="flex gap-4">
            <div className="h-8 w-32 bg-muted rounded"></div>
            <div className="h-8 w-32 bg-muted rounded"></div>
          </div>
          <div className="h-96 w-full bg-muted rounded-2xl my-8"></div>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-5/6 bg-muted rounded"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const title = isRTL && article.title_ar ? article.title_ar : article.title;
  const content = isRTL && article.content_ar ? article.content_ar : article.content;

  return (
    <div className="min-h-screen bg-app-bg text-foreground pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8 -ml-4 px-4 text-muted-foreground hover:text-foreground">
          <Link to="/news">
            {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
            {t("latestNews", "viewAll")}
          </Link>
        </Button>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium uppercase tracking-wider">
            {article.category || "General"}
          </span>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5" />
            {formatDate(article.published_at)}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1.5" />
            {Math.max(1, Math.ceil(content.split(" ").length / 200))} {isRTL ? "دقائق للقراءة" : "min read"}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight">
          {title}
        </h1>

        {/* Author & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-y border-border mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {article.author?.avatar_url ? (
                <img src={article.author.avatar_url} alt="Author" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">{article.author?.full_name || (isRTL ? "فريق هيلو ستاف" : "Hello Staff Team")}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? "الكاتب" : "Author"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleLike} 
              className={`rounded-full transition-colors ${hasLiked ? 'border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${hasLiked ? 'fill-destructive' : ''}`} />
              {likesCount} {isRTL ? "إعجاب" : "Likes"}
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full">
              <Share2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? "مشاركة" : "Share"}
            </Button>
          </div>
        </div>

        {/* Image */}
        {(article.image_url) && (
          <div className="rounded-2xl overflow-hidden mb-12 shadow-2xl">
            <img 
              src={article.image_url} 
              alt={title}
              className="w-full h-auto object-cover max-h-[600px]"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 mb-16">
          {content.split('\n').map((paragraph, index) => {
            if (!paragraph.trim()) return null;
            return <p key={index} className="mb-6 leading-relaxed text-foreground/90">{paragraph}</p>;
          })}
        </div>
        
        {/* Comments Section */}
        <div className="border-t border-border pt-12">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            {isRTL ? "التعليقات" : "Comments"} ({comments.length})
          </h3>
          
          {user ? (
            <form onSubmit={handlePostComment} className="mb-10 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isRTL ? "أضف تعليقاً..." : "Add a comment..."}
                className="w-full bg-card border border-border rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-y"
                required
              />
              <div className={`mt-3 flex justify-end`}>
                <Button 
                  type="submit" 
                  disabled={submittingComment || !newComment.trim()}
                  className="rounded-full"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {isRTL ? "نشر التعليق" : "Post Comment"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-muted/50 border border-border rounded-xl p-6 mb-10 text-center">
              <p className="text-muted-foreground mb-4">
                {isRTL ? "يجب تسجيل الدخول لإضافة تعليق والتفاعل مع المقالة." : "You must be logged in to post a comment."}
              </p>
              <Button asChild>
                <Link to="/auth/login" state={{ returnTo: window.location.pathname }}>
                  {isRTL ? "تسجيل الدخول" : "Log In"}
                </Link>
              </Button>
            </div>
          )}
          
          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.comment_id} className="flex gap-4 p-5 bg-card/40 border border-border/50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {comment.avatar_url ? (
                      <img src={comment.avatar_url} alt={comment.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">{comment.full_name || (isRTL ? "مستخدم" : "User")}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {comment.role && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-2">
                        {comment.role === "candidate" ? (isRTL ? "مرشح" : "Candidate") : (isRTL ? "صاحب عمل" : "Employer")}
                      </span>
                    )}
                    <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{isRTL ? "لا توجد تعليقات بعد. كن أول من يعلق!" : "No comments yet. Be the first to comment!"}</p>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default NewsArticle;
