import { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { SystemNotificationEventDetail } from '@/utils/systemNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initial: Notification[] = [
  { id: 'sys-1', title: 'System started', message: 'Management dashboard is ready.', time: 'now', read: false },
  { id: 'sys-2', title: 'Activity feed enabled', message: 'All system actions are now tracked here.', time: 'now', read: true },
];

export default function NotificationsPage({ refreshKey }: { refreshKey?: number }) {
  const [items, setItems] = useState<Notification[]>(initial);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'all' | 'one'; id?: string } | null>(null);

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

  // when parent signals refresh, simulate fetching and add a refresh note
  useEffect(() => {
    if (refreshKey === undefined) return;
    const id = `n-refresh-${Date.now()}`;
    const note: Notification = {
      id,
      title: 'Data refreshed',
      message: `Data refreshed at ${new Date().toLocaleTimeString()}`,
      time: 'now',
      read: false,
    };
    setItems((s) => [note, ...s]);
  }, [refreshKey]);

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
