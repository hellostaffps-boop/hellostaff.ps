import { cn } from "@/lib/utils";

export default function SkeletonCard({ className }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-6 overflow-hidden relative", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5 z-10" />
      
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-muted rounded-md animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>

      <div className="space-y-2 mt-6">
        <div className="h-3 w-full bg-muted rounded-full animate-pulse" />
        <div className="h-3 w-4/5 bg-muted rounded-full animate-pulse" />
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-border">
        <div className="h-4 w-1/4 bg-muted rounded-md animate-pulse" />
        <div className="h-4 w-1/4 bg-muted rounded-md animate-pulse" />
      </div>
    </div>
  );
}
