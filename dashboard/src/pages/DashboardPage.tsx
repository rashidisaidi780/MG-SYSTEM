import { useCallback, useEffect, useState } from 'react';
import { FileText, FolderKanban, Users, ClipboardList, Activity, AlertTriangle } from 'lucide-react';
import { SYSTEM_ACTIVITIES_STORAGE_KEY, type SystemActivity } from '@/utils/systemNotifications';
import { dashboardService, type DashboardSummary } from '@/services/dashboard';
import { TableLoadingState } from '@/components/LoadingState';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activities, setActivities] = useState<SystemActivity[]>(() => {
    try {
      const stored = localStorage.getItem(SYSTEM_ACTIVITIES_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SystemActivity[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleActivity = (event: Event) => {
      setActivities((current) => [
        (event as CustomEvent<SystemActivity>).detail,
        ...current,
      ].slice(0, 10));
    };
    window.addEventListener('system-activity', handleActivity);
    return () => window.removeEventListener('system-activity', handleActivity);
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      setSummary(await dashboardService.getSummary());
      setLoadError(false);
    } catch (error) {
      console.error('Unable to load dashboard data:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const invoiceCount = summary?.invoiceCount ?? 0;
  const clientCount = summary?.clientCount ?? 0;
  const projects = summary?.projectCount ?? 0;
  const orders = (summary?.bookingCount ?? 0) + (summary?.officeOrderCount ?? 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const expiringItems = (summary?.deadlines ?? []).filter((item) => {
    if (item.type === 'Invoice' && ['paid', 'canceled'].includes((item.status ?? '').toLowerCase())) return false;
    if (item.type === 'Project' && Number(item.progress) >= 100) return false;

    const date = new Date(item.date);
    date.setHours(0, 0, 0, 0);
    return item.date && !Number.isNaN(date.getTime()) && date <= thirtyDaysFromNow;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const stats = [
    { label: 'Invoices', value: invoiceCount, icon: FileText },
    { label: 'Projects', value: projects, icon: FolderKanban },
    { label: 'Clients', value: clientCount, icon: Users },
    { label: 'Orders', value: orders, icon: ClipboardList },
  ];
  const isExpiringListScrollable = expiringItems.length > 7;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {loadError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{summary ? 'Dashboard refresh failed. Your last loaded data is still shown.' : 'Dashboard data could not be loaded.'}</span>
          <button type="button" onClick={() => void loadDashboard()} disabled={isLoading} className="font-semibold underline disabled:opacity-60">
            {isLoading ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <Icon size={18} />
            </div>
            {isLoading && !summary
              ? <div role="status" aria-label={`Loading ${label.toLowerCase()} count`} className="mt-2 h-8 w-20 animate-pulse rounded bg-neutral-100" />
              : <p className="text-2xl font-bold">{value}</p>}
            <p className="mt-1 text-sm font-medium text-neutral-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex h-[28rem] flex-col rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={18} />
            <h2 className="text-lg font-semibold">Last 10 activities</h2>
          </div>
          {activities.length ? (
            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-neutral-100 pr-2">
              {activities.map((activity) => (
                <div key={activity.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="mt-1 text-sm text-neutral-500">{activity.message}</p>
                  <p className="mt-1 text-xs text-neutral-400">{formatActivityTime(activity.occurredAt)}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-neutral-500">No activities have been recorded yet.</p>}
        </section>
        <section className="flex h-[28rem] min-h-0 flex-col rounded-xl border border-neutral-200 bg-white p-6 lg:h-auto lg:block">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            <h2 className="text-lg font-semibold">Expired or due in 30 days</h2>
          </div>
          {isLoading && !summary ? (
            <TableLoadingState columns={3} rows={4} label="Loading upcoming deadlines" />
          ) : expiringItems.length ? (
            <div className={isExpiringListScrollable ? 'max-h-[18rem] overflow-y-auto overflow-x-auto' : 'overflow-x-auto'}>
              <table className="w-full text-left text-sm">
                <thead className={isExpiringListScrollable ? 'sticky top-0 z-10 bg-white' : ''}><tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400"><th className="pb-3 pr-3">Type</th><th className="pb-3 pr-3">Description</th><th className="pb-3">Due date</th></tr></thead>
                <tbody>{expiringItems.map((item, index) => { const date = new Date(item.date); const expired = date < today; return <tr key={`${item.type}-${item.description}-${index}`} className="border-b border-neutral-100 last:border-0"><td className="py-3 pr-3 font-medium">{item.type}</td><td className="py-3 pr-3 text-neutral-600">{item.description}</td><td className={`py-3 whitespace-nowrap ${expired ? 'font-semibold text-red-600' : 'text-neutral-600'}`}>{expired ? 'Expired' : 'Due'} {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>; })}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-neutral-500">No expired or expiring items found.</p>}
        </section>
      </div>
    </div>
  );
}

const formatActivityTime = (value: string) => new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
