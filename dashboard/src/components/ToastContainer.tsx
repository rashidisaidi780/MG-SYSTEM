import { useToast } from '../contexts/ToastContext';
import ToastComponent from './Toast';
import { createPortal } from 'react-dom';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[9999] flex flex-col items-end gap-3 sm:left-auto sm:right-6 sm:inset-x-auto sm:top-6">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full sm:w-auto sm:max-w-md">
          <ToastComponent toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
