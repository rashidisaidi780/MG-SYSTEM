import { useState, type MouseEvent } from 'react';
import { Plus, Download, MoreHorizontal, Edit3, Eye, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Invoice {
  id: string;
  client: string;
  company?: string;
  tin?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  items?: { desc: string; amount: number }[];
  amount: string;
  date: string;
  due: string;
  issuedRaw?: string;
  dueRaw?: string;
  status: 'Paid' | 'Pending' | 'Overdue'| 'Canceled';
  notes?: string;
}

interface ClientOption {
  id: string;
  name: string;
  company: string;
  tin: string;
  email: string;
  phone: string;
  address: string;
  country: string;
}

const clients: ClientOption[] = [
  {
    id: 'acme',
    name: 'Acme Co.',
    company: 'Acme Company',
    tin: 'TIN-783421',
    email: 'john@acme.co',
    phone: '+1 555-0142',
    address: '123 Main St, Suite 300',
    country: 'USA',
  },
  {
    id: 'nimbus',
    name: 'Nimbus Inc.',
    company: 'Nimbus Incorporated',
    tin: 'TIN-684212',
    email: 'emma@nimbus.io',
    phone: '+1 555-0188',
    address: '456 Commerce Ave',
    country: 'USA',
  },
  {
    id: 'lumen',
    name: 'Lumen Studio',
    company: 'Lumen Studio',
    tin: 'TIN-521374',
    email: 'david@lumen.studio',
    phone: '+1 555-0203',
    address: '78 Creative Blvd',
    country: 'USA',
  },
];

const initialInvoices: Invoice[] = [
  {
    id: 'INV-2043',
    client: 'Acme Co.',
    company: 'Acme Company',
    tin: 'TIN-783421',
    email: 'john@acme.co',
    phone: '+1 555-0142',
    address: '123 Main St, Suite 300',
    country: 'USA',
    items: [{ desc: 'Design', amount: 8400 }],
    amount: '$8,400',
    date: 'Aug 10, 2026',
    issuedRaw: '2026-08-10',
    due: 'Aug 24, 2026',
    dueRaw: '2026-08-24',
    status: 'Paid',
    notes: 'Initial design phase',
  },
  {
    id: 'INV-2042',
    client: 'Nimbus Inc.',
    company: 'Nimbus Incorporated',
    tin: 'TIN-684212',
    email: 'emma@nimbus.io',
    phone: '+1 555-0188',
    address: '456 Commerce Ave',
    country: 'USA',
    items: [{ desc: 'Development', amount: 15200 }],
    amount: '$15,200',
    date: 'Aug 08, 2026',
    issuedRaw: '2026-08-08',
    due: 'Aug 22, 2026',
    dueRaw: '2026-08-22',
    status: 'Pending',
    notes: 'Backend development milestone',
  },
];

const statusStyles: Record<Invoice['status'], string> = {
  Paid: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-red-50 text-red-700',
  Canceled: 'bg-gray-50 text-gray-700',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDeleteInvoiceId, setPendingDeleteInvoiceId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    invoiceId: '',
    clientId: '',
    company: '',
    tin: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    items: [{ desc: '', amount: 0 }],
    issued: new Date().toISOString().slice(0, 10),
    due: new Date().toISOString().slice(0, 10),
  });

  const toggleMenu = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = openMenu === id ? null : id;

    if (!next) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }

    const menuWidth = 192;
    const menuHeight = 184;
    const margin = 12;
    const left = Math.min(
      rect.right - 8 + window.scrollX,
      window.scrollX + window.innerWidth - menuWidth - margin,
    );

    const enoughBelow = window.innerHeight - rect.bottom >= menuHeight + margin;
    const top = enoughBelow
      ? rect.bottom + 8 + window.scrollY
      : Math.max(window.scrollY + margin, rect.top - menuHeight - 8 + window.scrollY);

    setOpenMenu(next);
    setMenuPosition({ left, top });
  };

  const handleView = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) setViewInvoice(inv);
    setOpenMenu(null);
  };

  const handleEdit = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) setEditInvoice(inv);
    setOpenMenu(null);
  };

  const handleDownload = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    const content = `Invoice: ${inv.id}\nClient: ${inv.client}\nAmount: ${inv.amount}\nIssued: ${inv.date}\nDue: ${inv.due}\nStatus: ${inv.status}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenMenu(null);
  };

  const saveEdit = () => {
    if (!editInvoice) return;
    setInvoices((current) => current.map((i) => (i.id === editInvoice.id ? editInvoice : i)));
    setEditInvoice(null);
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${y}-${m}-`;
    const monthCount = invoices.filter((i) => i.id.startsWith(prefix)).length + 1;
    const num = String(monthCount).padStart(3, '0');
    return `${prefix}${num}`;
  };

  const openCreate = () => {
    const id = generateInvoiceNumber();
    setCreateForm((f) => ({ ...f, invoiceId: id }));
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm({
      invoiceId: '',
      clientId: '',
      company: '',
      tin: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      items: [{ desc: '', amount: 0 }],
      issued: new Date().toISOString().slice(0, 10),
      due: new Date().toISOString().slice(0, 10),
    });
  };

  const handleClientChange = (clientId: string) => {
    const c = clients.find((x) => x.id === clientId);
    setCreateForm((f) => ({
      ...f,
      clientId,
      company: c?.company ?? '',
      tin: c?.tin ?? '',
      email: c?.email ?? '',
      phone: c?.phone ?? '',
      address: c?.address ?? '',
      country: c?.country ?? '',
    }));
  };

  const addItem = () => setCreateForm((f) => ({ ...f, items: [...f.items, { desc: '', amount: 0 }] }));
  const removeItem = (idx: number) => setCreateForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: 'desc' | 'amount', value: string) => {
    setCreateForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [field]: field === 'amount' ? Number(value) : value } : it)) }));
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

  const saveCreate = () => {
    if (!createForm.invoiceId || !createForm.items.length) return;
    const total = createForm.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const newInv: Invoice = {
      id: createForm.invoiceId,
      client: clients.find((c) => c.id === createForm.clientId)!.name,
      company: createForm.company,
      tin: createForm.tin,
      email: createForm.email,
      phone: createForm.phone,
      address: createForm.address,
      country: createForm.country,
      items: createForm.items,
      amount: formatCurrency(total),
      date: formatDate(createForm.issued),
      issuedRaw: createForm.issued,
      due: formatDate(createForm.due),
      dueRaw: createForm.due,
      status: 'Pending',
      notes: createForm.items.map((it) => `${it.desc} — ${formatCurrency(it.amount)}`).join('\n'),
    };
    setInvoices((cur) => [newInv, ...cur]);
    closeCreate();
  };

  const handleDelete = (id: string) => {
    setInvoices((cur) => cur.filter((x) => x.id !== id));
    setOpenMenu(null);
    setPendingDeleteInvoiceId(null);
  };

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400 font-medium">{invoices.length} invoices</p>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Download size={15} /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
            <Plus size={16} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Issued</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Due Date</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 font-semibold text-neutral-500 text-xs uppercase tracking-wider">Action</th>
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
                  <td className="px-5 py-4 text-right relative">
                    <button className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors" onClick={(e) => toggleMenu(inv.id, e)}>
                      <MoreHorizontal size={16} className="text-neutral-400" />
                    </button>
                    {openMenu === inv.id && menuPosition ? (
                      <div className="fixed z-50 w-48 rounded-xl bg-white border border-neutral-200 shadow-lg py-2" style={{ left: menuPosition.left, top: menuPosition.top }}>
                        <div className="px-3 py-2 text-xs text-neutral-400">Action</div>
                        <button onClick={() => handleView(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Eye size={14} /> View
                        </button>
                        <button onClick={() => handleEdit(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Edit3 size={14} /> Update
                        </button>
                        <button onClick={() => setPendingDeleteInvoiceId(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 text-red-600">
                          <Trash2 size={14} /> Delete
                        </button>
                        <button onClick={() => handleDownload(inv.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                          <Download size={14} /> Download
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteInvoiceId !== null}
        title="Delete invoice?"
        message="This invoice will be permanently removed. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteInvoiceId) handleDelete(pendingDeleteInvoiceId);
        }}
        onCancel={() => setPendingDeleteInvoiceId(null)}
      />

      {viewInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">View invoice</p>
                <h3 className="text-xl font-semibold mt-1">{viewInvoice.id}</h3>
                <p className="text-sm text-neutral-500 mt-1">{viewInvoice.client} — {viewInvoice.company}</p>
              </div>
              <button onClick={() => setViewInvoice(null)} className="text-sm text-neutral-600 hover:bg-neutral-100 rounded-2xl px-3 py-2">Close</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-neutral-400">Client</div>
                  <div className="font-medium">{viewInvoice.client}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Invoice #</div>
                  <div className="font-medium">{viewInvoice.id}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Issued</div>
                  <div className="font-medium">{viewInvoice.date}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Due</div>
                  <div className="font-medium">{viewInvoice.due}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Status</div>
                  <div className="font-medium">{viewInvoice.status}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Amount</div>
                <div className="font-medium">{viewInvoice.amount}</div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-neutral-400">Company</div>
                  <div className="font-medium">{viewInvoice.company}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">TIN</div>
                  <div className="font-medium">{viewInvoice.tin}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Email</div>
                  <div className="font-medium">{viewInvoice.email}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Phone</div>
                  <div className="font-medium">{viewInvoice.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Address</div>
                  <div className="font-medium">{viewInvoice.address}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Country</div>
                  <div className="font-medium">{viewInvoice.country}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Items</div>
                <ul className="list-disc pl-5 text-sm text-neutral-700">
                  {(viewInvoice.items || []).map((it, i) => (
                    <li key={i}>{it.desc} — {formatCurrency(it.amount)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Notes</div>
                <pre className="whitespace-pre-wrap text-sm text-neutral-600">{viewInvoice.notes ?? 'No notes'}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Edit invoice</p>
                <h3 className="text-xl font-semibold mt-1">{editInvoice.id}</h3>
              </div>
              <button onClick={() => setEditInvoice(null)} className="text-sm text-neutral-600 hover:bg-neutral-100 rounded-2xl px-3 py-2">Cancel</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">
                Client
                <input value={editInvoice.client} onChange={(e) => setEditInvoice({ ...editInvoice, client: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Company
                  <input value={editInvoice.company ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, company: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  TIN
                  <input value={editInvoice.tin ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, tin: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Email
                  <input value={editInvoice.email ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, email: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Phone
                  <input value={editInvoice.phone ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, phone: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Address
                  <input value={editInvoice.address ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, address: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Country
                  <input value={editInvoice.country ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, country: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <label className="text-sm">
                Items
                <div className="space-y-2 mt-1">
                  {(editInvoice.items || []).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={it.desc} onChange={(e) => setEditInvoice({ ...editInvoice, items: (editInvoice.items || []).map((x, i) => i === idx ? { ...x, desc: e.target.value } : x) })} className="flex-1 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <input value={String(it.amount)} onChange={(e) => setEditInvoice({ ...editInvoice, items: (editInvoice.items || []).map((x, i) => i === idx ? { ...x, amount: Number(e.target.value) } : x) })} className="w-32 rounded-2xl border border-neutral-200 px-3 py-2" />
                    </div>
                  ))}
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Issued date
                  <input type="date" value={editInvoice.issuedRaw ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, issuedRaw: e.target.value, date: formatDate(e.target.value) })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-sm">
                  Due date
                  <input type="date" value={editInvoice.dueRaw ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, dueRaw: e.target.value, due: formatDate(e.target.value) })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <label className="text-sm">
                Status
                <select value={editInvoice.status} onChange={(e) => setEditInvoice({ ...editInvoice, status: e.target.value as Invoice['status'] })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </label>
              <label className="text-sm">
                Notes
                <textarea value={editInvoice.notes ?? ''} onChange={(e) => setEditInvoice({ ...editInvoice, notes: e.target.value })} className="w-full rounded-2xl border border-neutral-200 px-3 py-2 mt-1" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditInvoice(null)} className="rounded-3xl border border-neutral-200 px-4 py-2">Cancel</button>
              <button onClick={saveEdit} className="rounded-3xl bg-black text-white px-4 py-2">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Create invoice</p>
                <h3 className="text-xl font-semibold mt-1">{createForm.invoiceId || 'New invoice'}</h3>
              </div>
              <button onClick={closeCreate} className="text-sm text-neutral-600 hover:bg-neutral-100 rounded-2xl px-3 py-2">Cancel</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                Invoice number
                <input value={createForm.invoiceId} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                Client
                <select value={createForm.clientId} onChange={(e) => handleClientChange(e.target.value)} className="w-full rounded-2xl border border-neutral-200 px-3 py-2">
                  <option value="" disabled>Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                Company name
                <input value={createForm.company} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                TIN number
                <input value={createForm.tin} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                Email
                <input value={createForm.email} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                Phone
                <input value={createForm.phone} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                Address
                <input value={createForm.address} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <label className="space-y-2 text-sm">
                Country
                <input value={createForm.country} readOnly className="w-full rounded-2xl border border-neutral-200 px-3 py-2 bg-neutral-50" />
              </label>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-3">
                  {createForm.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input placeholder="Description" value={it.desc} onChange={(e) => updateItem(idx, 'desc', e.target.value)} className="flex-1 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <input placeholder="Amount" type="number" value={it.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} className="w-32 rounded-2xl border border-neutral-200 px-3 py-2" />
                      <button onClick={() => removeItem(idx)} className="p-2 text-red-500 rounded-lg">Remove</button>
                    </div>
                  ))}
                  <button onClick={addItem} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-neutral-200">+ Add item</button>
                </div>
              </div>
              <label className="space-y-2 text-sm">
                Date issued
                <input type="date" value={createForm.issued} onChange={(e) => setCreateForm((f) => ({ ...f, issued: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm">
                Due date
                <input type="date" value={createForm.due} onChange={(e) => setCreateForm((f) => ({ ...f, due: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeCreate} className="rounded-3xl border border-neutral-200 px-4 py-2">Cancel</button>
              <button onClick={saveCreate} className="rounded-3xl bg-black text-white px-4 py-2">Save invoice</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
