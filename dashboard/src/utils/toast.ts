export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export const createToast = (
  message: string,
  type: ToastType = 'info',
  duration: number = 3000,
): Toast => {
  return {
    id: `toast-${Date.now()}-${Math.random()}`,
    message,
    type,
    duration,
  };
};
