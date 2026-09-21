export interface SystemNotificationEventDetail {
  title: string;
  message: string;
}

export interface SystemActivity {
  id: string;
  title: string;
  message: string;
  occurredAt: string;
}

export const SYSTEM_ACTIVITIES_STORAGE_KEY = 'mg_activities_v2';

export const notifySystem = (title: string, message: string) => {
  if (typeof window === 'undefined') return;

  const activity: SystemActivity = {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    message,
    occurredAt: new Date().toISOString(),
  };

  try {
    const stored = localStorage.getItem(SYSTEM_ACTIVITIES_STORAGE_KEY);
    const activities = stored ? (JSON.parse(stored) as SystemActivity[]) : [];
    localStorage.setItem(SYSTEM_ACTIVITIES_STORAGE_KEY, JSON.stringify([activity, ...activities].slice(0, 10)));
  } catch {
    // Activity tracking should not prevent the requested action from completing.
  }

  window.dispatchEvent(
    new CustomEvent<SystemActivity>('system-activity', {
      detail: activity,
    }),
  );
  window.dispatchEvent(
    new CustomEvent<SystemNotificationEventDetail>('system-notification', {
      detail: { title, message },
    }),
  );
};
