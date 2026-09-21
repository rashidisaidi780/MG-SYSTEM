import { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SYSTEM_ACTIVITIES_STORAGE_KEY, type SystemNotificationEventDetail } from '@/utils/systemNotifications';
import { usePersistentState } from '@/utils/persistentState';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface StoredActivity {
  id: string;
  title: string;
  message: string;
  occurredAt: string;
}

interface StoredEvent {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  expiresAt: string | null;
  isNew: boolean;
}

interface StoredProject {
  id: string;
  name: string;
  status: string;
  endDate: string;
}

interface StoredInvoice {
  id: string;
  client: string;
  dueRaw?: string;
  due: string;
  status: string;
}

const initial: Notification[] = [];

const readStorage = <T,>(key: string): T[] => {
  try {
    const stored = localStorage.getItem(`mg_${key}`);
    return stored ? (JSON.parse(stored) as T[]) : [];
  } catch {
    return [];
  }
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const dateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildSourceNotifications = (): Notification[] => {
  const activities = readStorage<StoredActivity>(SYSTEM_ACTIVITIES_STORAGE_KEY.replace('mg_', '')).map((activity) => ({
    id: activity.id,
    title: activity.title,
    message: activity.message,
    time: formatTime(activity.occurredAt),
    read: true,
  }));

  const events = readStorage<StoredEvent>('events')
    .filter((event) => !event.expiresAt || new Date(event.expiresAt).getTime() > Date.now())
    .map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      message: event.description,
      time: formatTime(event.createdAt),
      read: !event.isNew,
    }));

  const projects = readStorage<StoredProject>('projects').map((project) => ({
    id: `project-${project.id}`,
    title: `Project: ${project.name}`,
    message: `${project.status} project${project.endDate ? `, deadline ${project.endDate}` : ''}.`,
    time: 'Project update',
    read: true,
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 30);
  const invoices = readStorage<StoredInvoice>('invoices').flatMap((invoice) => {
    if (invoice.status === 'Paid' || invoice.status === 'Canceled') return [];
    const dueDate = dateOnly(invoice.dueRaw || invoice.due);
    if (!dueDate || dueDate > deadline) return [];
    const expired = dueDate < today;
    return [{
      id: `invoice-alert-${invoice.id}-${invoice.dueRaw || invoice.due}`,
      title: expired ? 'Invoice expired' : 'Invoice due soon',
      message: `${invoice.id} for ${invoice.client} is ${expired ? 'expired' : 'due'} ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
      time: expired ? 'Expired' : 'Due within 30 days',
      read: false,
    }];
  });

  return [...events, ...invoices, ...projects, ...activities];
};

export default function NotificationsPage({ refreshKey, searchQuery = '' }: { refreshKey?: number; searchQuery?: string }) {
  const [items, setItems] = usePersistentState<Notification[]>('notifications', initial);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'all' | 'one'; id?: string } | null>(null);

  const syncSourceNotifications = () => {
    const sourceItems = buildSourceNotifications();
    setItems((current) => {
      const currentById = new Map(current.map((item) => [item.id, item]));
      const merged = sourceItems.map((item) => ({ ...item, read: currentById.get(item.id)?.read ?? item.read }));
      const sourceIds = new Set(sourceItems.map((item) => item.id));
      return [...merged, ...current.filter((item) => !sourceIds.has(item.id))];
    });
  };

  useEffect(() => {
    syncSourceNotifications();
  }, [refreshKey]);

  useEffect(() => {
    const handleSystemNotification = (event: Event) => {
      const { title, message } = (event as CustomEvent<SystemNotificationEventDetail>).detail;
      const timeLabel = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      setItems((current) => [
        {
          id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title,
          message,
          time: timeLabel,
          read: false,
        },
        ...current,
      ]);
    };

    window.addEventListener('system-notification', handleSystemNotification);
    return () => window.removeEventListener('system-notification', handleSystemNotification);
  }, []);

  const markRead = (id: string) => {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, read: true } : it)));
  };

  const toggleRead = (id: string) => {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, read: !it.read } : it)));
  };

  const markAllRead = () => setItems((s) => s.map((it) => ({ ...it, read: true })));
  const deleteAll = () => {
    setItems([]);
    setConfirmDelete(null);
  };
  const deleteOne = (id: string) => {
    setItems((s) => s.filter((it) => it.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-neutral-400 font-medium">{items.length} notifications</p>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Bell /> Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="px-4 py-2 rounded-2xl bg-black text-white text-sm">Mark all read</button>
          <button onClick={() => setConfirmDelete({ kind: 'all' })} className="px-4 py-2 rounded-2xl bg-red-50 text-red-600 text-sm">Delete all</button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className={`flex items-start justify-between gap-4 p-4 rounded-lg border ${n.read ? 'bg-neutral-50 border-neutral-100' : 'bg-white border-neutral-200'} `}>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${n.read ? 'bg-neutral-100 text-neutral-600' : 'bg-black text-white'}`}>
                  <CheckCircle size={16} />
                </div>
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-neutral-500">{n.message}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-neutral-400">{n.time}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleRead(n.id)} className="text-xs text-neutral-600 px-2 py-1 rounded hover:bg-neutral-100">{n.read ? 'Mark unread' : 'Mark read'}</button>
                <button onClick={() => setConfirmDelete({ kind: 'one', id: n.id })} className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-neutral-500 p-6 text-center">No notifications</div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmDelete?.kind === 'all' ? 'Delete all notifications?' : 'Delete notification?'}
        message={
          confirmDelete?.kind === 'all'
            ? 'This will remove every notification from the list. Do you want to continue?'
            : 'This notification will be permanently removed. Do you want to continue?'
        }
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.kind === 'all') deleteAll();
          else if (confirmDelete.id) deleteOne(confirmDelete.id);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
