import { useEffect, useState } from 'react';
import { FileText, FolderKanban, Users, ClipboardList, Activity, AlertTriangle } from 'lucide-react';
import { SYSTEM_ACTIVITIES_STORAGE_KEY, type SystemActivity } from '@/utils/systemNotifications';
import invoicesService from '@/services/invoices';
import projectsService, { type Project } from '@/services/projects';
import workersService from '@/services/workers';
import bookingsService from '@/services/bookings';
import officeOrdersService from '@/services/officeOrders';
import { authService } from '@/services/auth';

const readCount = (key: string) => {
  try {
    const value = localStorage.getItem(`mg_${key}`);
    return value ? (JSON.parse(value) as unknown[]).length : 0;
  } catch {
    return 0;
  }
};

export default function DashboardPage() {
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [projectDeadlines, setProjectDeadlines] = useState<Project[]>([]);
  const [contractDeadlines, setContractDeadlines] = useState<{ name: string; date: string }[]>([]);
  const [orderCount, setOrderCount] = useState(0);
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

  useEffect(() => {
    if (!authService.hasPermission('Workers')) return;

    void workersService.getAll({ limit: 100 })
      .then((workers) => setContractDeadlines(workers
        .filter((worker) => worker.contractEndDate)
        .map((worker) => ({ name: worker.name, date: worker.contractEndDate || '' }))))
      .catch((error) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) return;
        setContractDeadlines([]);
      });
  }, []);

  useEffect(() => {
    void invoicesService.getAll()
      .then((invoices) => setInvoiceCount(invoices.length))
      .catch(() => setInvoiceCount(0));
  }, []);

  useEffect(() => {
    if (!authService.hasPermission('Projects')) return;

    void projectsService.getCount()
      .then(setProjectCount)
      .catch((error) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) return;
        setProjectCount(0);
      });

    void projectsService.getAll({ limit: 100 })
      .then(setProjectDeadlines)
      .catch((error) => {
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) return;
        setProjectDeadlines([]);
      });
  }, []);

  useEffect(() => {
    const loadOrderCount = async () => {
      const requests: Promise<unknown[]>[] = [];
      if (authService.hasPermission('Booking Orders')) requests.push(bookingsService.getAll());
      if (authService.hasPermission('Office Orders')) requests.push(officeOrdersService.getAll());

      const results = await Promise.allSettled(requests);
      setOrderCount(results.reduce((total, result) => total + (result.status === 'fulfilled' ? result.value.length : 0), 0));
    };

    void loadOrderCount();
  }, []);

  const projects = projectCount;
  const clients = readCount('clients');
  const orders = orderCount;
  const canViewInvoices = authService.hasPermission('Invoices');
  const canViewProjects = authService.hasPermission('Projects');
  const canViewBookings = authService.hasPermission('Booking Orders');
  const canViewOfficeOrders = authService.hasPermission('Office Orders');
  const canViewWorkers = authService.hasPermission('Workers');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const expiringItems = [
    ...(canViewInvoices ? readRecords('invoices').map((item) => ({ type: 'Invoice', description: `${item.id || 'Invoice'} payment`, date: item.dueRaw || item.due })) : []),
    ...(canViewProjects ? projectDeadlines.map((project) => ({ type: 'Project', description: `${project.name} deadline`, date: project.endDate })) : []),
    ...(canViewBookings ? readRecords('bookings').map((item) => ({ type: 'Booking', description: `${item.id || 'Booking'} appointment`, date: item.date })) : []),
    ...(canViewOfficeOrders ? readRecords('office-orders').map((item) => ({ type: 'Office order', description: `${item.id || 'Office order'} due`, date: item.date })) : []),
    ...(canViewWorkers ? contractDeadlines.map((worker) => ({ type: 'Contract', description: `${worker.name} contract`, date: worker.date })) : []),
  ].filter((item) => {
    const date = new Date(item.date);
    date.setHours(0, 0, 0, 0);
    return item.date && !Number.isNaN(date.getTime()) && date <= thirtyDaysFromNow;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const stats = [
    { label: 'Invoices', value: invoiceCount, icon: FileText },
    { label: 'Projects', value: projects, icon: FolderKanban },
    { label: 'Clients', value: clients, icon: Users },
    { label: 'Orders', value: orders, icon: ClipboardList },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
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
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            <h2 className="text-lg font-semibold">Expired or due in 30 days</h2>
          </div>
          {expiringItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400"><th className="pb-3 pr-3">Type</th><th className="pb-3 pr-3">Description</th><th className="pb-3">Due date</th></tr></thead>
                <tbody>{expiringItems.map((item, index) => { const date = new Date(item.date); const expired = date < today; return <tr key={`${item.type}-${item.description}-${index}`} className="border-b border-neutral-100 last:border-0"><td className="py-3 pr-3 font-medium">{item.type}</td><td className="py-3 pr-3 text-neutral-600">{item.description}</td><td className={`py-3 whitespace-nowrap ${expired ? 'font-semibold text-red-600' : 'text-neutral-600'}`}>{expired ? 'Expired' : 'Due'} {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>; })}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-neutral-500">No expired or expiring items found.</p>}
        </section>
      </div>
    </div>
  );
}

const readRecords = (key: string): Record<string, string>[] => {
  try {
    const value = localStorage.getItem(`mg_${key}`);
    return value ? (JSON.parse(value) as Record<string, string>[]) : [];
  } catch {
    return [];
  }
};

const formatActivityTime = (value: string) => new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
