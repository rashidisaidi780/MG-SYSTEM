import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FolderKanban,
  Users,
  ClipboardList,
  ArrowUpRight,
  FileText,
} from 'lucide-react';

const stats = [
  {
    label: 'Invoices',
    pending: 2,
    overdue: 1,
    delta: '+2 this month',
    up: false,
    icon: FileText,
  },
  { label: 'Active Projects', value: '24', delta: '+3', up: true, icon: FolderKanban },
  { label: 'Total Clients', value: '156', delta: '+8.2%', up: true, icon: Users },
  { label: 'Pending Orders', value: '12', delta: '-4.1%', up: false, icon: ClipboardList },
];

const expiringItems = [
  {
    name: 'Website — Lumen Studio',
    issue: 'Project deadline approaching',
    expiry: 'Aug 18, 2026',
    type: 'Project',
    status: 'Expired',
  },
  {
    name: 'Invoice INV-2042',
    issue: 'Payment due within one month',
    expiry: 'Aug 22, 2026',
    type: 'Invoice',
    status: 'Due soon',
  },
  {
    name: 'Worker license — Mia Lopez',
    issue: 'Certification expiry',
    expiry: 'Aug 20, 2026',
    type: 'Worker',
    status: 'Due soon',
  },
  {
    name: 'Booking #BO-118',
    issue: 'Booking date approaching',
    expiry: 'Sep 10, 2026',
    type: 'Booking',
    status: 'Due soon',
  },
];

const activity = [
  { text: 'New invoice #INV-2043 created', time: '2 min ago', type: 'invoice' },
  { text: 'Project "Mobile App" moved to In Progress', time: '1 hr ago', type: 'project' },
  { text: 'New client onboarded: Nimbus Inc.', time: '3 hrs ago', type: 'client' },
  { text: 'Worker schedule updated for Aug', time: '5 hrs ago', type: 'worker' },
  { text: 'Booking order #BO-118 confirmed', time: '1 day ago', type: 'order' },
];

const monthlyStats = [
  { month: 'J', projects: 18, clients: 14 },
  { month: 'F', projects: 16, clients: 18 },
  { month: 'M', projects: 20, clients: 22 },
  { month: 'A', projects: 14, clients: 16 },
  { month: 'M', projects: 12, clients: 20 },
  { month: 'J', projects: 22, clients: 24 },
  { month: 'J', projects: 18, clients: 16 },
  { month: 'A', projects: 24, clients: 28 },
  { month: 'S', projects: 14, clients: 18 },
  { month: 'O', projects: 26, clients: 30 },
  { month: 'N', projects: 20, clients: 22 },
  { month: 'D', projects: 28, clients: 26 },
];

const maxChartValue = Math.max(...monthlyStats.flatMap((stat) => [stat.projects, stat.clients]));

export default function DashboardPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <s.icon size={18} className="text-black" strokeWidth={1.75} />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  s.up ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {s.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {s.delta}
              </span>
            </div>
            {s.pending !== undefined || s.overdue !== undefined ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-3xl bg-neutral-50 p-3">
                  <p className="text-2xl font-bold tracking-tight">{s.pending ?? 0}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-400 mt-1">Pending</p>
                </div>
                <div className="flex-1 rounded-3xl bg-red-50 p-3">
                  <p className="text-2xl font-bold tracking-tight text-red-600">{s.overdue ?? 0}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-red-600 mt-1">Overdue</p>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            )}
            <p className="text-sm text-neutral-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project & Client Summary */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base">Project & Client Summary</h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">Chart for existing projects and clients created in the system</p>
            </div>
            <button className="text-xs font-semibold text-black flex items-center gap-1 hover:gap-2 transition-all">
              View Report <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="rounded-3xl bg-slate-50 p-6">
            <div className="h-56 overflow-x-auto">
              <div className="flex items-end gap-4 h-full pb-6">
                {monthlyStats.map((stat) => {
                  const isActive = activeMonth === stat.month;
                  return (
                    <div
                      key={stat.month}
                      tabIndex={0}
                      className="group relative flex h-full flex-col items-center gap-2 min-w-[52px] cursor-pointer outline-none"
                      onMouseEnter={() => setActiveMonth(stat.month)}
                      onMouseLeave={() => setActiveMonth(null)}
                      onFocus={() => setActiveMonth(stat.month)}
                      onBlur={() => setActiveMonth(null)}
                      onTouchStart={() => setActiveMonth(stat.month)}
                      onTouchEnd={() => setActiveMonth(null)}
                    >
                      <div className={`pointer-events-none absolute -top-14 left-1/2 z-10 w-32 -translate-x-1/2 rounded-2xl bg-black/95 px-3 py-2 text-center text-[10px] text-white opacity-0 shadow-lg transition-all duration-200 ease-out ${isActive ? 'opacity-100' : ''}`}>
                        <div className="font-semibold">{stat.month}</div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1 text-slate-100">
                            <span className="h-2.5 w-2.5 rounded-full bg-black" />{stat.projects}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-100">
                            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />{stat.clients}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-full items-end gap-2 w-full">
                        <div
                          className="w-6 rounded-t-full bg-black transition-all duration-200 ease-out group-hover:-translate-y-1 group-focus:-translate-y-1"
                          style={{ height: `${(stat.projects / maxChartValue) * 100}%` }}
                        />
                        <div
                          className="w-6 rounded-t-full bg-sky-400 transition-all duration-200 ease-out group-hover:-translate-y-1 group-focus:-translate-y-1"
                          style={{ height: `${(stat.clients / maxChartValue) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">{stat.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between text-[10px] text-neutral-500">
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-black" /> Projects
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Clients
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Activity */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-bold text-base mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-black mt-1.5" />
                    {i < activity.length - 1 && (
                      <div className="w-px flex-1 bg-neutral-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium leading-snug">{a.text}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts table */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-base">Expiring Items</h3>
            <p className="text-xs text-neutral-400 mt-1">Notifications for items due within one month or already expired</p>
          </div>
          <button className="text-xs font-semibold text-black hover:underline">See all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider">Name</th>
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider">Issue</th>
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider">Type</th>
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider text-right">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {expiringItems.map((item) => (
                <tr key={item.name} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="py-3.5 font-medium">{item.name}</td>
                  <td className="py-3.5 text-neutral-600">{item.issue}</td>
                  <td className="py-3.5 text-neutral-600">{item.type}</td>
                  <td className={`py-3.5 font-semibold text-right ${item.status === 'Expired' ? 'text-red-600' : 'text-amber-600'}`}>
                    {item.expiry}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
