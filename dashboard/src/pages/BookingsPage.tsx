import { Plus, MoreHorizontal, Calendar, Clock, User } from 'lucide-react';

const bookings = [
  { id: 'BO-118', client: 'Acme Co.', service: 'Consultation', date: 'Aug 15, 2026', time: '10:00 AM', assignee: 'Sarah Chen', status: 'Confirmed' },
  { id: 'BO-117', client: 'Nimbus Inc.', service: 'Strategy Session', date: 'Aug 14, 2026', time: '2:30 PM', assignee: 'Tom Reed', status: 'Confirmed' },
  { id: 'BO-116', client: 'Lumen Studio', service: 'Design Review', date: 'Aug 13, 2026', time: '9:00 AM', assignee: 'Mia Lopez', status: 'Pending' },
  { id: 'BO-115', client: 'Vertex Ltd.', service: 'Product Demo', date: 'Aug 12, 2026', time: '3:00 PM', assignee: 'James Park', status: 'Confirmed' },
  { id: 'BO-114', client: 'Orbit Systems', service: 'Technical Audit', date: 'Aug 20, 2026', time: '11:00 AM', assignee: 'Kevin Brooks', status: 'Pending' },
  { id: 'BO-113', client: 'Pulse Media', service: 'Brand Workshop', date: 'Aug 22, 2026', time: '1:00 PM', assignee: 'Mia Lopez', status: 'Confirmed' },
  { id: 'BO-112', client: 'Quartz Labs', service: 'Consultation', date: 'Aug 08, 2026', time: '4:00 PM', assignee: 'Sarah Chen', status: 'Completed' },
  { id: 'BO-111', client: 'Forge Industries', service: 'Strategy Session', date: 'Aug 05, 2026', time: '10:30 AM', assignee: 'Tom Reed', status: 'Cancelled' },
];

const statusStyles: Record<string, string> = {
  Confirmed: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-neutral-100 text-neutral-600',
  Cancelled: 'bg-red-50 text-red-700',
};

export default function BookingsPage() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-neutral-400 font-medium">{bookings.length} booking orders</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Plus size={16} /> New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{b.id}</span>
                <h3 className="font-bold text-base mt-1">{b.service}</h3>
                <p className="text-sm text-neutral-500 font-medium mt-0.5">{b.client}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[b.status]}`}>
                {b.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span>{b.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-neutral-400" />
                <span>{b.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-neutral-400" />
                <span>{b.assignee}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
              <button className="text-xs font-semibold text-black hover:underline">View details</button>
              <button className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors">
                <MoreHorizontal size={16} className="text-neutral-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
