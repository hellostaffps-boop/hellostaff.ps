import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import PageHeader from "@/components/PageHeader";
import { Loader2, Activity } from "lucide-react";

export default function AdminActionLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-action-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_actions_log')
        .select('*, admin:profiles!admin_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="سجل حركات الإدارة (Audit Logs)" 
        description="تتبع جميع العمليات والتغييرات التي قام بها مدراء النظام"
      />

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">لا توجد حركات مسجلة</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">المدير</th>
                  <th className="px-6 py-4">نوع الحركة</th>
                  <th className="px-6 py-4">الهدف</th>
                  <th className="px-6 py-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {log.admin?.full_name || log.admin?.email || 'مدير النظام'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.target_type} ({log.target_id?.substring(0,8)}...)
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
