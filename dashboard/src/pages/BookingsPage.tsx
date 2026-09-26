import { Plus, MoreHorizontal, Calendar, Clock, User, Edit3, Trash2, Download } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import bookingsService from '@/services/bookings';
import clientsService from '@/services/clients';
import logoImg from '@/assets/logo.jpeg';

interface ClientOption {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  assignee: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
}

const initialBookings: Booking[] = [];

const statusStyles: Record<string, string> = {
  Confirmed: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-neutral-100 text-neutral-600',
  Cancelled: 'bg-red-50 text-red-700',
};

const emptyBooking: Booking = {
  id: '',
  client: '',
  service: '',
  date: '',
  time: '',
  assignee: '',
  status: 'Pending',
  notes: '',
};

const getBookingSaveError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'details' in error) {
    const details = (error as { details?: { errors?: Record<string, string[]>; message?: string } }).details;
    const messages = details?.errors ? Object.values(details.errors).flat() : [];
    if (messages.length) return messages.join(' ');
    if (details?.message) return details.message;
  }
  return 'Unable to save booking to the server';
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default function BookingsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formBooking, setFormBooking] = useState<Booking>(emptyBooking);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [pendingDeleteBookingId, setPendingDeleteBookingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void bookingsService.getAll()
      .then((loaded) => setBookings(loaded.map((booking) => ({ ...booking, assignee: booking.assignee ?? '', status: booking.status === 'Canceled' ? 'Cancelled' : booking.status }))))
      .catch(() => showToast('Unable to load bookings from the server', 'error'));
  }, [showToast]);

  useEffect(() => {
    void clientsService.getAll()
      .then((loadedClients) => setClients(loadedClients.map((client) => ({ id: client.id, name: client.name }))))
      .catch(() => showToast('Unable to load clients for booking selection', 'error'));
  }, [showToast]);

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const query = searchQuery.toLowerCase();
    return bookings.filter(
      (booking) =>
        booking.id.toLowerCase().includes(query) ||
        booking.client.toLowerCase().includes(query) ||
        booking.service.toLowerCase().includes(query) ||
        booking.assignee.toLowerCase().includes(query),
    );
  }, [bookings, searchQuery]);

  const openForm = (mode: 'add' | 'edit', booking?: Booking) => {
    setFormMode(mode);
    setFormBooking(booking
      ? { ...booking, client: clients.find((client) => client.name === booking.client)?.id ?? '' }
      : { ...emptyBooking, id: `BO-${Date.now()}` });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormBooking(emptyBooking);
  };

  const handleSave = () => {
    if (!formBooking.client.trim() || !formBooking.service.trim() || !formBooking.date || !formBooking.time || !formBooking.assignee.trim()) {
      showToast('Please fill in all required booking fields', 'warning');
      return;
    }

    const request = { id: formBooking.id, client: formBooking.client, clientId: formBooking.client, service: formBooking.service, assignee: formBooking.assignee, date: formBooking.date, time: formBooking.time, status: formBooking.status === 'Cancelled' ? 'Canceled' as const : formBooking.status, notes: formBooking.notes };
    const saveRequest = formMode === 'add' ? bookingsService.create(request) : bookingsService.update(formBooking.id, request);
    void saveRequest.then((saved) => {
      const pageBooking = { ...formBooking, id: saved.id, client: saved.client, status: saved.status === 'Canceled' ? 'Cancelled' : saved.status } as Booking;
      setBookings((current) => formMode === 'add' ? [pageBooking, ...current] : current.map((booking) => booking.id === pageBooking.id ? pageBooking : booking));
      notifySystem(formMode === 'add' ? 'Booking created' : 'Booking updated', `${pageBooking.id} details were saved.`);
      showToast(`Booking "${pageBooking.id}" ${formMode === 'add' ? 'created' : 'updated'} successfully`, 'success');
      closeForm();
    }).catch((error) => showToast(getBookingSaveError(error), 'error'));
  };

  const handleDelete = (id: string) => {
    const booking = bookings.find((item) => item.id === id);
    void bookingsService.delete(id).then(() => {
      setBookings((current) => current.filter((item) => item.id !== id));
      if (booking) {
        notifySystem('Booking deleted', `${booking.id} was removed from booking orders.`);
        showToast(`Booking "${booking.id}" deleted`, 'info');
      }
      setPendingDeleteBookingId(null);
    }).catch(() => showToast('Unable to delete booking from the server', 'error'));
  };

  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const downloadBooking = (booking: Booking) => {
    const reportWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!reportWindow) {
      showToast('Please allow pop-ups to download the booking order as a PDF', 'warning');
      return;
    }

    reportWindow.document.write(`<!doctype html>
      <html><head><title>${escapeHtml(booking.id)} - Booking Order</title><style>
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
        <header><img src="${logoImg}" alt="Makezy Group" /><div><h1>Booking Order</h1><p class="muted">${escapeHtml(booking.id)}</p></div></header>
        <main><section class="fields">
          <div class="field"><span class="label">Client</span><div class="value">${escapeHtml(booking.client)}</div></div>
          <div class="field"><span class="label">Status</span><div class="value">${escapeHtml(booking.status)}</div></div>
          <div class="field"><span class="label">Service details</span><div class="value">${escapeHtml(booking.service)}</div></div>
          <div class="field"><span class="label">Assignee</span><div class="value">${escapeHtml(booking.assignee)}</div></div>
          <div class="field"><span class="label">Date</span><div class="value">${escapeHtml(formatDate(booking.date))}</div></div>
          <div class="field"><span class="label">Time</span><div class="value">${escapeHtml(formatTime(booking.time))}</div></div>
          <div class="field"><span class="label">Notes</span><div class="value">${escapeHtml(booking.notes || 'No notes')}</div></div>
        </section></main>
        <script>const printReport=()=>{window.focus();window.print()};if(document.readyState==='complete')printReport();else{window.addEventListener('load',printReport,{once:true});window.setTimeout(printReport,1000)}</script>
      </body></html>`);
    reportWindow.document.close();
    showToast(`Booking order "${booking.id}" opened for PDF download`, 'success');
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-neutral-400 font-medium">{filteredBookings.length} booking orders</p>
        <button data-mutation-control onClick={() => openForm('add')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
          <Plus size={16} /> New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{b.id}</span>
                <h3 className="whitespace-pre-wrap break-words font-bold text-base mt-1">{b.service}</h3>
                <p className="text-sm text-neutral-500 font-medium mt-0.5">{b.client}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[b.status]}`}>
                {b.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span>{formatDate(b.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-neutral-400" />
                <span>{formatTime(b.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-neutral-400" />
                <span>{b.assignee}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
              <button onClick={() => setViewBooking(b)} className="text-xs font-semibold text-black hover:underline">View details</button>
              <div className="flex items-center gap-1">
                <button onClick={() => downloadBooking(b)} className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors" title="Download booking order" aria-label={`Download booking order ${b.id}`}>
                  <Download size={16} />
                </button>
                <button data-mutation-control onClick={() => openForm('edit', b)} className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors" title="Edit booking">
                  <Edit3 size={16} />
                </button>
                <button data-mutation-control onClick={() => setPendingDeleteBookingId(b.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors" title="Delete booking">
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setViewBooking(b)} className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors" title="View booking">
                  <MoreHorizontal size={16} className="text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteBookingId !== null}
        title="Delete booking?"
        message="This booking order will be permanently removed. Do you want to continue?"
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (pendingDeleteBookingId) handleDelete(pendingDeleteBookingId);
        }}
        onCancel={() => setPendingDeleteBookingId(null)}
      />

      {viewBooking ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Booking details</p>
                <h3 className="text-xl font-semibold mt-1">{viewBooking.id}</h3>
              </div>
              <button onClick={() => setViewBooking(null)} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div><div className="text-xs text-neutral-400">Client</div><div className="font-medium mt-1">{viewBooking.client}</div></div>
              <div className="sm:col-span-2"><div className="text-xs text-neutral-400">Service details</div><div className="whitespace-pre-wrap break-words font-medium mt-1">{viewBooking.service}</div></div>
              <div><div className="text-xs text-neutral-400">Date</div><div className="font-medium mt-1">{formatDate(viewBooking.date)}</div></div>
              <div><div className="text-xs text-neutral-400">Time</div><div className="font-medium mt-1">{formatTime(viewBooking.time)}</div></div>
              <div><div className="text-xs text-neutral-400">Assignee</div><div className="font-medium mt-1">{viewBooking.assignee}</div></div>
              <div><div className="text-xs text-neutral-400">Status</div><div className="font-medium mt-1">{viewBooking.status}</div></div>
              <div className="sm:col-span-2"><div className="text-xs text-neutral-400">Notes</div><div className="whitespace-pre-wrap font-medium mt-1">{viewBooking.notes || 'No notes'}</div></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setViewBooking(null); openForm('edit', viewBooking); }} className="rounded-3xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Edit booking</button>
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm">
          <div className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">{formMode === 'add' ? 'New booking' : 'Edit booking'}</p>
                <h3 className="text-xl font-semibold mt-1">{formMode === 'add' ? 'Create booking order' : 'Update booking order'}</h3>
              </div>
              <button onClick={closeForm} className="rounded-2xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Cancel</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-neutral-700">Booking ID<input value={formBooking.id} readOnly className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2" /></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">Client<select value={formBooking.client} onChange={(e) => setFormBooking((current) => ({ ...current, client: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2"><option value="" disabled>Select existing client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">Service details<textarea value={formBooking.service} onChange={(e) => setFormBooking((current) => ({ ...current, service: e.target.value }))} placeholder="Enter the service or full booking requirements" className="min-h-28 w-full resize-y rounded-2xl border border-neutral-200 px-3 py-2" /></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">Assignee<input value={formBooking.assignee} onChange={(e) => setFormBooking((current) => ({ ...current, assignee: e.target.value }))} placeholder="Person responsible" className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">Date<input type="date" value={formBooking.date} onChange={(e) => setFormBooking((current) => ({ ...current, date: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">Time<input type="time" value={formBooking.time} onChange={(e) => setFormBooking((current) => ({ ...current, time: e.target.value }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700">Status<select value={formBooking.status} onChange={(e) => setFormBooking((current) => ({ ...current, status: e.target.value as Booking['status'] }))} className="w-full rounded-2xl border border-neutral-200 px-3 py-2"><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></label>
              <label className="space-y-2 text-sm font-medium text-neutral-700 sm:col-span-2">Notes<textarea value={formBooking.notes ?? ''} onChange={(e) => setFormBooking((current) => ({ ...current, notes: e.target.value }))} placeholder="Add booking notes (optional)" className="min-h-24 w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeForm} className="rounded-3xl border border-neutral-200 px-4 py-2 text-sm">Cancel</button>
              <button data-mutation-control onClick={handleSave} className="rounded-3xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">{formMode === 'add' ? 'Create booking' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
