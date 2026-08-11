import { Plus, Download, MoreHorizontal } from 'lucide-react';

const invoices = [
  { id: 'INV-2043', client: 'Acme Co.', amount: '$8,400', date: 'Aug 10, 2026', due: 'Aug 24, 2026', status: 'Paid' },
  { id: 'INV-2042', client: 'Nimbus Inc.', amount: '$15,200', date: 'Aug 08, 2026', due: 'Aug 22, 2026', status: 'Pending' },
  { id: 'INV-2041', client: 'Lumen Studio', amount: '$3,750', date: 'Aug 05, 2026', due: 'Aug 19, 2026', status: 'Paid' },
  { id: 'INV-2040', client: 'Vertex Ltd.', amount: '$2,000', date: 'Aug 02, 2026', due: 'Aug 16, 2026', status: 'Overdue' },
  { id: 'INV-2039', client: 'Orbit Systems', amount: '$24,500', date: 'Jul 28, 2026', due: 'Aug 11, 2026', status: 'Pending' },
  { id: 'INV-2038', client: 'Pulse Media', amount: '$1,250', date: 'Jul 25, 2026', due: 'Aug 08, 2026', status: 'Paid' },
  { id: 'INV-2037', client: 'Quartz Labs', amount: '$6,800', date: 'Jul 20, 2026', due: 'Aug 03, 2026', status: 'Paid' },
  { id: 'INV-2036', client: 'Forge Industries', amount: '$11,400', date: 'Jul 15, 2026', due: 'Jul 29, 2026', status: 'Overdue' },
];

const statusStyles: Record<string, string> = {
  Paid: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-red-50 text-red-700',
};

const summary = [
  { label: 'Total Billed', value: '$73,300' },
  { label: 'Paid', value: '$20,200' },
  { label: 'Pending', value: '$39,700' },
  { label: 'Overdue', value: '$13,400' },
];

export default function InvoicesPage() {
  return (
    <div className="p-8 animate-fade-in space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400 font-medium">{invoices.length} invoices</p>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Download size={15} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
            <Plus size={16} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Issued</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-4 font-semibold">{inv.id}</td>
                  <td className="px-5 py-4 text-neutral-600">{inv.client}</td>
                  <td className="px-5 py-4 font-medium">{inv.amount}</td>
                  <td className="px-5 py-4 text-neutral-600">{inv.date}</td>
                  <td className="px-5 py-4 text-neutral-600">{inv.due}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors">
                      <MoreHorizontal size={16} className="text-neutral-400" />
                    </button>
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
