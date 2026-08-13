export interface SystemNotificationEventDetail {
  title: string;
  message: string;
}

export const notifySystem = (title: string, message: string) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<SystemNotificationEventDetail>('system-notification', {
      detail: { title, message },
    }),
  );
};
