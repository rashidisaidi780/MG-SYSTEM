import { useState } from 'react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ConfirmDialog from '@/components/ConfirmDialog';
import DashboardPage from '@/pages/DashboardPage';
import SignInPage from '@/pages/SignInPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ClientsPage from '@/pages/ClientsPage';
import UsersPage from '@/pages/UsersPage';
import WorkersPage from '@/pages/WorkersPage';
import InvoicesPage from '@/pages/InvoicesPage';
import BookingsPage from '@/pages/BookingsPage';
import OfficeOrdersPage from '@/pages/OfficeOrdersPage';
import NotificationsPage from '@/pages/NotificationsPage';

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Company overview & key metrics' },
  notifications: { title: 'Notifications', subtitle: 'System notifications & alerts' },
  projects: { title: 'Projects', subtitle: 'Manage all company projects' },
  clients: { title: 'Clients', subtitle: 'Your client directory' },
  users: { title: 'Users', subtitle: 'User accounts & system roles' },
  workers: { title: 'Workers', subtitle: 'Team members & staff' },
  invoices: { title: 'Invoices', subtitle: 'Billing & financial records' },
  bookings: { title: 'Booking Orders', subtitle: 'Service bookings & appointments' },
  officeOrders: { title: 'Office Orders', subtitle: 'Manage internal office orders' },
};

export default function App() {
  const [page, setPage] = useState<PageId>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const meta = pageMeta[page];

  const handleRefresh = () => {
    setIsLoading(true);
    const t = setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsLoading(false);
      clearTimeout(t);
    }, 1200);
  };

  if (page === 'signin') {
    return <SignInPage onSignIn={() => setPage('dashboard')} />;
  }

  return (
    <>
      <div className="min-h-screen bg-white flex">
        <Sidebar
          active={page}
          onNavigate={(nextPage) => {
            if (nextPage === 'signin') {
              setLogoutConfirmOpen(true);
              return;
            }
            setPage(nextPage);
          }}
          onLogoutRequest={() => setLogoutConfirmOpen(true)}
        />
        <main className="flex-1 min-w-0">
          <Topbar title={meta.title} subtitle={meta.subtitle} onNavigate={setPage} onRefresh={handleRefresh} isLoading={isLoading} />
          <div key={page} className="min-h-[calc(100vh-4rem)] animate-book-page">
            {page === 'dashboard' && <DashboardPage />}
            {page === 'notifications' && <NotificationsPage refreshKey={refreshKey} />}
            {page === 'projects' && <ProjectsPage />}
            {page === 'clients' && <ClientsPage />}
            {page === 'users' && <UsersPage />}
            {page === 'workers' && <WorkersPage />}
            {page === 'invoices' && <InvoicesPage />}
            {page === 'bookings' && <BookingsPage />}
            {page === 'officeOrders' && <OfficeOrdersPage />}
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
          setPage('signin');
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}
