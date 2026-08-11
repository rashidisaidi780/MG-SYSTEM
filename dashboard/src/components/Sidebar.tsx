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
  Boxes,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'projects'
  | 'clients'
  | 'workers'
  | 'invoices'
  | 'bookings';

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
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
    children: [{ id: 'bookings', label: 'Booking Order', icon: ClipboardList }],
  },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
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

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-neutral-200">
        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
          <span className="text-white font-bold text-sm tracking-tight">MG</span>
        </div>
        <div className="leading-tight">
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
                onClick={() => onNavigate(group.id!)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                  active === group.id
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <group.icon size={18} strokeWidth={1.75} />
                {group.label}
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
                      onClick={() => onNavigate(child.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active === child.id
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
          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-neutral-700">AD</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-[11px] text-neutral-400">admin@makezy.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
