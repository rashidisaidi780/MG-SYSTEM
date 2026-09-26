import { Plus, Calendar, User, Edit3, Trash2, MoreHorizontal, Download } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import officeOrdersService from '@/services/officeOrders';
import { useDepartments } from '@/utils/departments';
import logoImg from '@/assets/logo.jpeg';

interface OfficeOrder {
  id: string;
  department: string;
  subject: string;
  description: string;
  requester: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
}

const initialOrders: OfficeOrder[] = [];

const statusStyles: Record<OfficeOrder['status'], string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Confirmed: 'bg-green-50 text-green-700',
  'In Progress': 'bg-sky-50 text-sky-700',
  Completed: 'bg-neutral-100 text-neutral-600',
  Cancelled: 'bg-red-50 text-red-700',
};

const emptyOrder: OfficeOrder = { id: '', department: '', subject: '', description: '', requester: '', date: '', status: 'Pending', notes: '' };

const getOfficeOrderSaveError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'details' in error) {
    const details = (error as { details?: { errors?: Record<string, string[]>; message?: string } }).details;
    const messages = details?.errors ? Object.values(details.errors).flat() : [];
    if (messages.length) return messages.join(' ');
    if (details?.message) return details.message;
  }
  return 'Unable to save office order to the server';
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default function OfficeOrdersPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [orders, setOrders] = useState<OfficeOrder[]>(initialOrders);
  const [departments] = useDepartments();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formOrder, setFormOrder] = useState<OfficeOrder>(emptyOrder);
  const [viewOrder, setViewOrder] = useState<OfficeOrder | null>(null);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void officeOrdersService.getAll()
      .then((loaded) => setOrders(loaded.map((order) => ({ ...order, subject: order.item, description: order.notes, requester: order.requestedBy, date: order.requestDate, status: order.status === 'Received' ? 'Completed' : order.status === 'Rejected' ? 'Cancelled' : order.status === 'Approved' ? 'Confirmed' : order.status })) as OfficeOrder[]))
      .catch(() => showToast('Unable to load office orders from the server', 'error'));
  }, [showToast]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter((order) =>
      [order.id, order.subject, order.department, order.requester, order.status].some((value) => value.toLowerCase().includes(query)),
    );
  }, [orders, searchQuery]);

  const openForm = (mode: 'add' | 'edit', order?: OfficeOrder) => {
    setFormMode(mode);
    setFormOrder(order ? { ...order } : { ...emptyOrder, id: `OO-${Date.now()}` });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormOrder(emptyOrder);
  };

  const handleSave = () => {
    if (!formOrder.department || !formOrder.subject.trim() || !formOrder.description.trim() || !formOrder.requester.trim() || !formOrder.date) {
      showToast('Please fill in all required office order fields', 'warning');
      return;
    }
    const request = { id: formOrder.id, item: formOrder.subject, quantity: 1, unitPrice: 0, department: formOrder.department, requestedBy: formOrder.requester, requestDate: formOrder.date, status: formOrder.status === 'In Progress' ? 'Ordered' as const : formOrder.status === 'Cancelled' ? 'Rejected' as const : formOrder.status === 'Completed' ? 'Received' as const : formOrder.status === 'Confirmed' ? 'Approved' as const : formOrder.status, notes: `${formOrder.description}\n${formOrder.notes ?? ''}`.trim() };
    const saveRequest = formMode === 'add' ? officeOrdersService.create(request) : officeOrdersService.update(formOrder.id, request);
    void saveRequest.then((saved) => {
      const pageOrder = { ...formOrder, id: saved.id };
      setOrders((current) => formMode === 'add' ? [pageOrder, ...current] : current.map((order) => order.id === pageOrder.id ? pageOrder : order));
      notifySystem(formMode === 'add' ? 'Office order created' : 'Office order updated', `${pageOrder.id} details were saved.`);
      showToast(`Office order "${pageOrder.id}" ${formMode === 'add' ? 'created' : 'updated'} successfully`, 'success');
      closeForm();
    }).catch((error) => showToast(getOfficeOrderSaveError(error), 'error'));
  };

  const handleDelete = (id: string) => {
    const order = orders.find((item) => item.id === id);
    void officeOrdersService.delete(id).then(() => {
      setOrders((current) => current.filter((item) => item.id !== id));
      if (order) {
        notifySystem('Office order deleted', `${order.id} was removed from office orders.`);
        showToast(`Office order "${order.id}" deleted`, 'info');
      }
      setPendingDeleteOrderId(null);
    }).catch(() => showToast('Unable to delete office order from the server', 'error'));
  };

  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const downloadOrder = (order: OfficeOrder) => {
    const reportWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!reportWindow) {
      showToast('Please allow pop-ups to download the office order as a PDF', 'warning');
      return;
    }

    reportWindow.document.write(`<!doctype html>
      <html><head><title>${escapeHtml(order.id)} - Office Order</title><style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { position: relative; margin: 0; color: #171717; font-family: Arial, Helvetica, sans-serif; }
        .watermark { position: fixed; z-index: 0; width: 135mm; height: 135mm; object-fit: contain; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: .045; }
        main, header { position: relative; z-index: 1; }
        header { display: flex; align-items: center; gap: 14px; padding-bottom: 12mm; border-bottom: 2px solid #171717; }
        header img { width: 18mm; height: 18mm; object-fit: contain; }
        h1 { margin: 0 0 4px; font-size: 24px; }
        .muted { margin: 0; color: #737373; font-size: 12px; }
        main { padding-top: 10mm; }
        .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
        .field { padding-bottom: 5mm; border-bottom: 1px solid #e5e5e5; }
        .label { display: block; margin-bottom: 5px; color: #737373; font-size: 10px; text-transform: uppercase; }
        .value { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; }
        @media print { body { background: #fff; } }
      </style></head><body><img class="watermark" src="${logoImg}" alt="" />
        <header><img src="${logoImg}" alt="Makezy Group" /><div><h1>Office Order</h1><p class="muted">${escapeHtml(order.id)}</p></div></header>
        <main><section class="fields">
          <div class="field"><span class="label">Subject</span><div class="value">${escapeHtml(order.subject)}</div></div>
          <div class="field"><span class="label">Status</span><div class="value">${escapeHtml(order.status)}</div></div>
          <div class="field"><span class="label">Department</span><div class="value">${escapeHtml(order.department)}</div></div>
          <div class="field"><span class="label">Requester</span><div class="value">${escapeHtml(order.requester)}</div></div>
          <div class="field"><span class="label">Date</span><div class="value">${escapeHtml(formatDate(order.date))}</div></div>
          <div class="field"><span class="label">Description</span><div class="value">${escapeHtml(order.description)}</div></div>
          <div class="field"><span class="label">Notes</span><div class="value">${escapeHtml(order.notes || 'No notes')}</div></div>
        </section></main>
        <script>const printReport=()=>{window.focus();window.print()};if(document.readyState==='complete')printReport();else{window.addEventListener('load',printReport,{once:true});window.setTimeout(printReport,1000)}</script>
      </body></html>`);
    reportWindow.document.close();
    showToast(`Office order "${order.id}" opened for PDF download`, 'success');
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <p className="text-sm text-neutral-400 font-medium">{filteredOrders.length} office orders</p>
        <button data-mutation-control onClick={() => openForm('add')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"><Plus size={16} /> New Office Order</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm transition-all hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4"><div className="min-w-0"><span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{order.id}</span><h3 className="font-bold text-base mt-1 break-words">{order.subject}</h3><p className="text-sm text-neutral-500 font-medium mt-0.5">{order.department}</p></div><span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>{order.status}</span></div>
            <p className="whitespace-pre-wrap break-words text-sm leading-5 text-neutral-600">{order.description}</p>
            <div className="space-y-2 text-sm text-neutral-600 mt-4"><div className="flex items-center gap-2"><Calendar size={14} className="text-neutral-400" /><span>{formatDate(order.date)}</span></div><div className="flex items-center gap-2"><User size={14} className="text-neutral-400" /><span>{order.requester}</span></div></div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100"><button onClick={() => setViewOrder(order)} className="text-xs font-semibold text-black hover:underline">View details</button><div className="flex items-center gap-1"><button onClick={() => downloadOrder(order)} className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors" title="Download office order" aria-label={`Download office order ${order.id}`}><Download size={16} /></button><button onClick={() => openForm('edit', order)} className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors" title="Edit office order"><Edit3 size={16} /></button><button onClick={() => setPendingDeleteOrderId(order.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors" title="Delete office order"><Trash2 size={16} /></button><button onClick={() => setViewOrder(order)} className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors" title="View office order"><MoreHorizontal size={16} className="text-neutral-400" /></button></div></div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={pendingDeleteOrderId !== null} title="Delete office order?" message="This office order will be permanently removed. Do you want to continue?" confirmText="Yes" cancelText="No" destructive onConfirm={() => { if (pendingDeleteOrderId) handleDelete(pendingDeleteOrderId); }} onCancel={() => setPendingDeleteOrderId(null)} />

      {viewOrder ? <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm"><div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Office order details</p><h3 className="text-xl font-semibold mt-1">{viewOrder.id}</h3></div><button onClick={() => setViewOrder(null)} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Close</button></div><div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2"><div><div className="text-xs text-neutral-400">Department</div><div className="font-medium mt-1">{viewOrder.department}</div></div><div><div className="text-xs text-neutral-400">Status</div><div className="font-medium mt-1">{viewOrder.status}</div></div><div><div className="text-xs text-neutral-400">Subject</div><div className="font-medium mt-1">{viewOrder.subject}</div></div><div><div className="text-xs text-neutral-400">Requester</div><div className="font-medium mt-1">{viewOrder.requester}</div></div><div><div className="text-xs text-neutral-400">Date</div><div className="font-medium mt-1">{formatDate(viewOrder.date)}</div></div><div className="sm:col-span-2"><div className="text-xs text-neutral-400">Description</div><div className="whitespace-pre-wrap break-words font-medium mt-1">{viewOrder.description}</div></div><div className="sm:col-span-2"><div className="text-xs text-neutral-400">Notes</div><div className="whitespace-pre-wrap break-words font-medium mt-1">{viewOrder.notes || 'No notes'}</div></div></div><div className="flex justify-end mt-6"><button onClick={() => { setViewOrder(null); openForm('edit', viewOrder); }} className="rounded-3xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Edit order</button></div></div></div> : null}

      {isFormOpen ? <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm"><div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.24em] text-neutral-400">{formMode === 'add' ? 'New office order' : 'Edit office order'}</p><h3 className="text-xl font-semibold mt-1">{formMode === 'add' ? 'Create office order' : 'Update office order'}</h3></div><button onClick={closeForm} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Cancel</button></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-neutral-700">Order ID<input value={formOrder.id} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Department<select value={formOrder.department} onChange={(e) => setFormOrder((current) => ({ ...current, department: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2"><option value="" disabled>Select department</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">Subject<input value={formOrder.subject} onChange={(e) => setFormOrder((current) => ({ ...current, subject: e.target.value }))} placeholder="Order subject" className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">Description<textarea value={formOrder.description} onChange={(e) => setFormOrder((current) => ({ ...current, description: e.target.value }))} placeholder="Describe the requested office task" className="min-h-28 w-full resize-y rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Requester<input value={formOrder.requester} onChange={(e) => setFormOrder((current) => ({ ...current, requester: e.target.value }))} placeholder="Requester or team" className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Date<input type="date" value={formOrder.date} onChange={(e) => setFormOrder((current) => ({ ...current, date: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label><label className="space-y-2 text-sm font-medium text-neutral-700">Status<select value={formOrder.status} onChange={(e) => setFormOrder((current) => ({ ...current, status: e.target.value as OfficeOrder['status'] }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2"><option>Pending</option><option>Confirmed</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select></label><label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">Notes<textarea value={formOrder.notes ?? ''} onChange={(e) => setFormOrder((current) => ({ ...current, notes: e.target.value }))} placeholder="Add notes (optional)" className="min-h-24 w-full resize-y rounded-2xl border border-neutral-200 px-3 py-2" /></label></div><div className="flex justify-end gap-3 mt-6"><button onClick={closeForm} className="rounded-3xl border border-neutral-200 px-4 py-2 text-sm">Cancel</button><button onClick={handleSave} className="rounded-3xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">{formMode === 'add' ? 'Create order' : 'Save changes'}</button></div></div></div> : null}
    </div>
  );
}
