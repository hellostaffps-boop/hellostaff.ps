import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/lib/supabaseAuth';
import { getPlatformAdminsSafe, grantAdminAccess, updateAdminPermissions, revokeAdminAccess } from '@/lib/adminService';
import { ShieldAlert, Users, Search, ChevronLeft, ShieldCheck, UserPlus, Settings2, X, Trash2, Mail, ExternalLink, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const PERMISSION_LABELS = {
  can_manage_users: { ar: 'إدارة المستخدمين', en: 'Manage Users' },
  can_manage_organizations: { ar: 'إدارة الشركات', en: 'Manage Organizations' },
  can_manage_payments: { ar: 'إدارة المدفوعات', en: 'Manage Payments' },
  can_manage_admins: { ar: 'إدارة المشرفين', en: 'Manage Admins' },
  can_manage_testimonials: { ar: 'إدارة التقييمات', en: 'Manage Testimonials' },
};

export default function AdminsManagement() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const ar = lang === 'ar';

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAdmins = () => {
    if (!userProfile) return;
    setLoading(true);
    getPlatformAdminsSafe(userProfile)
      .then(data => setAdmins(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, [userProfile]);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    setIsProcessing(true);
    try {
      await grantAdminAccess(userProfile, newAdminEmail.trim());
      setNewAdminEmail('');
      setIsAddingAdmin(false);
      fetchAdmins();
    } catch (e) {
      alert(ar ? "حدث خطأ: تأكد من تشغيل ملف سياسات المشرفين (SQL) أو البريد غير صحيح.\n" + e.message : "Error: Ensure SQL is run or invalid email.\n" + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePermission = async (permissionKey, currentValue) => {
    if (!selectedAdmin) return;
    // Don't allow self-demotion from managing admins unless confirmed natively, but prevent here mostly
    if (selectedAdmin.id === userProfile.id && permissionKey === 'can_manage_admins') {
      if (!window.confirm(ar ? "تحذير: هل أنت متأكد من إزالة صلاحيتك في إدارة المشرفين؟ لن تتمكن من التراجع." : "WARNING: This removes your ability to manage admins. Proceed?")) return;
    }

    try {
      const newPermissions = {
        [permissionKey]: !currentValue,
      };
      await updateAdminPermissions(userProfile, selectedAdmin.id, newPermissions);
      
      const updatedAdminPermissions = selectedAdmin.admin_permissions?.[0] || {};
      const newAdminObj = {
        ...selectedAdmin,
        admin_permissions: [{ ...updatedAdminPermissions, ...newPermissions }]
      };
      
      setSelectedAdmin(newAdminObj);
      setAdmins(prev => prev.map(a => a.id === selectedAdmin.id ? newAdminObj : a));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRevoke = async (targetAdminId) => {
    if (!window.confirm(ar ? 'هل أنت متأكد من إزالة كافة الصلاحيات وتحويله لمستخدم عادي؟' : 'Are you sure you want to revoke admin access?')) return;
    
    setIsProcessing(true);
    try {
      await revokeAdminAccess(userProfile, targetAdminId);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = useMemo(() => {
    let list = admins;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.full_name || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [admins, search]);

  const hasAdminManagePerm = useMemo(() => {
    if (!userProfile) return false;
    const me = admins.find(a => a.id === userProfile.id);
    if (!me) return true; // If not loaded yet, assume yes until backend blocks
    if (me.admin_permissions?.length > 0) {
      return me.admin_permissions[0].can_manage_admins;
    }
    return true; // Default main admin
  }, [userProfile, admins]);

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/dashboard')} className="shrink-0 rounded-xl">
            <ChevronLeft className={`w-5 h-5 ${ar ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ar ? 'إدارة المشرفين والصلاحيات' : 'Admins Management'}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               {admins.length} {ar ? 'حساب مشرف (سوبر و فرعي)' : 'Admin accounts'}
            </p>
          </div>
        </div>

        {hasAdminManagePerm && (
          <Button onClick={() => setIsAddingAdmin(true)} className="rounded-full shadow-md bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
            <UserPlus className="w-4 h-4 me-2" />
            {ar ? 'إضافة مشرف جديد' : 'Add New Admin'}
          </Button>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-2 mb-6 flex items-center gap-2 w-full lg:w-1/2">
        <Search className="absolute ms-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ar ? 'البحث بالاسم أو البريد...' : 'Search by name or email...'}
          className="ps-10 h-11 rounded-xl bg-secondary/30 border-transparent focus-visible:bg-white transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 text-center bg-red-50/50 rounded-3xl border border-red-100">
          <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
          <p className="font-bold text-destructive text-lg">{ar ? 'فشل تحميل بيانات المشرفين' : 'Failed to load admins'}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filtered.map(admin => {
            const isMe = admin.id === userProfile.id;
            const perms = admin.admin_permissions?.[0] || {};
            // Determine active tags
            const activePermsCount = Object.values(perms).filter(v => v === true).length;
            
            return (
              <div key={admin.id} className={`bg-white rounded-2xl border ${isMe ? 'border-purple-300 shadow-purple-100/50 shadow-md relative overflow-hidden' : 'border-border hover:border-primary/20 hover:shadow-md'} transition-all flex flex-col`}>
                {isMe && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500 to-transparent opacity-20" />}
                
                <div className="p-5 flex-1 relative">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden shadow-sm ${isMe ? 'bg-purple-100 border-purple-200 text-purple-600' : 'bg-gradient-to-br from-secondary to-secondary/50 border-border'}`}>
                         <span className="text-xl font-bold">{(admin.full_name || admin.email || '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base truncate flex items-center gap-2">
                          {admin.full_name || '—'}
                          {isMe && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">{ar ? 'أنت' : 'You'}</span>}
                        </div>
                        <div className="text-sm text-muted-foreground truncate font-medium flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 mt-0.5" />
                          <span className="truncate">{admin.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/20 p-3 rounded-xl border border-border/50 text-xs text-muted-foreground space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {ar ? 'عدد الصلاحيات الممنوحة:' : 'Granted Permissions:'}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${activePermsCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {activePermsCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-secondary/10 border-t border-border flex items-center justify-between">
                  <div className="text-[10px] uppercase text-muted-foreground px-2 font-semibold tracking-wider">
                     {ar ? 'رتبة الإدارة:' : 'Admin Role:'} <span className="text-purple-600 font-bold">{ar ? 'مشرف المنصة' : 'Platform Admin'}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs font-medium px-4 bg-white shadow-sm hover:border-purple-300 hover:text-purple-700" onClick={() => setSelectedAdmin(admin)}>
                        <Settings2 className="w-3.5 h-3.5 me-1.5" />
                        {ar ? 'إدارة الصلاحيات' : 'Permissions'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permissions Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedAdmin(null)}>
          <div className="bg-card rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-border/50 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between bg-gradient-to-r from-secondary to-background">
               <div className="flex flex-col">
                  <span className="text-sm text-purple-600 font-bold tracking-wider uppercase mb-1">{ar ? 'لوحة التحكم بصلاحيات المشرف' : 'Admin Permissions Panel'}</span>
                  <h2 className="text-xl font-bold truncate">{selectedAdmin.full_name || selectedAdmin.email}</h2>
               </div>
               <Button variant="ghost" size="icon" className="rounded-full bg-white/50 hover:bg-white" onClick={() => setSelectedAdmin(null)}>
                 <X className="w-5 h-5 text-black" />
               </Button>
            </div>
            
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-6">
                {ar 
                  ? 'من هنا يمكنك تحديد الأقسام والعمليات التي يُسمح لهذا المشرف بالتحكم بها داخل النظام. إذا قمت بإلغاء التفعيل، سيتم إخفاء القسم عنه تماماً.'
                  : 'Configure which sections and actions this admin is allowed to perform. Disabled sections will be entirely hidden from their dashboard.'}
              </p>
              
              <div className="space-y-4">
                 {Object.keys(PERMISSION_LABELS).map(permKey => {
                    const permsObj = selectedAdmin.admin_permissions?.[0] || {};
                    const isGranted = !!permsObj[permKey];
                    // Disable toggles if the current user lacks 'can_manage_admins' unless they are modifying themselves (even then it's risky).
                    const canEdit = hasAdminManagePerm; 

                    return (
                      <div key={permKey} className={`flex items-center justify-between p-4 rounded-xl border ${isGranted ? 'bg-purple-50/50 border-purple-200' : 'bg-secondary/20 border-border'} transition-colors`}>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-sm ${isGranted ? 'text-purple-900' : 'text-foreground'}`}>{PERMISSION_LABELS[permKey]?.[ar ? 'ar' : 'en']}</span>
                          <span className="text-xs text-muted-foreground">{ar ? 'تفعيل التحكم الشامل لهذا القسم' : 'Enable full management of this section'}</span>
                        </div>
                        <Switch 
                          checked={isGranted}
                          disabled={!canEdit}
                          onCheckedChange={() => handleTogglePermission(permKey, isGranted)}
                        />
                      </div>
                    );
                 })}
              </div>
            </div>

            <div className="p-4 bg-secondary/10 border-t border-border flex justify-between rounded-b-3xl">
               <Button 
                  variant="destructive"
                  disabled={isProcessing || !hasAdminManagePerm || selectedAdmin.id === userProfile?.id}
                  onClick={() => handleRevoke(selectedAdmin.id)}
                  className="shadow-sm shadow-red-200"
               >
                  <Trash2 className="w-4 h-4 me-2" />
                  {ar ? 'إلغاء الترقية (حذف الإدارة)' : 'Revoke Admin Role'}
               </Button>

               <Button variant="outline" onClick={() => setSelectedAdmin(null)}>{ar ? 'إغلاق' : 'Close'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {isAddingAdmin && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={() => !isProcessing && setIsAddingAdmin(false)}>
          <div className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-border/50 flex flex-col p-6" onClick={e => e.stopPropagation()}>
             <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
             </div>
             <h2 className="text-2xl font-bold mb-2">{ar ? 'ترقية مستخدم لمشرف منصة' : 'Promote User to Admin'}</h2>
             <p className="text-sm text-muted-foreground mb-6">
                {ar 
                  ? 'أدخل البريد الإلكتروني الخاص بحساب المستخدم المراد ترقيته. سيبدأ بصلاحيات فارغة يجب تفعيلها.' 
                  : 'Enter the email of an existing user to promote them. They will start with 0 permissions.'}
             </p>
             
             <form onSubmit={handleGrantAccess} className="space-y-4">
                <div className="relative">
                  <Mail className="w-5 h-5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    required 
                    type="email" 
                    value={newAdminEmail} 
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder={ar ? 'example@email.com' : 'example@email.com'}
                    className="ps-10 h-12 rounded-xl"
                  />
                </div>
                
                <div className="flex gap-2 justify-end mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingAdmin(false)} disabled={isProcessing}>
                    {ar ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md">
                    {isProcessing ? (
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (ar ? 'ترقية المستخدم' : 'Promote User')}
                  </Button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
