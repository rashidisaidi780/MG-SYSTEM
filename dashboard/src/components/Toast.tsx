import { Toast } from '../contexts/ToastContext';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    icon: 'text-emerald-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: 'text-blue-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    icon: 'text-amber-600',
  },
};

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export default function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const style = toastStyles[toast.type];
  const IconComponent = toastIcons[toast.type];

  return (
    <div
      className={`${style.bg} ${style.border} ${style.text} border rounded-2xl p-4 flex items-start gap-3 shadow-lg animate-slide-in-right`}
      role="alert"
    >
      <IconComponent className={`${style.icon} flex-shrink-0 mt-0.5`} size={20} />
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
