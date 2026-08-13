import { Plus, ClipboardList, Calendar, User } from 'lucide-react';

const officeOrders = [
  { id: 'OO-001', department: 'HR', subject: 'New employee setup', date: 'Aug 15, 2026', status: 'Pending' },
  { id: 'OO-002', department: 'IT', subject: 'Laptop replacement', date: 'Aug 14, 2026', status: 'Confirmed' },
  { id: 'OO-003', department: 'Facilities', subject: 'Office supplies request', date: 'Aug 13, 2026', status: 'In Progress' },
  { id: 'OO-004', department: 'Finance', subject: 'Expense approval', date: 'Aug 12, 2026', status: 'Completed' },
];

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Confirmed: 'bg-green-50 text-green-700',
  'In Progress': 'bg-sky-50 text-sky-700',
  Completed: 'bg-neutral-100 text-neutral-600',
};

export default function OfficeOrdersPage() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-neutral-400 font-medium">{officeOrders.length} office orders</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Plus size={16} /> New Office Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {officeOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{order.id}</span>
                <h3 className="font-bold text-base mt-1">{order.subject}</h3>
                <p className="text-sm text-neutral-500 font-medium mt-0.5">{order.department}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                {order.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span>{order.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-neutral-400" />
                <span>{order.department}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
              <button className="text-xs font-semibold text-black hover:underline">View details</button>
              <button className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors">
                <ClipboardList size={16} className="text-neutral-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
