import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import notificationsService, { type Notification } from '@/services/notifications';

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function NotificationsPage({ searchQuery = '' }: { refreshKey?: number; searchQuery?: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'all' | 'one'; id?: string } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void notificationsService.getAll()
      .then(setItems)
      .catch(() => showToast('Unable to load notifications from the server', 'error'))
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => `${item.title} ${item.message}`.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const markRead = (id: string, read: boolean) => {
    void notificationsService.markAsRead(id, read)
      .then((updated) => setItems((current) => current.map((item) => item.id === id ? updated : item)))
      .catch(() => showToast('Unable to update notification', 'error'));
  };

  const markAllRead = () => {
    void notificationsService.markAllAsRead()
      .then(() => setItems((current) => current.map((item) => ({ ...item, read: true }))))
      .catch(() => showToast('Unable to mark notifications as read', 'error'));
  };

  const deleteOne = (id: string) => {
    void notificationsService.delete(id)
      .then(() => setItems((current) => current.filter((item) => item.id !== id)))
      .catch(() => showToast('Unable to delete notification', 'error'))
      .finally(() => setConfirmDelete(null));
  };

  const deleteAll = () => {
    void notificationsService.deleteAll()
      .then(() => setItems([]))
      .catch(() => showToast('Unable to delete notifications', 'error'))
      .finally(() => setConfirmDelete(null));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-400">{filteredItems.length} notifications</p>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Bell /> Notifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="rounded-2xl bg-black px-4 py-2 text-sm text-white">Mark all read</button>
          <button onClick={() => setConfirmDelete({ kind: 'all' })} className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">Delete all</button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-neutral-500">Loading notifications...</p> : null}
      <div className="space-y-3">
        {filteredItems.map((notification) => (
          <div key={notification.id} className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${notification.read ? 'bg-neutral-50 border-neutral-100' : 'bg-white border-neutral-200'}`}>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${notification.read ? 'bg-neutral-100 text-neutral-600' : 'bg-black text-white'}`}><CheckCircle size={16} /></div>
                <div><div className="font-semibold">{notification.title}</div><div className="text-sm text-neutral-500">{notification.message}</div></div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-neutral-400">{formatTime(notification.timestamp)}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => markRead(notification.id, !notification.read)} className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100">{notification.read ? 'Mark unread' : 'Mark read'}</button>
                <button onClick={() => setConfirmDelete({ kind: 'one', id: notification.id })} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && filteredItems.length === 0 ? <div className="p-6 text-center text-sm text-neutral-500">No notifications</div> : null}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmDelete?.kind === 'all' ? 'Delete all notifications?' : 'Delete notification?'}
        message="This action affects only your notifications. Other users will not be changed."
        confirmText="Yes"
        cancelText="No"
        destructive
        onConfirm={() => confirmDelete?.kind === 'all' ? deleteAll() : confirmDelete?.id && deleteOne(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
