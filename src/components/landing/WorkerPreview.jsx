import { motion } from "framer-motion";
import { Star, MapPin, CheckCircle2, Search, Bell } from "lucide-react";

export default function WorkerPreview() {
  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 select-none bg-white relative overflow-hidden">
      {/* Search Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <div className="h-4 w-24 bg-muted-foreground/10 rounded animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-accent" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </div>
      </div>

      {/* Main Job Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        className="bg-white border-2 border-accent/20 rounded-[1.5rem] p-5 shadow-xl shadow-accent/5 relative z-10"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black">H</div>
            <div>
              <h4 className="font-bold text-sm">Fine Dining Waiter</h4>
              <p className="text-xs text-muted-foreground">Sesar Hotel • Ramallah</p>
            </div>
          </div>
          <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">New</div>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Star className="w-4 h-4 text-accent fill-accent" />
            4.9
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-4 h-4" />
            2.5 km away
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
          <div className="text-lg font-black text-primary">₪3000<span className="text-xs font-normal text-muted-foreground">/hr</span></div>
          <button className="bg-accent text-primary px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
            Apply Now
          </button>
        </div>
      </motion.div>

      {/* Status Progress */}
      <div className="mt-2 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
          Application Status
          <span className="text-accent">Shortlisted</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "75%" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-full bg-accent"
          />
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/2 -right-4 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      <CheckCircle2 className="absolute bottom-6 right-6 w-12 h-12 text-accent opacity-10" />
    </div>
  );
}
