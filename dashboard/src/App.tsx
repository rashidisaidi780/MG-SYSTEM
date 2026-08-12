import { useState } from 'react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ClientsPage from '@/pages/ClientsPage';
import UsersPage from '@/pages/UsersPage';
import WorkersPage from '@/pages/WorkersPage';
import InvoicesPage from '@/pages/InvoicesPage';
import BookingsPage from '@/pages/BookingsPage';

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Company overview & key metrics' },
  projects: { title: 'Projects', subtitle: 'Manage all company projects' },
  clients: { title: 'Clients', subtitle: 'Your client directory' },
  users: { title: 'Users', subtitle: 'User accounts & system roles' },
  workers: { title: 'Workers', subtitle: 'Team members & staff' },
  invoices: { title: 'Invoices', subtitle: 'Billing & financial records' },
  bookings: { title: 'Booking Orders', subtitle: 'Service bookings & appointments' },
};

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const meta = pageMeta[page];

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar active={page} onNavigate={setPage} />
      <main className="flex-1 min-w-0">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <div key={page} className="min-h-[calc(100vh-4rem)] animate-book-page">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'projects' && <ProjectsPage />}
          {page === 'clients' && <ClientsPage />}
          {page === 'users' && <UsersPage />}
          {page === 'workers' && <WorkersPage />}
          {page === 'invoices' && <InvoicesPage />}
          {page === 'bookings' && <BookingsPage />}
        </div>
      </main>
    </div>
  );
}
