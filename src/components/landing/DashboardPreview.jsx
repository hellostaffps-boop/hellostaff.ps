import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users } from "lucide-react";

const pieData = [
  { name: "Hired", value: 35, color: "#10b981" },
  { name: "Interview", value: 25, color: "#f59e0b" },
  { name: "Pending", value: 40, color: "#6366f1" },
];

const barData = [
  { day: "M", views: 240 },
  { day: "T", views: 320 },
  { day: "W", views: 450 },
  { day: "T", views: 180 },
  { day: "F", views: 600 },
];

const applicants = [
  { name: "Ahmad K.", role: "Chef", status: "interview", avatar: "A" },
  { name: "Sara S.", role: "Manager", status: "pending", avatar: "S" },
  { name: "Noor M.", role: "Waiter", status: "hired", avatar: "N" },
];

const STYLES = {
  interview: "bg-amber-100 text-amber-700",
  pending: "bg-indigo-100 text-indigo-700",
  hired: "bg-emerald-100 text-emerald-700",
};

export default function DashboardPreview() {
  return (
    <div className="w-full h-full p-5 flex flex-col gap-5 select-none bg-white relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">H</div>
          <div>
            <div className="text-xs font-bold text-foreground">Employer Hub</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </div>
          </div>
        </div>
        <Users className="w-5 h-5 text-muted-foreground/30" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Applicant List */}
        <div className="col-span-1 sm:col-span-7 bg-secondary/30 rounded-2xl p-3 sm:p-4 border border-border/50 overflow-hidden">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between">
            Recent Applicants
            <span className="text-accent cursor-pointer hover:underline text-[8px] sm:text-[10px]">View All</span>
          </div>
          <div className="space-y-2 sm:space-y-2.5">
            {applicants.map((app, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white rounded-xl p-2 sm:p-2.5 shadow-sm border border-border/40 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-muted-foreground shrink-0">
                    {app.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-bold truncate">{app.name}</div>
                    <div className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{app.role}</div>
                  </div>
                </div>
                <div className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase shrink-0 ${STYLES[app.status]}`}>
                  {app.status}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Analytics */}
        <div className="col-span-1 sm:col-span-5 flex flex-row sm:flex-col gap-3 sm:gap-4">
          <div className="flex-1 bg-white rounded-2xl p-2 sm:p-3 border border-border/50 shadow-sm flex flex-col items-center justify-center min-h-0">
            <div className="text-[8px] sm:text-[9px] font-bold uppercase text-muted-foreground mb-1">Pipeline</div>
            <div className="w-full h-16 sm:h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={18} outerRadius={28} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex-1 bg-primary text-white rounded-2xl p-2 sm:p-3 shadow-lg shadow-primary/10 flex flex-col min-h-0">
            <div className="text-[8px] sm:text-[9px] font-bold uppercase opacity-60 mb-1 sm:mb-2 text-center sm:text-start">Views</div>
            <div className="w-full h-12 sm:h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <Bar dataKey="views" fill="#FBBC05" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative floating dots */}
      <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-accent/10 rounded-full blur-2xl" />
    </div>
  );
}
