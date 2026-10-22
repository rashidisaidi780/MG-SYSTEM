import { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Briefcase,
  UserCog,
  FileText,
  ClipboardList,
  ChevronDown,
  Bell,
  Boxes,
  LogOut,
  Activity,
  Building2,
} from 'lucide-react';
import logoImg from '@/assets/logo.jpeg';
import darkLogoImg from '@/assets/Makezy_logo.jpeg';

export type PageId =
  | 'dashboard'
  | 'signin'
  | 'notifications'
  | 'events'
  | 'projects'
  | 'clients'
  | 'contracts'
  | 'users'
  | 'departments'
  | 'workers'
  | 'invoices'
  | 'bookings'
  | 'officeOrders';

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
  onLogoutRequest?: () => void;
  mobileOpen?: boolean;
  desktopOpen?: boolean;
  onClose?: () => void;
  unreadNotificationCount?: number;
  currentUser?: {
    username?: string;
    email?: string;
    role?: string;
    permissions?: Record<string, string> | string[];
  };
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children?: { id: PageId; label: string; icon: React.ElementType }[];
  id?: PageId;
}

const NAV: NavGroup[] = [
  { label: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  {
    label: 'Management',
    icon: Briefcase,
    children: [
      { id: 'projects', label: 'Projects', icon: FolderKanban },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'contracts', label: 'Contracts', icon: FileText },
      { id: 'users', label: 'Users', icon: UserCog },
      { id: 'departments', label: 'Departments', icon: Building2 },
    ],
  },
  {
    label: 'Office',
    icon: Boxes,
    children: [
      { id: 'workers', label: 'Workers', icon: UserCog },
      { id: 'invoices', label: 'Invoices', icon: FileText },
    ],
  },
  {
    label: 'Order',
    icon: ClipboardList,
    children: [
      { id: 'bookings', label: 'Booking Order', icon: ClipboardList },
      { id: 'officeOrders', label: 'Office Order', icon: ClipboardList },
    ],
  },
  {
    label: 'Event & Updates', icon: Activity, id: 'events',
  },
  {
    label: 'Notifications', icon: Bell, id: 'notifications',
  },
];

export default function Sidebar({ active, onNavigate, onLogoutRequest, currentUser, mobileOpen = false, desktopOpen = true, onClose, unreadNotificationCount = 0 }: SidebarProps) {
  const permissionFor = (pageId: PageId) => {
    if (currentUser?.role === 'Admin' || (Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('*'))) return 'Both';
    if (pageId === 'events') {
      const eventPermission = Array.isArray(currentUser?.permissions)
        ? (currentUser.permissions.includes('Event & Updates') ? 'View' : 'None')
        : currentUser?.permissions?.['Event & Updates'];
      return eventPermission && eventPermission !== 'None' ? eventPermission : 'View';
    }
    const areaByPage: Partial<Record<PageId, string>> = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      clients: 'Clients',
      contracts: 'Contracts',
      users: 'Users',
      departments: 'Departments',
      workers: 'Workers',
      invoices: 'Invoices',
      events: 'Event & Updates',
      bookings: 'Booking Orders',
      officeOrders: 'Office Orders',
      notifications: 'Notifications',
    };
    const area = areaByPage[pageId];
    if (!area) return 'None';
    if (Array.isArray(currentUser?.permissions)) return currentUser.permissions.includes(area) ? 'View' : 'None';
    return currentUser?.permissions?.[area] || 'None';
  };

  const initialOpen = (() => {
    const open: Record<string, boolean> = {};
    NAV.forEach((g) => {
      if (g.children?.some((c) => c.id === active)) open[g.label] = true;
    });
    return open;
  })();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  const toggle = (label: string) =>
    setOpenGroups((s) => ({ ...s, [label]: !s[label] }));

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    if (window.matchMedia('(max-width: 767px)').matches) onClose?.();
  };

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-x-0 bottom-0 top-16 z-20 bg-black/45 md:hidden" /> : null}
      <aside className={`fixed bottom-0 left-0 top-16 z-50 flex w-72 shrink-0 flex-col border-r border-neutral-200 bg-white shadow-2xl transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${desktopOpen ? 'md:w-64 md:translate-x-0' : 'md:hidden'}`}>
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-neutral-200">
        <img src={logoImg} alt="Logo" className="w-9 h-9 rounded-lg object-cover dark:hidden" />
        <img src={darkLogoImg} alt="Logo" className="hidden w-9 h-9 rounded-lg object-cover dark:block" />
        <div className="leading-tight flex-1">
          <p className="font-bold text-[15px] tracking-tight">MAKEZY GROUP</p>
          <p className="text-[11px] text-neutral-400 font-medium">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.map((group) => {
          const isGroupActive = group.children?.some((c) => c.id === active);
          const isOpen = openGroups[group.label];

          if (!group.children) {
            return (
              <button
                key={group.label}
                onClick={() => handleNavigate(group.id!)}
                disabled={permissionFor(group.id!) === 'None'}
                title={permissionFor(group.id!) === 'None' ? 'No access assigned' : group.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                  permissionFor(group.id!) === 'None'
                    ? 'cursor-not-allowed text-neutral-300'
                    : active === group.id
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <group.icon size={18} strokeWidth={1.75} />
                <span>{group.label}</span>
                {group.id === 'notifications' && unreadNotificationCount > 0 ? (
                  <span className="ml-auto min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                ) : null}
              </button>
            );
          }

          return (
            <div key={group.label} className="mb-0.5">
              <button
                onClick={() => toggle(group.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isGroupActive ? 'text-black' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <group.icon size={18} strokeWidth={1.75} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 ml-5 pl-3 border-l border-neutral-200 space-y-0.5 animate-slide-down overflow-hidden">
                  {group.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        if (permissionFor(child.id) !== 'None') handleNavigate(child.id);
                      }}
                      disabled={permissionFor(child.id) === 'None'}
                      title={permissionFor(child.id) === 'None' ? 'No access assigned' : child.label}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        permissionFor(child.id) === 'None'
                          ? 'cursor-not-allowed text-neutral-300'
                          : active === child.id
                          ? 'bg-black text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <child.icon size={16} strokeWidth={1.75} />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="User Avatar" className="w-9 h-9 rounded-full object-cover dark:hidden" />
          <img src={darkLogoImg} alt="User Avatar" className="hidden w-9 h-9 rounded-full object-cover dark:block" />
          <div className="leading-tight flex-1">
            <p className="text-sm font-semibold">{currentUser?.username || 'Admin User'}</p>
            <p className="text-[11px] text-neutral-400">{currentUser?.email || 'admin@makezy.com'}</p>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={() => { onClose?.(); onLogoutRequest?.(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
