import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import { getAdminToken } from '@/lib/adminSessionManager';
import { Briefcase, Search, ChevronLeft, ShieldAlert, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const JOB_STATUS = {
  published: { ar: 'منشورة', en: 'Published', color: 'bg-green-100 text-green-700' },
  draft: { ar: 'مسودة', en: 'Draft', color: 'bg-secondary text-muted-foreground' },
  closed: { ar: 'مغلقة', en: 'Closed', color: 'bg-red-100 text-red-700' },
  filled: { ar: 'مكتملة', en: 'Filled', color: 'bg-blue-100 text-blue-700' },
};

const JOB_TYPE_LABELS = {
  barista: { ar: 'باريستا', en: 'Barista' },
  chef: { ar: 'طاهٍ', en: 'Chef' },
  waiter: { ar: 'نادل', en: 'Waiter' },
  cashier: { ar: 'كاشير', en: 'Cashier' },
  host: { ar: 'مضيف', en: 'Host' },
  cleaner: { ar: 'عامل نظافة', en: 'Cleaner' },
  kitchen_helper: { ar: 'مساعد مطبخ', en: 'Kitchen Helper' },
  restaurant_manager: { ar: 'مدير مطعم', en: 'Restaurant Manager' },
};

const APP_STATUS = {
  pending: { ar: 'معلق', en: 'Pending', color: 'bg-amber-100 text-amber-700' },
  reviewing: { ar: 'قيد المراجعة', en: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  shortlisted: { ar: 'مختار', en: 'Shortlisted', color: 'bg-purple-100 text-purple-700' },
  hired: { ar: 'تم التوظيف', en: 'Hired', color: 'bg-green-100 text-green-700' },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const TABS = ['jobs', 'applications'];

export default function JobsModeration() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const ar = lang === 'ar';

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('jobs');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = getAdminToken();
    base44.functions.invoke('getAdminJobs', { session_token: token })
      .then(res => {
        setJobs(res.data?.jobs || []);
        setApplications(res.data?.applications || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const jobStatuses = ['all', 'published', 'draft', 'closed', 'filled'];
  const appStatuses = ['all', 'pending', 'reviewing', 'shortlisted', 'hired', 'rejected'];

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (statusFilter !== 'all') list = list.filter(j => j.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.organization_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, statusFilter, search]);

  const filteredApps = useMemo(() => {
    let list = applications;
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.candidate_name || '').toLowerCase().includes(q) ||
        (a.candidate_email || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, statusFilter, search]);

  const currentStatuses = tab === 'jobs' ? jobStatuses : appStatuses;
  const currentStatusMap = tab === 'jobs' ? JOB_STATUS : APP_STATUS;

  return (
    <div className={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')} className="shrink-0">
          <ChevronLeft className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{ar ? 'الوظائف والطلبات' : 'Jobs & Applications'}</h1>
          <p className="text-sm text-muted-foreground">{jobs.length} {ar ? 'وظيفة' : 'jobs'} · {applications.length} {ar ? 'طلب' : 'applications'}</p>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: ar ? 'منشورة' : 'Published', val: jobs.filter(j => j.status === 'published').length, color: 'text-green-600' },
            { label: ar ? 'مسودة' : 'Draft', val: jobs.filter(j => j.status === 'draft').length, color: 'text-muted-foreground' },
            { label: ar ? 'مغلقة' : 'Closed', val: jobs.filter(j => j.status === 'closed').length, color: 'text-red-600' },
            { label: ar ? 'إجمالي الطلبات' : 'Total Apps', val: applications.length, color: 'text-foreground' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-card rounded-lg border border-border p-3 text-center">
              <div className={`text-xl font-bold ${color}`}>{val}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 mb-4 w-fit">
        <button onClick={() => { setTab('jobs'); setStatusFilter('all'); }} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${tab === 'jobs' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
          <Briefcase className="w-3.5 h-3.5" />
          {ar ? 'الوظائف' : 'Jobs'} ({jobs.length})
        </button>
        <button onClick={() => { setTab('applications'); setStatusFilter('all'); }} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${tab === 'applications' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
          <FileText className="w-3.5 h-3.5" />
          {ar ? 'الطلبات' : 'Applications'} ({applications.length})
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 mb-4 overflow-x-auto">
        {currentStatuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === s ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'all' ? (ar ? 'الكل' : 'All') : (currentStatusMap[s]?.[ar ? 'ar' : 'en'] || s)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ar ? 'بحث...' : 'Search...'}
          className="ps-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12">
          <ShieldAlert className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{ar ? 'خطأ في تحميل البيانات' : 'Error loading data'}</p>
        </div>
      ) : tab === 'jobs' ? (
        filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Briefcase className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{ar ? 'لا توجد وظائف' : 'No jobs found'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredJobs.map(job => {
              const statusInfo = JOB_STATUS[job.status];
              const typeInfo = JOB_TYPE_LABELS[job.job_type];
              return (
                <div key={job.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{job.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {[job.organization_name, typeInfo?.[ar ? 'ar' : 'en']].filter(Boolean).join(' · ')}
                      </div>
                      {job.created_date && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(job.created_date).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {statusInfo && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo[ar ? 'ar' : 'en']}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        filteredApps.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <FileText className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{ar ? 'لا توجد طلبات' : 'No applications found'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredApps.map(app => {
              const statusInfo = APP_STATUS[app.status];
              return (
                <div key={app.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{app.candidate_name || app.candidate_email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {app.job_title} {app.organization_name ? `· ${app.organization_name}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {statusInfo && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo[ar ? 'ar' : 'en']}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}