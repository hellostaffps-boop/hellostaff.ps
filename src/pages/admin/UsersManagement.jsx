import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import { getAdminToken } from '@/lib/adminSessionManager';
import { Users, Search, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ROLE_LABELS = {
  candidate: { ar: 'مرشح', en: 'Candidate', color: 'bg-blue-100 text-blue-700' },
  employer_owner: { ar: 'صاحب عمل', en: 'Employer', color: 'bg-green-100 text-green-700' },
  employer_manager: { ar: 'مدير توظيف', en: 'Manager', color: 'bg-teal-100 text-teal-700' },
  platform_admin: { ar: 'مشرف المنصة', en: 'Platform Admin', color: 'bg-purple-100 text-purple-700' },
};

const ALL_ROLES = ['all', 'candidate', 'employer_owner', 'employer_manager', 'platform_admin'];

export default function UsersManagement() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const token = getAdminToken();
    base44.functions.invoke('getAdminUsers', { session_token: token })
      .then(res => setUsers(res.data?.users || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, search]);

  const roleCounts = useMemo(() => {
    const c = { all: users.length };
    ALL_ROLES.slice(1).forEach(r => { c[r] = users.filter(u => u.role === r).length; });
    return c;
  }, [users]);

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="shrink-0">
          <ChevronLeft className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{ar ? 'إدارة المستخدمين' : 'Users Management'}</h1>
          <p className="text-sm text-muted-foreground">{users.length} {ar ? 'مستخدم' : 'users'}</p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-4 overflow-x-auto">
        {ALL_ROLES.map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === role ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {role === 'all' ? (ar ? 'الجميع' : 'All') : (ROLE_LABELS[role]?.[ar ? 'ar' : 'en'] || role)}
            <span className="text-[10px] bg-background px-1 py-0.5 rounded-full">{roleCounts[role] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ar ? 'البحث بالاسم أو البريد...' : 'Search by name or email...'}
          className="ps-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 text-center">
          <ShieldAlert className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{ar ? 'خطأ في تحميل البيانات' : 'Error loading data'}</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Users className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{ar ? 'لا يوجد مستخدمون' : 'No users found'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const roleInfo = ROLE_LABELS[user.role];
            return (
              <div key={user.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-semibold">
                      {(user.full_name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{user.full_name || '—'}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      {user.created_date && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ar ? 'انضم: ' : 'Joined: '}{new Date(user.created_date).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {roleInfo ? (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                        {roleInfo[ar ? 'ar' : 'en']}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{user.role || 'unknown'}</span>
                    )}
                  </div>
                </div>
                {/* Admin note: sensitive actions require backend privileged function */}
                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {ar ? 'الإجراءات الحساسة تتطلب تفعيل Cloud Function' : 'Sensitive actions require Cloud Function activation'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}