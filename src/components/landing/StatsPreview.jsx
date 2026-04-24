import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Briefcase, Building2, TrendingUp } from "lucide-react";

const mockData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 700 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 1200 },
  { name: "May", value: 1500 },
  { name: "Jun", value: 2400 },
];

export default function StatsPreview() {
  return (
    <div className="w-full h-full p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-accent text-[9px] sm:text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse" />
            Live Analytics
          </div>
          <h3 className="text-white text-base sm:text-lg font-bold truncate">Platform Growth</h3>
        </div>
        <div className="bg-accent/10 border border-accent/20 rounded-lg px-2 sm:px-3 py-1 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-accent" />
          <span className="text-accent text-[10px] sm:text-xs font-bold">+124%</span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="flex-1 min-h-[150px] sm:min-h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBC05" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#FBBC05" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: "#020817", border: "1px solid rgba(251, 188, 5, 0.2)", borderRadius: "8px", fontSize: "10px" }}
              itemStyle={{ color: "#FBBC05" }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#FBBC05" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: Users, label: "Users", val: "8.5k", color: "text-blue-400" },
          { icon: Building2, label: "Hotels", val: "1.2k", color: "text-accent" },
          { icon: Briefcase, label: "Jobs", val: "2.4k", color: "text-green-400" },
        ].map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-3 flex flex-col items-center gap-1 hover:bg-white/10 transition-colors"
          >
            <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
            <div className="text-white font-bold text-xs sm:text-sm">{s.val}</div>
            <div className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent rounded-[2rem]" />
    </div>
  );
}
