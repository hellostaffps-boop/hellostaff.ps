import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquareQuote, Star, Loader2, Send } from "lucide-react";

export default function TestimonialSubmitBox({ userProfile, isAr }) {
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!quote.trim()) {
      toast.error(isAr ? "يرجى كتابة رأيك أولاً" : "Please write your testimonial first");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("platform_testimonials").insert({
        user_id: userProfile.id,
        quote: quote.trim(),
        rating,
        is_featured: false // By default, it needs admin approval to be featured
      });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success(isAr ? "تم إرسال رأيك بنجاح، شكراً لك!" : "Testimonial submitted successfully, thank you!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 text-emerald-800 rounded-2xl p-6 text-center border border-emerald-100 flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600">
          <MessageSquareQuote className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-lg mb-1">{isAr ? "شكراً لمشاركتك رأيك!" : "Thank you for your feedback!"}</h3>
        <p className="text-sm opacity-90">
          {isAr ? "سنقوم بمراجعة تقييمك وقد نعرضه على صفحتنا الرئيسية." : "We will review your testimonial and might feature it on our homepage."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-accent/5 to-transparent rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0">
          <MessageSquareQuote className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold">{isAr ? "شاركنا رأيك في المنصة" : "Share your platform experience"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "رأيك يهمنا ويساعدنا على تقديم خدمة أفضل." : "Your feedback matters and helps us improve."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold mb-2 block text-muted-foreground">{isAr ? "التقييم" : "Rating"}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
           <Textarea 
             placeholder={isAr ? "اكتب تجربتك أو رأيك بخدماتنا هنا..." : "Write your experience or opinion here..."}
             value={quote}
             onChange={(e) => setQuote(e.target.value)}
             rows={3}
             className="resize-none border-border/50 focus-visible:ring-accent"
           />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !quote.trim()} 
          className="w-full sm:w-auto bg-accent hover:bg-accent/90"
        >
          {isSubmitting ? (
             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
             <Send className={`w-4 h-4 ${isAr ? 'ml-2 -scale-x-100' : 'mr-2'}`} />
          )}
          {isAr ? "إرسال التقييم" : "Submit Testimonial"}
        </Button>
      </div>
    </div>
  );
}
