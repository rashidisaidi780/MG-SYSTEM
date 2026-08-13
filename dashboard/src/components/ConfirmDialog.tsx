import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl animate-book-modal">
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 flex h-11 w-11 items-center justify-center rounded-2xl ${
              destructive ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-black text-white hover:bg-neutral-900'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
