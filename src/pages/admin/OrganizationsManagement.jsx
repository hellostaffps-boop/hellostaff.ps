import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/lib/supabaseAuth';
import { getAdminOrganizationsSafe, verifyOrganization } from '@/lib/adminService';
import { Building2, Search, ChevronLeft, ShieldAlert, CheckCircle, Eye, Trash2, Ban, X, Phone, MapPin, Globe, Clock, Users, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_MAP = {
  active: { ar: 'نشطة', en: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  pending: { ar: 'معلقة', en: 'Pending', color: 'bg-amber-100 text-amber-700' },
  suspended: { ar: 'موقوفة', en: 'Suspended', color: 'bg-red-100 text-red-700' },
  deleted: { ar: 'محذوفة', en: 'Deleted', color: 'bg-gray-100 text-gray-700' },
};

const INDUSTRY_LABELS = {
  cafe: { ar: 'مقهى', en: 'Cafe' },
  restaurant: { ar: 'مطعم', en: 'Restaurant' },
  bar: { ar: 'بار', en: 'Bar' },
  hotel: { ar: 'فندق', en: 'Hotel' },
  catering: { ar: 'تموين', en: 'Catering' },
  food_truck: { ar: 'شاحنة طعام', en: 'Food Truck' },
  bakery: { ar: 'مخبز', en: 'Bakery' },
  other: { ar: 'أخرى', en: 'Other' },
};

const STATUSES = ['all', 'active', 'pending', 'suspended', 'deleted'];

export default function OrganizationsManagement() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const ar = lang === 'ar';

  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const fetchOrgs = () => {
    if (!userProfile) return;
    setLoading(true);
    getAdminOrganizationsSafe(userProfile)
      .then(data => setOrgs(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgs();
  }, [userProfile]);

  const handleStatusUpdate = async (targetOrgId, newStatus) => {
    if (newStatus === 'deleted' && !window.confirm(ar ? 'هل أنت متأكد من حذف المنظمة نهائياً؟' : 'Are you sure you want to permanently delete this organization?')) return;
    
    setUpdating(targetOrgId);
    try {
      const { updateOrganizationStatusAdmin } = await import('@/lib/adminService');
      await updateOrganizationStatusAdmin(userProfile, targetOrgId, newStatus);
      fetchOrgs();
      if (selectedOrg && selectedOrg.id === targetOrgId) {
        setSelectedOrg(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      alert(ar ? "حدث خطأ: تأكد من تشغيل ملف تعديل سياسات الإدارة (SQL)" : "Error: Ensure the Admin RLS SQL script was run.\n" + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    let list = orgs;
    if (statusFilter !== 'all') list = list.filter(o => (o.status || 'active') === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.name || '').toLowerCase().includes(q) ||
        (o.city || '').toLowerCase().includes(q) ||
        (o.owner_email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orgs, statusFilter, search]);

  const statusCounts = useMemo(() => {
    const c = { all: orgs.length };
    STATUSES.slice(1).forEach(s => { c[s] = orgs.filter(o => (o.status || 'active') === s).length; });
    return c;
  }, [orgs]);

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4 mb-6 flex-col sm:flex-row items-start sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/dashboard')} className="shrink-0 rounded-xl">
            <ChevronLeft className={`w-5 h-5 ${ar ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ar ? 'إدارة المنظمات والشركات' : 'Organizations Management'}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
               <Building2 className="w-4 h-4" />
               {orgs.length} {ar ? 'منظمة مسجلة' : 'organizations'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-2 mb-6 flex flex-col xl:flex-row gap-2">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 overflow-x-auto hide-scroll flex-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-col sm:flex-row ${
                statusFilter === s ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
              }`}
            >
              <span>{s === 'all' ? (ar ? 'جميع الحالات' : 'All States') : (STATUS_MAP[s]?.[ar ? 'ar' : 'en'] || s)}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === s ? 'bg-primary/10 text-primary' : 'bg-background'}`}>
                {statusCounts[s] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 lg:w-1/3">
          <Search className="absolute ms-3 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={ar ? 'البحث بالاسم أو المدينة أو المالك...' : 'Search by name, city, or owner...'}
            className="ps-10 h-11 rounded-xl bg-secondary/30 border-transparent focus-visible:bg-white transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 text-center bg-red-50/50 rounded-3xl border border-red-100">
          <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
          <p className="font-bold text-destructive text-lg">{ar ? 'فشل تحميل بيانات المنظمات' : 'Failed to load organizations'}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-secondary/20 rounded-3xl border border-dashed border-border">
          <Building2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-bold text-lg">{ar ? 'لا يوجد نتائج' : 'No results found'}</h3>
          <p className="text-sm text-muted-foreground mt-1">{ar ? 'حاول تعديل خيارات البحث والفلترة' : 'Try adjusting your search filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filtered.map(org => {
            const industryInfo = INDUSTRY_LABELS[org.industry];
            return (
              <div key={org.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all hover:border-primary/20 flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shrink-0 border border-border overflow-hidden shadow-sm">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">{(org.name || '?')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base truncate flex items-center gap-2">
                          {org.name}
                          {org.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="text-sm text-muted-foreground truncate font-medium flex items-center gap-1.5 mt-0.5">
                          {industryInfo?.[ar ? 'ar' : 'en'] || (ar ? 'تصنيف غير محدد' : 'Unspecified category')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 truncate" title={org.owner_email}>
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{org.owner_email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{org.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{org.city || '—'}</span>
                    </div>
                    {org.created_at && (
                      <div className="flex items-center gap-2 truncate text-muted-foreground/80">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{new Date(org.created_at).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-secondary/10 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 px-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_MAP[org.status || 'active']?.color.split(' ')[0]}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${STATUS_MAP[org.status || 'active']?.color.split(' ')[1]}`}>
                      {STATUS_MAP[org.status || 'active']?.[ar ? 'ar' : 'en']}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {!org.verified && (
                      <Button size="sm" variant="outline" className="h-8 text-xs font-medium px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200" onClick={() => verifyOrganization(userProfile, org.id).then(() => setOrgs(prev => prev.map(o => o.id === org.id ? {...o, verified: true} : o))).catch(e => alert(e.message))}>
                        <CheckCircle className="w-3.5 h-3.5 me-1.5" />
                        {ar ? 'توثيق الحساب' : 'Verify'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 text-xs font-medium px-4 bg-white shadow-sm hover:border-primary hover:text-primary" onClick={() => setSelectedOrg(org)}>
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

      {/* Org Details Premium Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedOrg(null)}>
          <div className="bg-card rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-border/50 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="h-32 bg-gradient-to-r from-accent/20 via-primary/10 to-secondary relative">
               {selectedOrg.cover_image_url && <img src={selectedOrg.cover_image_url} className="w-full h-full object-cover mix-blend-overlay opacity-50" />}
               <Button variant="white" size="icon" className="absolute top-4 end-4 w-8 h-8 rounded-full bg-white/50 backdrop-blur hover:bg-white border-0" onClick={() => setSelectedOrg(null)}>
                 <X className="w-4 h-4 text-black" />
               </Button>
            </div>
            
            <div className="px-6 relative pb-6 flex-1 overflow-y-auto hide-scroll">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mt-6 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 border border-border shadow-md shrink-0">
                  <div className="w-full h-full rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
                     {selectedOrg.logo_url ? (
                        <img src={selectedOrg.logo_url} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-3xl font-bold text-primary">{(selectedOrg.name || '?')[0].toUpperCase()}</span>
                     )}
                  </div>
                </div>
                <div className="flex flex-col sm:items-end space-y-2">
                  <span className={`inline-flex self-start sm:self-auto text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_MAP[selectedOrg.status || 'active']?.color}`}>
                    {STATUS_MAP[selectedOrg.status || 'active']?.[ar ? 'ar' : 'en']}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {selectedOrg.name} 
                  {selectedOrg.verified && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                </h2>
                <p className="text-base text-muted-foreground font-medium">{INDUSTRY_LABELS[selectedOrg.industry]?.[ar ? 'ar' : 'en'] || selectedOrg.industry}</p>
                {selectedOrg.description && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                     {selectedOrg.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/50">
                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-primary"><Mail className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'بريد المالك' : 'Owner Email'}</div>
                      <div className="font-medium truncate">{selectedOrg.owner_email || '—'}</div>
                   </div>
                 </div>

                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-amber-500"><Phone className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'رقم الهاتف' : 'Phone'}</div>
                      <div className="font-medium truncate">{selectedOrg.phone || '—'}</div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-green-600"><MapPin className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'المنطقة' : 'Location'}</div>
                      <div className="font-medium truncate">{selectedOrg.city || '—'}</div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-sm">
                   <div className="w-8 h-8 rounded-full bg-white border border-border flex flex-col items-center justify-center shrink-0 shadow-sm text-blue-600"><Globe className="w-3.5 h-3.5" /></div>
                   <div className="min-w-0 flex-1 truncate">
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{ar ? 'الموقع الإلكتروني' : 'Website'}</div>
                      {selectedOrg.website ? (
                         <a href={selectedOrg.website} target="_blank" rel="noreferrer" className="font-medium truncate text-primary hover:underline">
                           {selectedOrg.website.replace(/^https?:\/\//, '')}
                         </a>
                      ) : <span className="font-medium text-muted-foreground">—</span>}
                   </div>
                 </div>
              </div>

              <div className="p-4 bg-secondary/10 border-t border-border flex gap-2 shrink-0 mt-6 rounded-xl">
                 {(selectedOrg.status === 'pending' || selectedOrg.status === 'suspended') && (
                    <Button 
                      disabled={updating === selectedOrg.id}
                      onClick={() => handleStatusUpdate(selectedOrg.id, 'active')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4 me-2" />
                      {ar ? 'تفعيل الحساب' : 'Activate Account'}
                    </Button>
                 )}
                 {(selectedOrg.status === 'active' || !selectedOrg.status) && (
                    <Button 
                      variant="outline"
                      disabled={updating === selectedOrg.id}
                      onClick={() => handleStatusUpdate(selectedOrg.id, 'suspended')}
                      className="flex-1 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 shadow-sm"
                    >
                      <Ban className="w-4 h-4 me-2" />
                      {ar ? 'تعليق / تجميد' : 'Suspend Account'}
                    </Button>
                 )}
                 <Button 
                    variant="destructive"
                    disabled={updating === selectedOrg.id}
                    onClick={() => handleStatusUpdate(selectedOrg.id, 'deleted')}
                    className="px-6 shadow-sm shadow-red-200"
                 >
                    <Trash2 className="w-4 h-4 me-2" />
                    {ar ? 'حذف نهائي' : 'Delete'}
                 </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}