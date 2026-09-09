import { Plus, MoreHorizontal, Calendar, Clock, User, Edit3, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { notifySystem } from '@/utils/systemNotifications';
import { usePersistentState } from '@/utils/persistentState';

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

const existingClients: string[] = [];

export default function BookingsPage({ searchQuery = '' }: { searchQuery?: string }) {
  const [bookings, setBookings] = usePersistentState<Booking[]>('bookings', initialBookings);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formBooking, setFormBooking] = useState<Booking>(emptyBooking);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [pendingDeleteBookingId, setPendingDeleteBookingId] = useState<string | null>(null);
  const { showToast } = useToast();

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
    setFormBooking(booking ? { ...booking } : { ...emptyBooking, id: `BO-${Date.now().toString().slice(-4)}` });
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

    if (formMode === 'add') {
      setBookings((current) => [formBooking, ...current]);
      notifySystem('Booking created', `${formBooking.id} was created for ${formBooking.client}.`);
      showToast(`Booking "${formBooking.id}" created successfully`, 'success');
    } else {
      setBookings((current) => current.map((booking) => booking.id === formBooking.id ? formBooking : booking));
      notifySystem('Booking updated', `${formBooking.id} details were updated.`);
      showToast(`Booking "${formBooking.id}" updated successfully`, 'success');
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    const booking = bookings.find((item) => item.id === id);
    setBookings((current) => current.filter((item) => item.id !== id));
    if (booking) {
      notifySystem('Booking deleted', `${booking.id} was removed from booking orders.`);
      showToast(`Booking "${booking.id}" deleted`, 'info');
    }
    setPendingDeleteBookingId(null);
  };

  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
              <label className="space-y-2 text-sm font-medium text-neutral-700">Client<input value={formBooking.client} onChange={(e) => setFormBooking((current) => ({ ...current, client: e.target.value }))} placeholder="Enter client name" className="w-full rounded-2xl border border-neutral-200 px-3 py-2" /></label>
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
