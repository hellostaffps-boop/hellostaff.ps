export default function StatsCard({ icon: Icon, label, value, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 p-4 sm:p-6 modern-shadow transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </div>
        {trend && (
          <span className={`text-[10px] sm:text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-500"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}