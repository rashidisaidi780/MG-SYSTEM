import { useState, useEffect } from 'react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ConfirmDialog from '@/components/ConfirmDialog';
import ToastContainer from '@/components/ToastContainer';
import { ToastProvider } from '@/contexts/ToastContext';
import { authService, type AuthUser } from '@/services';
import notificationsService from '@/services/notifications';
import DashboardPage from '@/pages/DashboardPage';
import SignInPage from '@/pages/SignInPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ClientsPage from '@/pages/ClientsPage';
import UsersPage from '@/pages/UsersPage';
import DepartmentsPage from '@/pages/DepartmentsPage';
import WorkersPage from '@/pages/WorkersPage';
import InvoicesPage from '@/pages/InvoicesPage';
import BookingsPage from '@/pages/BookingsPage';
import OfficeOrdersPage from '@/pages/OfficeOrdersPage';
import NotificationsPage from '@/pages/NotificationsPage';
import EventsPage from '@/pages/EventsPage';

type StoredUser = {
  username?: string;
  email?: string;
  name?: string;
  type?: string;
  role?: string;
  permissions?: Record<string, string> | string[];
  token?: string;
};

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'mg_last_activity';
const THEME_KEY = 'mg_theme';

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  signin: { title: 'Sign in', subtitle: 'Access your workspace' },
  dashboard: { title: 'Dashboard', subtitle: 'Company overview & key metrics' },
  events: { title: 'Event & Updates', subtitle: 'Latest system events and updates' },
  notifications: { title: 'Notifications', subtitle: 'System notifications & alerts' },
  projects: { title: 'Projects', subtitle: 'Manage all company projects' },
  clients: { title: 'Clients', subtitle: 'Your client directory' },
  users: { title: 'Users', subtitle: 'User accounts & system roles' },
  departments: { title: 'Departments', subtitle: 'Manage departments & people counts' },
  workers: { title: 'Workers', subtitle: 'Team members & staff' },
  invoices: { title: 'Invoices', subtitle: 'Billing & financial records' },
  bookings: { title: 'Booking Orders', subtitle: 'Service bookings & appointments' },
  officeOrders: { title: 'Office Orders', subtitle: 'Manage internal office orders' },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => authService.getStoredUser());
  const [page, setPage] = useState<PageId>(() => authService.isAuthenticated() ? 'dashboard' : 'signin');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const meta = pageMeta[page];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setPage('signin');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem('mg_current_page');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!currentUser || !authService.isAuthenticated()) return;

    let idleTimer: number;
    let lastRecordedActivity = Date.now();
    let sessionExpired = false;

    const expireIdleSession = () => {
      if (sessionExpired) return;
      sessionExpired = true;
      void authService.logout();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem('mg_current_page');
      setCurrentUser(null);
      setPage('signin');
    };

    const scheduleIdleTimeout = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(expireIdleSession, IDLE_TIMEOUT_MS);
    };

    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    if (Number.isFinite(lastActivity) && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
      expireIdleSession();
      return () => undefined;
    }

    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    scheduleIdleTimeout();

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecordedActivity < 30000) return;
      lastRecordedActivity = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      scheduleIdleTimeout();
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const handleSystemNotification = (event: Event) => {
      const { title, message } = (event as CustomEvent<{ title: string; message: string }>).detail;
      void notificationsService.create({ title, message, type: 'info' });
    };

    window.addEventListener('system-notification', handleSystemNotification);
    return () => window.removeEventListener('system-notification', handleSystemNotification);
  }, [currentUser]);

  const handleSignIn = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    localStorage.setItem('mg_current_page', 'dashboard');
    setPage('dashboard');
  };

  const navigateToPage = (nextPage: PageId) => {
    if (nextPage === 'signin') {
      setLogoutConfirmOpen(true);
      return;
    }
    localStorage.setItem('mg_current_page', nextPage);
    setPage(nextPage);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    const t = setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsLoading(false);
      clearTimeout(t);
    }, 1200);
  };

  const canEditCurrentPage = () => {
    if (currentUser?.role === 'Admin' || (Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('*'))) {
      return true;
    }

    const areaByPage: Partial<Record<PageId, string>> = {
      projects: 'Projects',
      clients: 'Clients',
      users: 'Users',
      departments: 'Departments',
      workers: 'Workers',
      invoices: 'Invoices',
      bookings: 'Booking Orders',
      officeOrders: 'Office Orders',
      events: 'Event & Updates',
      notifications: 'Notifications',
    };
    const area = areaByPage[page];
    if (!area || Array.isArray(currentUser?.permissions)) return false;
    return ['Edit', 'Both'].includes(currentUser?.permissions?.[area] || 'None');
  };

  const blockReadOnlyMutation = (event: React.MouseEvent<HTMLElement>) => {
    const clickedButton = (event.target as HTMLElement).closest('button');
    const buttonLabel = clickedButton?.getAttribute('title') || clickedButton?.textContent || '';
    const mutation = (event.target as HTMLElement).closest('[data-mutation-control]') ||
      (clickedButton && /\b(add|create|delete|edit|new|remove|save|update)\b/i.test(buttonLabel) ? clickedButton : null);
    if (mutation && !canEditCurrentPage()) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (page === 'signin') {
    return <SignInPage onSignIn={handleSignIn} />;
  }

  return (
    <ToastProvider>
      <>
        <div className="min-h-screen bg-white flex">
        <Sidebar
          active={page}
          onNavigate={(nextPage) => { navigateToPage(nextPage); setMobileMenuOpen(false); }}
          onLogoutRequest={() => setLogoutConfirmOpen(true)}
          currentUser={currentUser || undefined}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0">
          <Topbar title={meta.title} subtitle={meta.subtitle} onNavigate={navigateToPage} onRefresh={handleRefresh} isLoading={isLoading} searchQuery={searchQuery} onSearchChange={setSearchQuery} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode((current) => !current)} onOpenMenu={() => setMobileMenuOpen(true)} />
          <div key={`${page}-${refreshKey}`} onClickCapture={blockReadOnlyMutation} className="min-h-[calc(100vh-4rem)] animate-book-page">
            {page === 'dashboard' && <DashboardPage />}
            {page === 'events' && <EventsPage searchQuery={searchQuery} />}
            {page === 'notifications' && <NotificationsPage refreshKey={refreshKey} />}
            {page === 'projects' && <ProjectsPage searchQuery={searchQuery} />}
            {page === 'clients' && <ClientsPage searchQuery={searchQuery} />}
            {page === 'users' && <UsersPage searchQuery={searchQuery} />}
            {page === 'departments' && <DepartmentsPage searchQuery={searchQuery} />}
            {page === 'workers' && <WorkersPage searchQuery={searchQuery} />}
            {page === 'invoices' && <InvoicesPage searchQuery={searchQuery} />}
            {page === 'bookings' && <BookingsPage searchQuery={searchQuery} />}
            {page === 'officeOrders' && <OfficeOrdersPage searchQuery={searchQuery} />}
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Log out?"
        message="Are you sure you want to log out of the dashboard?"
        confirmText="Yes"
        cancelText="Stay"
        destructive
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          void authService.logout();
          setCurrentUser(null);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          localStorage.removeItem('mg_current_page');
          localStorage.removeItem('mg_user');
          setPage('signin');
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      <ToastContainer />
      </>
    </ToastProvider>
  );
}
