import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/lib/supabaseAuth';
import { getAdminUsersSafe } from '@/lib/adminService';
import { Users, Search, ChevronLeft, ShieldAlert, Eye, Ban, Trash2, X, Phone, MapPin, Briefcase, FileText, CheckCircle, Mail, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ROLE_LABELS = {
  candidate: { ar: 'مرشح', en: 'Candidate', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  employer_owner: { ar: 'صاحب عمل', en: 'Employer', color: 'bg-green-100 text-green-700 border-green-200' },
  employer_manager: { ar: 'مدير توظيف', en: 'Manager', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  platform_admin: { ar: 'مشرف المنصة', en: 'Platform Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const STATUS_LABELS = {
  active: { ar: 'نشط', en: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  pending_approval: { ar: 'قيد المراجعة', en: 'Pending', color: 'bg-amber-100 text-amber-700' },
  suspended: { ar: 'مجمد', en: 'Suspended', color: 'bg-red-100 text-red-700' },
  scheduled_for_deletion: { ar: 'مجدول للحذف', en: 'Expiring', color: 'bg-rose-100 text-rose-700' },
  deleted: { ar: 'محذوف', en: 'Deleted', color: 'bg-gray-100 text-gray-700' },
};

const ALL_ROLES = ['all', 'candidate', 'employer_owner', 'employer_manager', 'platform_admin'];

export default function UsersManagement() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  const { userProfile } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = () => {
    if (!userProfile) return;
    setLoading(true);
    getAdminUsersSafe(userProfile)
      .then(data => setUsers(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [userProfile]);

  const handleStatusUpdate = async (targetUserId, newStatus) => {
    if (newStatus === 'deleted' && !window.confirm(ar ? 'هل أنت متأكد من حذف الحساب؟' : 'Are you sure you want to delete this account?')) return;
    
    setUpdating(targetUserId);
    try {
      const { updateUserStatusAdmin } = await import('@/lib/adminService');
      await updateUserStatusAdmin(userProfile, targetUserId, newStatus);
      fetchUsers();
      if (selectedUser && selectedUser.id === targetUserId) {
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      alert(ar ? "حدث خطأ: تأكد من تشغيل ملف تعديل سياسات الإدارة (SQL)" : "Error: Ensure the Admin RLS SQL script was run.\n" + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') list = list.filter(u => (u.status || 'active') === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, statusFilter, search]);

  const roleCounts = useMemo(() => {
    const c = { all: users.length };
    ALL_ROLES.slice(1).forEach(r => { c[r] = users.filter(u => u.role === r).length; });
    return c;
  }, [users]);

  // Utility to extract extended profile safely
  const getExtendedProfile = (user) => {
    if (user.role === 'candidate') return user.candidate_profiles?.[0] || {};
    if (user.role?.includes('employer')) return user.employer_profiles?.[0] || {};
    return {};
  };

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/dashboard')} className="shrink-0 rounded-xl">
            <ChevronLeft className={`w-5 h-5 ${ar ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ar ? 'إدارة المستخدمين' : 'Users Management'}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {users.length} {ar ? 'مستخدم مسجل في المنصة' : 'registered users'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-2 mb-6 flex flex-col xl:flex-row gap-2">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 overflow-x-auto hide-scroll flex-1">
          {ALL_ROLES.map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-col sm:flex-row ${
                roleFilter === role ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
              }`}
            >
              <span>{role === 'all' ? (ar ? 'كل الأدوار' : 'All Roles') : (ROLE_LABELS[role]?.[ar ? 'ar' : 'en'] || role)}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${roleFilter === role ? 'bg-primary/10 text-primary' : 'bg-background'}`}>
                {roleCounts[role] || 0}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 lg:w-1/3">
          <Search className="absolute ms-3 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ar ? 'البحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
            className="ps-10 h-11 rounded-xl bg-secondary/30 border-transparent focus-visible:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scroll pb-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap me-2">{ar ? 'تصنيف حسب الحالة:' : 'Filter by Status:'}</span>
        {['all', 'pending_approval', 'active', 'suspended', 'scheduled_for_deletion'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
              statusFilter === st ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-white border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {st === 'all' ? (ar ? 'الجميع' : 'All') : (STATUS_LABELS[st]?.[ar ? 'ar' : 'en'] || st)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 text-center bg-red-50/50 rounded-3xl border border-red-100">
          <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
          <p className="font-bold text-destructive text-lg">{ar ? 'فشل تحميل بيانات المستخدمين' : 'Failed to load users'}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-secondary/20 rounded-3xl border border-dashed border-border">
          <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-bold text-lg">{ar ? 'لا يوجد نتائج' : 'No results found'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{ar ? 'حاول تعديل خيارات البحث والفلترة' : 'Try adjusting your search filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filtered.map(user => {
            const roleInfo = ROLE_LABELS[user.role];
            const ext = getExtendedProfile(user);
            const avatar = ext.avatar_url;
            
            return (
              <div key={user.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all hover:border-primary/20 flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shrink-0 border border-border overflow-hidden shadow-sm">
                        {avatar ? (
                          <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base truncate flex items-center gap-2">
                          {user.full_name || '—'}
                          {user.status === 'active' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="text-sm text-muted-foreground truncate font-medium flex items-center gap-1.5 mt-0.5">
                          {ext.title || (user.role === 'candidate' ? (ar ? 'مرشح' : 'Candidate') : (ar ? 'لم يحدد مسمى رظيفي' : 'No title specified'))}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleInfo?.color || 'bg-secondary text-muted-foreground'} whitespace-nowrap`}>
                      {roleInfo?.[ar ? 'ar' : 'en'] || user.role}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 truncate" title={user.email}>
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{ext.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{ext.city || '—'}</span>
                    </div>
                    {user.created_at && (
                      <div className="flex items-center gap-2 truncate text-muted-foreground/80">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{new Date(user.created_at).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-secondary/10 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 px-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_LABELS[user.status || 'active']?.color.split(' ')[0]}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${STATUS_LABELS[user.status || 'active']?.color.split(' ')[1]}`}>
                      {STATUS_LABELS[user.status || 'active']?.[ar ? 'ar' : 'en']}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-medium px-4 bg-white shadow-sm hover:border-primary hover:text-primary"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="w-3.5 h-3.5 me-1.5" />
                      {ar ? 'بطاقة البيانات' : 'View Card'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Details Premium Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedUser(null)}>
          <div className="bg-card rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-border/50 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Header Graphics */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary relative">
               <Button variant="white" size="icon" className="absolute top-4 end-4 w-8 h-8 rounded-full bg-white/50 backdrop-blur hover:bg-white border-0" onClick={() => setSelectedUser(null)}>
                 <X className="w-4 h-4 text-black" />
               </Button>
            </div>
            
            <div className="px-6 relative pb-6 flex-1 overflow-y-auto hide-scroll">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mt-6 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 border border-border shadow-md shrink-0">
                  <div className="w-full h-full rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
                    {getExtendedProfile(selectedUser).avatar_url ? (
                        <img src={getExtendedProfile(selectedUser).avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-muted-foreground">{(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:items-end space-y-2">
                  <span className={`inline-flex self-start sm:self-auto text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_LABELS[selectedUser.status || 'active']?.color}`}>
                    {STATUS_LABELS[selectedUser.status || 'active']?.[ar ? 'ar' : 'en']}
                  </span>
                  <div>
                    <span className={`inline-flex self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border ${ROLE_LABELS[selectedUser.role]?.color}`}>
                      {ROLE_LABELS[selectedUser.role]?.[ar ? 'ar' : 'en']}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {selectedUser.full_name || '—'}
                  {selectedUser.status === 'active' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                </h2>
                <p className="text-base text-muted-foreground font-medium">{getExtendedProfile(selectedUser).title || (ar ? 'لا يوجد مسمى وظيفي' : 'No Title')}</p>
                {selectedUser.role === 'candidate' && getExtendedProfile(selectedUser).skills?.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-3">
                     {getExtendedProfile(selectedUser).skills.map(s => (
                       <span key={s} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{s}</span>
                     ))}
                   </div>
                )}
              </div>
              
              <div className="space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/50">
                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-primary"><Mail className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'البريد الإلكتروني' : 'Email'}</div>
                      <div className="font-medium truncate">{selectedUser.email}</div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-amber-500"><Phone className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'رقم الهاتف' : 'Phone'}</div>
                      <div className="font-medium truncate">{getExtendedProfile(selectedUser).phone || '—'}</div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-green-600"><MapPin className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'المنطقة' : 'Location'}</div>
                      <div className="font-medium truncate">{getExtendedProfile(selectedUser).city || '—'}</div>
                   </div>
                 </div>

                 {selectedUser.role === 'candidate' && getExtendedProfile(selectedUser).resume_url && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-blue-600"><FileText className="w-3.5 h-3.5" /></div>
                      <div className="min-w-0 flex-1 truncate">
                         <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'السيرة الذاتية' : 'Resume CV'}</div>
                         <a href={getExtendedProfile(selectedUser).resume_url} target="_blank" rel="noreferrer" className="font-medium truncate text-blue-600 hover:underline">
                           {ar ? 'عرض السيرة الذاتية' : 'View Resume'}
                         </a>
                      </div>
                    </div>
                 )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-secondary/10 border-t border-border flex gap-2 shrink-0">
               {(selectedUser.status === 'pending_approval' || selectedUser.status === 'suspended') && (
                  <Button 
                    disabled={updating === selectedUser.id}
                    onClick={() => handleStatusUpdate(selectedUser.id, 'active')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4 me-2" />
                    {ar ? 'تفعيل الحساب' : 'Activate Account'}
                  </Button>
               )}
               {(selectedUser.status === 'active' || !selectedUser.status) && (
                  <Button 
                    variant="outline"
                    disabled={updating === selectedUser.id}
                    onClick={() => handleStatusUpdate(selectedUser.id, 'suspended')}
                    className="flex-1 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 shadow-sm"
                  >
                    <Ban className="w-4 h-4 me-2" />
                    {ar ? 'تعليق / تجميد' : 'Suspend Account'}
                  </Button>
               )}
               <Button 
                  variant="destructive"
                  disabled={updating === selectedUser.id}
                  onClick={() => handleStatusUpdate(selectedUser.id, 'deleted')}
                  className="px-6 shadow-sm shadow-red-200"
               >
                  <Trash2 className="w-4 h-4 me-2" />
                  {ar ? 'حذف نهائي' : 'Delete'}
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}