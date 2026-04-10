import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import { getAdminToken } from '@/lib/adminSessionManager';
import { Building2, Search, ChevronLeft, ShieldAlert, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_MAP = {
  active: { ar: 'نشطة', en: 'Active', color: 'bg-green-100 text-green-700' },
  pending: { ar: 'معلقة', en: 'Pending', color: 'bg-amber-100 text-amber-700' },
  suspended: { ar: 'موقوفة', en: 'Suspended', color: 'bg-red-100 text-red-700' },
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

const STATUSES = ['all', 'active', 'pending', 'suspended'];

export default function OrganizationsManagement() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = getAdminToken();
    base44.functions.invoke('getAdminOrganizations', { session_token: token })
      .then(res => setOrgs(res.data?.organizations || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = orgs;
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
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
    STATUSES.slice(1).forEach(s => { c[s] = orgs.filter(o => o.status === s).length; });
    return c;
  }, [orgs]);

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="shrink-0">
          <ChevronLeft className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{ar ? 'إدارة المنظمات' : 'Organizations Management'}</h1>
          <p className="text-sm text-muted-foreground">{orgs.length} {ar ? 'منظمة' : 'organizations'}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-4 overflow-x-auto">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === s ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'all' ? (ar ? 'الجميع' : 'All') : (STATUS_MAP[s]?.[ar ? 'ar' : 'en'] || s)}
            <span className="text-[10px] bg-background px-1 py-0.5 rounded-full">{statusCounts[s] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ar ? 'البحث بالاسم أو المدينة...' : 'Search by name or city...'}
          className="ps-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 text-center">
          <ShieldAlert className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{ar ? 'خطأ في تحميل البيانات' : 'Error loading data'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{ar ? 'لا توجد منظمات' : 'No organizations found'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(org => {
            const statusInfo = STATUS_MAP[org.status];
            const industryInfo = INDUSTRY_LABELS[org.industry];
            return (
              <div key={org.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        {org.name}
                        {org.verified && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[industryInfo?.[ar ? 'ar' : 'en'], org.city].filter(Boolean).join(' · ')}
                      </div>
                      {org.owner_email && (
                        <div className="text-xs text-muted-foreground">{org.owner_email}</div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {statusInfo && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo[ar ? 'ar' : 'en']}
                      </span>
                    )}
                    {org.created_date && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(org.created_date).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {ar ? 'التحقق والإيقاف يتطلبان Cloud Function' : 'Verify/suspend requires Cloud Function'}
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