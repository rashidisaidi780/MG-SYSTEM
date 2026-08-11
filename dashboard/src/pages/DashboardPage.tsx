import {
  TrendingUp,
  TrendingDown,
  FolderKanban,
  Users,
  DollarSign,
  ClipboardList,
  ArrowUpRight,
} from 'lucide-react';

const stats = [
  { label: 'Total Revenue', value: '$284,500', delta: '+12.5%', up: true, icon: DollarSign },
  { label: 'Active Projects', value: '24', delta: '+3', up: true, icon: FolderKanban },
  { label: 'Total Clients', value: '156', delta: '+8.2%', up: true, icon: Users },
  { label: 'Pending Orders', value: '12', delta: '-4.1%', up: false, icon: ClipboardList },
];

const recentProjects = [
  { name: 'Brand Redesign — Acme Co.', progress: 78, lead: 'Sarah Chen', due: 'Aug 24' },
  { name: 'Mobile App — Nimbus', progress: 45, lead: 'James Park', due: 'Sep 02' },
  { name: 'Website — Lumen Studio', progress: 92, lead: 'Mia Lopez', due: 'Aug 18' },
  { name: 'Marketing — Vertex', progress: 30, lead: 'Tom Reed', due: 'Sep 15' },
];

const activity = [
  { text: 'New invoice #INV-2043 created', time: '2 min ago', type: 'invoice' },
  { text: 'Project "Mobile App" moved to In Progress', time: '1 hr ago', type: 'project' },
  { text: 'New client onboarded: Nimbus Inc.', time: '3 hrs ago', type: 'client' },
  { text: 'Worker schedule updated for Aug', time: '5 hrs ago', type: 'worker' },
  { text: 'Booking order #BO-118 confirmed', time: '1 day ago', type: 'order' },
];

const revenueBars = [42, 58, 35, 70, 52, 85, 60, 78, 45, 90, 65, 80];

export default function DashboardPage() {
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
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm text-neutral-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base">Revenue Overview</h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">Last 12 months</p>
            </div>
            <button className="text-xs font-semibold text-black flex items-center gap-1 hover:gap-2 transition-all">
              View Report <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {revenueBars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full rounded-t-md bg-neutral-100 group-hover:bg-black transition-colors duration-200"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-neutral-400 font-medium">
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

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

      {/* Projects table */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">Active Projects</h3>
          <button className="text-xs font-semibold text-black hover:underline">See all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider">Project</th>
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider">Lead</th>
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider">Progress</th>
                <th className="pb-3 font-semibold text-neutral-400 text-xs uppercase tracking-wider text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((p) => (
                <tr key={p.name} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="py-3.5 font-medium">{p.name}</td>
                  <td className="py-3.5 text-neutral-600">{p.lead}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-black"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-neutral-600">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-neutral-600 text-right">{p.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
